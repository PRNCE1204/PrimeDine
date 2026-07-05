import Order from "../models/order.model.js"
import Shop from "../models/shop.model.js"
import User from "../models/user.model.js"
import TableSession from "../models/tableSession.model.js"
import RazorPay from "razorpay"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"
import { generateTableSessionPDF } from "../utils/pdf.js"
import { sendReceiptMail } from "../utils/mail.js"

dotenv.config()
let instance = null;
const hasRazorpayKeys = process.env.RAZORPAY_KEY_ID && 
    !process.env.RAZORPAY_KEY_ID.startsWith('//') && 
    process.env.RAZORPAY_KEY_ID.trim() !== "";

if (hasRazorpayKeys) {
    try {
        instance = new RazorPay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    } catch (err) {
        console.error("Failed to initialize Razorpay client:", err.message);
    }
} else {
    console.warn("Razorpay credentials missing or placeholder. Razorpay payment integration disabled.");
}

export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, totalAmount, tableNumber, tablePin, partySize } = req.body
        if (cartItems.length == 0 || !cartItems) {
            return res.status(400).json({ message: "cart is empty" })
        }

        if (tableNumber) {
            if (!tablePin) {
                return res.status(400).json({ message: "Table PIN is required for dine-in orders." });
            }
            const activeSession = await TableSession.findOne({ tableNumber, isActive: true });
            
            if (!activeSession) {
                return res.status(403).json({ message: `Table ${tableNumber} is not active. Please request a PIN from the app or ask the waiter.` });
            }
            if (activeSession.pinRequestStatus !== 'approved') {
                return res.status(403).json({ message: `Table ${tableNumber} PIN request is pending approval. Please wait for the owner to approve.` });
            }
            if (activeSession.verificationPin !== tablePin) {
                return res.status(403).json({ message: "Invalid Table PIN. Please check your approved PIN or ask the waiter." });
            }

            if (activeSession.user.toString() !== req.userId.toString()) {
                activeSession.user = req.userId;
                await activeSession.save();
            }
        }

        const deliveryAddress = tableNumber 
            ? { text: `Dine-in / Table ${tableNumber}`, latitude: 0, longitude: 0 } 
            : { text: "Takeaway / Pickup", latitude: 0, longitude: 0 };

        const groupItemsByShop = {}

        cartItems.forEach(item => {
            const shopId = item.shop
            if (!groupItemsByShop[shopId]) {
                groupItemsByShop[shopId] = []
            }
            groupItemsByShop[shopId].push(item)
        });

        const shopOrders = await Promise.all(Object.keys(groupItemsByShop).map(async (shopId) => {
            let shop;
            if (shopId.match(/^[0-9a-fA-F]{24}$/)) {
                shop = await Shop.findById(shopId).populate("owner");
            } else {
                const admin = await User.findOne({ role: "admin" });
                if (admin) {
                    shop = await Shop.findOne({ owner: admin._id }).populate("owner");
                }
                if (!shop) {
                    shop = await Shop.findOne().populate("owner");
                }
            }
            if (!shop) {
                // Database is completely empty, create a dummy shop and owner to satisfy schema
                let owner = await User.findOne({ role: "admin" });
                if (!owner) {
                    owner = await User.create({
                        fullName: "Prime Dine Owner",
                        email: "owner@primedine.com",
                        password: "demo",
                        role: "admin"
                    });
                }
                shop = await Shop.create({
                    name: "Prime Dine Restaurant",
                    image: "dummy.png",
                    owner: owner._id,
                    city: "Demo City",
                    state: "Demo State",
                    address: "123 Demo Street"
                });
                shop.owner = owner;
            }
            const items = groupItemsByShop[shopId]
            const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
            
            let ownerId = null;
            if (shop.owner) {
                ownerId = shop.owner._id || shop.owner;
            } else {
                const admin = await User.findOne({ role: "admin" });
                ownerId = admin ? admin._id : null;
            }
            
            return {
                shop: shop._id,
                owner: ownerId,
                subtotal,
                shopOrderItems: items.map((i) => ({
                    item: i.id,
                    price: i.price,
                    quantity: i.quantity,
                    name: i.name,
                    image: i.image
                }))
            }
        }))

        if (paymentMethod == "online") {
            if (!instance) {
                return res.status(400).json({ message: "Online payment gateway is not configured on this server." });
            }
            const razorOrder = await instance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            })
            const newOrder = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                partySize,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false
            })

            return res.status(200).json({
                razorOrder,
                orderId: newOrder._id,
            })
        }

        const newOrder = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            partySize,
            shopOrders
        })

        await newOrder.populate("shopOrders.shop", "name")
        await newOrder.populate("shopOrders.owner", "name socketId")
        await newOrder.populate("user", "name email mobile")

        const io = req.app.get('io')

        if (io) {
            newOrder.shopOrders.forEach(shopOrder => {
                // Broadcast to all clients (Owners and Cooks will filter based on shop ownership)
                io.emit('new-order', {
                    _id: newOrder._id,
                    paymentMethod: newOrder.paymentMethod,
                    user: newOrder.user,
                    shopOrders: shopOrder,
                    createdAt: newOrder.createdAt,
                    payment: newOrder.payment,
                    deliveryAddress: newOrder.deliveryAddress
                });
                io.emit('dashboard-updated');
            });
        }

        return res.status(201).json(newOrder)
    } catch (error) {
        return res.status(500).json({ message: `place order error ${error}` })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, orderId } = req.body
        if (!instance) {
            return res.status(400).json({ message: "Online payment gateway is not configured on this server." });
        }
        const payment = await instance.payments.fetch(razorpay_payment_id)
        if (!payment || payment.status != "captured") {
            return res.status(400).json({ message: "payment not captured" })
        }
        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }

        order.payment = true
        order.razorpayPaymentId = razorpay_payment_id
        await order.save()

        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.owner", "name socketId")
        await order.populate("user", "name email mobile")

        const io = req.app.get('io')

        if (io) {
            order.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner.socketId
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('new-order', {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        shopOrders: shopOrder,
                        createdAt: order.createdAt,
                        payment: order.payment
                    })
                    io.to(ownerSocketId).emit('dashboard-updated')
                }
            });
        }

        return res.status(200).json(order)

    } catch (error) {
        return res.status(500).json({ message: `verify payment  error ${error}` })
    }
}

