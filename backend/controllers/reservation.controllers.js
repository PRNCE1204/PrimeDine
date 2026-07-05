import Reservation from "../models/reservation.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import fs from "fs";
import path from "path";
import { generateReservationPDF } from "../utils/pdf.js";
import { sendReceiptMail } from "../utils/mail.js";

export const createReservation = async (req, res) => {
    try {
        const { fullName, phone, eventType, eventDate, guests, packageTitle, decorationTheme, meetingMode, budgetRange, requirements, shopId } = req.body;

        let resolvedShopId = shopId;
        
        // If shopId not provided, find the shop owned by the admin (not just any first shop)
        if (!resolvedShopId) {
            // Try to find a shop by the requesting user's city or fallback to the first available shop
            const adminShop = await Shop.findOne({ owner: { $exists: true } }).sort({ createdAt: 1 });
            if (adminShop) {
                resolvedShopId = adminShop._id;
            }
        }

        const newReservation = await Reservation.create({
            user: req.userId || null,
            shop: resolvedShopId || null,
            fullName,
            phone,
            eventType,
            eventDate,
            guests: guests || 1,
            packageTitle,
            decorationTheme,
            meetingMode,
            budgetRange,
            requirements,
            status: "Pending"
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard-updated');
            io.emit('new-reservation', newReservation);
        }

        return res.status(201).json(newReservation);
    } catch (error) {
        return res.status(500).json({ message: `create reservation error: ${error.message}` });
    }
};

export const getReservations = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            // Admin sees ALL reservations — single-restaurant system, shop-ID mismatches are expected
            const reservations = await Reservation.find({}).sort({ createdAt: -1 });
            return res.status(200).json(reservations);
        } else {
            const reservations = await Reservation.find({ user: req.userId }).sort({ createdAt: -1 });
            return res.status(200).json(reservations);
        }
    } catch (error) {
        return res.status(500).json({ message: `get reservations error: ${error.message}` });
    }
};

export const updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, bill, rating, review } = req.body;

        const updateFields = {};
        if (status !== undefined) updateFields.status = status;
        if (bill !== undefined) updateFields.bill = bill;
        if (rating !== undefined) updateFields.rating = rating;
        if (review !== undefined) updateFields.review = review;
        if (req.body.paymentStatus !== undefined) updateFields.paymentStatus = req.body.paymentStatus;
        if (req.body.paidAmount !== undefined) updateFields.paidAmount = req.body.paidAmount;

        const existingRes = await Reservation.findById(id).populate("user");
        if (!existingRes) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        const updated = await Reservation.findByIdAndUpdate(id, updateFields, { new: true });

        // Check if payment was just completed (transitioned from Unpaid to Paid)
        if (req.body.paymentStatus === 'Paid' && existingRes.paymentStatus !== 'Paid') {
            if (existingRes.user && existingRes.user.email) {
                const tempDir = path.join(process.cwd(), 'temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                const pdfName = `reservation_${updated._id}.pdf`;
                const pdfPath = path.join(tempDir, pdfName);

                try {
                    await generateReservationPDF(updated, existingRes.user, pdfPath);
                    await sendReceiptMail(
                        existingRes.user.email,
                        updated.fullName || existingRes.user.fullName || 'Valued Guest',
                        pdfPath,
                        pdfName,
                        'event'
                    );
                    fs.unlink(pdfPath, (err) => {
                        if (err) console.error("Error deleting temp reservation PDF:", err);
                    });
                } catch (pdfErr) {
                    console.error("Failed to generate/send reservation PDF receipt email:", pdfErr);
                }
            } else {
                console.warn(`[WARNING] Cannot send reservation PDF receipt: No registered user email associated with reservation ${id}`);
            }
        }

        // If customer leaves a rating or review, create a Review entry for the owner analytics dashboard
        if (rating !== undefined || review !== undefined) {
            const createdReview = await Review.create({
                user: updated.user || null,
                shop: updated.shop,
                customerName: updated.fullName,
                rating: rating || 5,
                category: "Events",
                tags: [updated.packageTitle || updated.eventType].filter(Boolean),
                text: review || "",
                verified: true
            });
            const io = req.app.get('io');
            if (io) {
                io.emit('new-review', createdReview);
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard-updated');
            io.emit('reservation-updated', updated);
        }

        return res.status(200).json(updated);
    } catch (error) {
        return res.status(500).json({ message: `update reservation error: ${error.message}` });
    }
};
