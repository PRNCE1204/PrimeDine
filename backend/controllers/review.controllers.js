import Review from "../models/review.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";

export const submitReview = async (req, res) => {
    try {
        const { rating, category, tags, text, shopId } = req.body;

        let resolvedShopId = shopId;
        if (!resolvedShopId) {
            const firstShop = await Shop.findOne();
            if (firstShop) resolvedShopId = firstShop._id;
        }

        let customerName = "Anonymous Guest";
        if (req.userId) {
            const user = await User.findById(req.userId);
            if (user) {
                customerName = user.fullName || user.name || "Anonymous Guest";
            }
        }

        const newReview = await Review.create({
            user: req.userId || null,
            shop: resolvedShopId,
            customerName,
            rating,
            category,
            tags: tags || [],
            text,
            verified: !!req.userId
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard-updated');
            io.emit('new-review', newReview);
        }

        return res.status(201).json(newReview);
    } catch (error) {
        return res.status(500).json({ message: `submit review error: ${error.message}` });
    }
};

export const getShopReviews = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            // Admin sees ALL reviews (single-restaurant ERP environment)
            const reviews = await Review.find({}).sort({ createdAt: -1 });
            return res.status(200).json(reviews);
        } else {
            const shop = await Shop.findOne({ owner: req.userId });
            if (!shop) {
                return res.status(200).json([]);
            }
            const reviews = await Review.find({ shop: shop._id }).sort({ createdAt: -1 });
            return res.status(200).json(reviews);
        }
    } catch (error) {
        return res.status(500).json({ message: `get shop reviews error: ${error.message}` });
    }
};