export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (user.role == "customer") {
            // Return all orders placed by this customer (both active and cleared/historical) so they can view history & leave reviews.
            const orders = await Order.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.owner", "name email mobile")
                .populate("user")

            return res.status(200).json(orders)

        } else if (user.role == "admin") {
            const orders = await Order.find({ "shopOrders.owner": req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("user")

            const filteredOrders = orders.map((order => {
                const so = order.shopOrders.find(o => String(o.owner) == String(req.userId) || String(o.owner._id) == String(req.userId));
                if (!so) return null;
                return {
                    _id: order._id,
                    paymentMethod: order.paymentMethod,
                    user: order.user,
                    shopOrders: so,
                    createdAt: order.createdAt,
                    payment: order.payment,
                    deliveryAddress: order.deliveryAddress,
                    totalAmount: order.totalAmount,
                    partySize: order.partySize
                };
            })).filter(Boolean)

            return res.status(200).json(filteredOrders)

        } else if (user.role == "cook") {
            // KEY FIX: Cooks are assigned to a shop. Orders store the shop OWNER's id,
            // not the cook's id. We look up the shop where cook = this user, then
            // query orders using the shop owner's id.
            const Shop = (await import("../models/shop.model.js")).default;
            const cookShop = await Shop.findOne({ cook: req.userId });

            if (!cookShop) {
                // Cook hasn't been assigned to a shop yet — return empty list with helpful info
                return res.status(200).json([]);
            }

            const ownerId = cookShop.owner;
            const orders = await Order.find({ "shopOrders.owner": ownerId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("user")

            const filteredOrders = orders.map((order => {
                const so = order.shopOrders.find(o => String(o.owner) == String(ownerId) || String(o.owner._id) == String(ownerId));
                if (!so) return null;
                return {
                    _id: order._id,
                    paymentMethod: order.paymentMethod,
                    user: order.user,
                    shopOrders: so,
                    createdAt: order.createdAt,
                    payment: order.payment,
                    deliveryAddress: order.deliveryAddress,
                    totalAmount: order.totalAmount,
                    partySize: order.partySize
                };
            })).filter(Boolean)

            return res.status(200).json(filteredOrders)
        }

    } catch (error) {
        return res.status(500).json({ message: `get User order error ${error}` })
    }
}


export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopId } = req.params
        const { status, estimatedPrepTime } = req.body
        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(404).json({ message: "order not found" })
        }

        const shopOrder = order.shopOrders.find(o => String(o.shop) === String(shopId) || String(o.shop?._id) === String(shopId))
        if (!shopOrder) {
            return res.status(400).json({ message: "shop order not found" })
        }
        shopOrder.status = status
        
        if (status === "preparing") {
            shopOrder.preparingAt = new Date()
            shopOrder.estimatedPrepTime = estimatedPrepTime || 15 // Default 15 min
        }

        if (status === "ready") {
            shopOrder.readyAt = new Date()
        }
        
        if (status === "completed") {
            shopOrder.completedAt = new Date()
        }

        await order.save()
        const updatedShopOrder = order.shopOrders.find(o => String(o.shop) === String(shopId) || String(o.shop?._id) === String(shopId))
        await order.populate("shopOrders.shop", "name")
        await order.populate("user", "socketId")

        const io = req.app.get('io')
        if (io) {
            const userSocketId = order.user.socketId
            if (userSocketId) {
                io.to(userSocketId).emit('order-status-updated', {
                    orderId: order._id,
                    shopId: updatedShopOrder.shop._id,
                    status: updatedShopOrder.status,
                    userId: order.user._id,
                    estimatedPrepTime: updatedShopOrder.estimatedPrepTime,
                    preparingAt: updatedShopOrder.preparingAt
                })
            }
            io.emit('order-updated', {
                orderId: order._id,
                shopId: updatedShopOrder.shop._id,
                status: updatedShopOrder.status,
                estimatedPrepTime: updatedShopOrder.estimatedPrepTime,
                preparingAt: updatedShopOrder.preparingAt
            })
            io.emit('dashboard-updated')
        }

        return res.status(200).json({
            shopOrder: updatedShopOrder
        })

    } catch (error) {
        return res.status(500).json({ message: `order status error ${error}` })
    }
}

export const getCurrentOrder = async (req, res) => {
    try {
        // Return null/empty for current order as delivery logic is removed
        return res.status(200).json(null)
    } catch (error) {
        return res.status(500).json({ message: `getCurrentOrder error ${error}` })
    }
}

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await Order.findById(orderId)
            .populate("user")
            .populate({
                path: "shopOrders.shop",
                model: "Shop"
            })
            .lean()

        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }
        return res.status(200).json(order)
    } catch (error) {
        return res.status(500).json({ message: `get by id order error ${error}` })
    }
}

export const requestTablePin = async (req, res) => {
    try {
        const { tableNumber, partySize } = req.body;
        if (!tableNumber) {
            return res.status(400).json({ message: "tableNumber is required" });
        }

        const guests = partySize ? parseInt(partySize) : 1;

        // Deactivate user's active session on other tables
        await TableSession.updateMany(
            { user: req.userId, tableNumber: { $ne: tableNumber.toString() }, isActive: true },
            { isActive: false }
        );

        let session = await TableSession.findOne({ tableNumber: tableNumber.toString(), isActive: true });

        if (session) {
            const sessionUserId = session.user ? session.user.toString() : '';
            if (sessionUserId && sessionUserId !== req.userId.toString() && session.pinRequestStatus === 'approved') {
                return res.status(403).json({ message: `Table ${tableNumber} is currently occupied by another guest.` });
            }
            session.user = req.userId;
            session.partySize = guests;
            session.pinRequestStatus = 'requested';
            session.verificationPin = undefined;
            await session.save();
        } else {
            session = await TableSession.create({
                tableNumber: tableNumber.toString(),
                user: req.userId,
                partySize: guests,
                pinRequestStatus: 'requested',
                isActive: true
            });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard-updated');
            io.emit('table-session-updated');
            io.emit('table-session-requested', { 
                tableNumber: session.tableNumber, 
                userId: req.userId,
                partySize: guests
            });
        }

        return res.status(200).json(session);
    } catch (error) {
        return res.status(500).json({ message: `requestTablePin error ${error}` });
    }
};

export const approveTablePin = async (req, res) => {
    try {
        const { tableNumber, customPin } = req.body;
        if (!tableNumber) {
            return res.status(400).json({ message: "tableNumber is required" });
        }

        let session = await TableSession.findOne({ tableNumber: tableNumber.toString(), isActive: true });
        if (!session) {
            session = await TableSession.create({
                tableNumber: tableNumber.toString(),
                user: req.userId, // Default to approving user if session wasn't requested
                isActive: true
            });
        }

        const pin = customPin && customPin.trim() !== "" 
            ? customPin.trim() 
            : Math.floor(1000 + Math.random() * 9000).toString();

        session.verificationPin = pin;
        session.pinRequestStatus = 'approved';
        await session.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard-updated');
            io.emit('table-session-updated');
            io.emit('table-session-approved', {
                tableNumber: session.tableNumber,
                pin: pin,
                userId: session.user
            });
        }

        return res.status(200).json(session);
    } catch (error) {
        return res.status(500).json({ message: `approveTablePin error ${error}` });
    }
};

export const deactivateTableSession = async (req, res) => {
    try {
        const { tableNumber } = req.body;
        if (!tableNumber) {
            return res.status(400).json({ message: "tableNumber is required" });
        }

        // Find active table session
        const activeSession = await TableSession.findOne({ tableNumber: tableNumber.toString(), isActive: true });
        
        let itemsList = [];
        let totalBill = 0;
        let orderIds = [];

        if (activeSession) {
            // Find all orders for this table that are not cleared yet
            const tablePattern = `Dine-in / Table ${tableNumber}`;
            const activeOrders = await Order.find({
                "deliveryAddress.text": tablePattern,
                tableCleared: { $ne: true }
            });

            if (activeOrders.length > 0) {
                orderIds = activeOrders.map(o => o._id);
                
                // Map items from these orders
                const itemMap = new Map();
                activeOrders.forEach(order => {
                    const so = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
                    if (so && so.shopOrderItems) {
                        so.shopOrderItems.forEach(i => {
                            const name = i.name || (i.item && i.item.name) || 'Unknown Item';
                            const qty = i.quantity || 1;
                            const price = i.price || (i.item && i.item.price) || 0;
                            
                            if (itemMap.has(name)) {
                                const existing = itemMap.get(name);
                                existing.quantity += qty;
                                itemMap.set(name, existing);
                            } else {
                                itemMap.set(name, { name, quantity: qty, price });
                            }
                        });
                    }
                });

                itemsList = Array.from(itemMap.values());
                totalBill = itemsList.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            }

            // Update the active session with the final consolidated bill items
            activeSession.orders = orderIds;
            activeSession.items = itemsList;
            activeSession.billAmount = totalBill;
            activeSession.isActive = false;
            await activeSession.save();

            // Populate user details to send receipt email
            await activeSession.populate('user');
            if (activeSession.user && activeSession.user.email && activeSession.billAmount > 0 && activeSession.items.length > 0) {
                const tempDir = path.join(process.cwd(), 'temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                const pdfName = `receipt_${activeSession._id}.pdf`;
                const pdfPath = path.join(tempDir, pdfName);

                try {
                    await generateTableSessionPDF(activeSession, activeSession.user, pdfPath);
                    await sendReceiptMail(
                        activeSession.user.email,
                        activeSession.user.fullName || 'Valued Guest',
                        pdfPath,
                        pdfName,
                        'dining'
                    );
                    // Asynchronously delete the file after email is sent
                    fs.unlink(pdfPath, (err) => {
                        if (err) console.error("Error deleting temp PDF:", err);
                    });
                } catch (pdfErr) {
                    console.error("Failed to generate/send table session PDF receipt email:", pdfErr);
                }
            }
        }

        // Backup update to make sure all active sessions on this table are turned inactive
        await TableSession.updateMany({ tableNumber: tableNumber.toString(), isActive: true }, { isActive: false });

        // Mark all orders for this table as cleared and paid
        const tablePattern = `Dine-in / Table ${tableNumber}`;
        await Order.updateMany(
            { "deliveryAddress.text": tablePattern, tableCleared: { $ne: true } },
            { $set: { tableCleared: true, payment: true } }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard-updated');
            io.emit('table-session-updated');
            io.emit('table-session-deactivated', { tableNumber });
        }

        return res.status(200).json({ message: "Table session deactivated and orders cleared successfully." });
    } catch (error) {
        return res.status(500).json({ message: `deactivateTableSession error ${error}` });
    }
};

export const getMyTableSessionsHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const sessions = await TableSession.find({ user: userId, isActive: false })
            .sort({ createdAt: -1 });
        return res.status(200).json(sessions);
    } catch (error) {
        return res.status(500).json({ message: `getMyTableSessionsHistory error ${error}` });
    }
};

export const getOwnerTableSessionsHistory = async (req, res) => {
    try {
        // Find all inactive table sessions with populated user details
        const sessions = await TableSession.find({ isActive: false })
            .populate('user', 'fullName email mobile')
            .sort({ createdAt: -1 });
        return res.status(200).json(sessions);
    } catch (error) {
        return res.status(500).json({ message: `getOwnerTableSessionsHistory error ${error}` });
    }
};


export const releaseTableSession = async (req, res) => {
    try {
        const { tableNumber } = req.body;
        if (!tableNumber) {
            return res.status(400).json({ message: "tableNumber is required" });
        }

        const session = await TableSession.findOneAndUpdate(
            { tableNumber: tableNumber.toString(), isActive: true },
            { $set: { pinRequestStatus: 'unpaid' } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ message: "Active table session not found." });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard-updated');
            io.emit('table-session-updated');
            io.emit('table-session-unpaid', { tableNumber: session.tableNumber });
        }

        return res.status(200).json({ message: "Table session ended. Awaiting payment clearance from owner.", session });
    } catch (error) {
        return res.status(500).json({ message: `releaseTableSession error ${error}` });
    }
};


export const getActiveTableSessions = async (req, res) => {
    try {
        const sessions = await TableSession.find({ isActive: true });
        return res.status(200).json(sessions);
    } catch (error) {
        return res.status(500).json({ message: `getActiveTableSessions error ${error}` });
    }
};

export const getMyTableSession = async (req, res) => {
    try {
        const session = await TableSession.findOne({ 
            user: req.userId, 
            isActive: true,
            pinRequestStatus: { $ne: 'unpaid' }
        });
        return res.status(200).json(session);
    } catch (error) {
        return res.status(500).json({ message: `getMyTableSession error ${error}` });
    }
};

/**
 * Dedicated endpoint for the Owner DigitalTwin floor plan.
 * Returns only dine-in orders that have NOT been cleared (tableCleared != true).
 * This ensures old orders from previous sessions never pollute the live floor view.
 */
export const getActiveTableOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        let ownerUserId = req.userId;
        if (user.role === 'cook') {
            const cookShop = await Shop.findOne({ cook: req.userId });
            if (!cookShop) return res.status(200).json([]);
            ownerUserId = cookShop.owner;
        }

        const orders = await Order.find({
            "shopOrders.owner": ownerUserId,
            tableCleared: { $ne: true },
            "deliveryAddress.text": { $regex: /^Dine-in \/ Table/i }
        })
            .sort({ createdAt: -1 })
            .populate("shopOrders.shop", "name")
            .populate("user");

        const filteredOrders = orders.map(order => ({
            _id: order._id,
            paymentMethod: order.paymentMethod,
            user: order.user,
            shopOrders: order.shopOrders.find(o =>
                String(o.owner) === String(ownerUserId) || String(o.owner?._id) === String(ownerUserId)
            ),
            createdAt: order.createdAt,
            payment: order.payment,
            deliveryAddress: order.deliveryAddress,
            totalAmount: order.totalAmount,
            partySize: order.partySize,
            tableCleared: order.tableCleared
        }));

        return res.status(200).json(filteredOrders);
    } catch (error) {
        return res.status(500).json({ message: `getActiveTableOrders error ${error}` });
    }
};

/**
 * One-time migration endpoint (owner-only).
 * Marks all dine-in orders as tableCleared=true for any table
 * that currently has NO active session. Cleans up legacy data
 * from before the tableCleared feature was introduced.
 */
export const clearStaleTableOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: "Only admins can run this migration." });
        }

        // Get all currently active table sessions (tables that are occupied right now)
        const activeSessions = await TableSession.find({ isActive: true });
        const activeTableNumbers = activeSessions.map(s => s.tableNumber);

        // Build a regex that matches "Dine-in / Table X" for all tables
        // EXCLUDE tables that currently have an active session
        const staleQuery = {
            "shopOrders.owner": req.userId,
            tableCleared: { $ne: true },
            "deliveryAddress.text": { $regex: /^Dine-in \/ Table/i }
        };

        // If there are active tables, exclude their orders from being cleared
        if (activeTableNumbers.length > 0) {
            staleQuery["deliveryAddress.text"] = {
                $regex: /^Dine-in \/ Table/i,
                $nin: activeTableNumbers.map(t => `Dine-in / Table ${t}`)
            };
        }

        const result = await Order.updateMany(staleQuery, { $set: { tableCleared: true } });

        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard-updated');
            io.emit('table-session-updated');
        }

        return res.status(200).json({
            message: `✅ Migration complete. ${result.modifiedCount} stale table order(s) cleared.`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        return res.status(500).json({ message: `clearStaleTableOrders error ${error}` });
    }
};
