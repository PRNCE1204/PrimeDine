import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const createEditShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body
        let image;
        if (req.file) {
            console.log(req.file)
            image = await uploadOnCloudinary(req.file.path)
        }
        let shop = await Shop.findOne({ owner: req.userId })
        if (!shop) {
            shop = await Shop.create({
                name, city, state, address, image, owner: req.userId
            })
        } else {
            shop = await Shop.findByIdAndUpdate(shop._id, {
                name, city, state, address, image, owner: req.userId
            }, { new: true })
        }

        await shop.populate("owner cook items")
        return res.status(201).json(shop)
    } catch (error) {
        return res.status(500).json({ message: `create shop error ${error}` })
    }
}

export const getMyShop = async (req, res) => {
    try {
        let shop = await Shop.findOne({ owner: req.userId }).populate("owner cook").populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })
        if (!shop) {
            shop = await Shop.create({
                name: "Prime Dine Restaurant",
                city: "Ahmedabad",
                state: "Gujarat",
                address: "1st Floor, Sachet-4, Opp. Balaji Garden, Ahmedabad",
                image: "dummy.png",
                owner: req.userId
            })
            // Populate the fields to return a valid populated shop object
            shop = await Shop.findById(shop._id).populate("owner cook").populate({
                path: "items",
                options: { sort: { updatedAt: -1 } }
            })
        }
        return res.status(200).json(shop)
    } catch (error) {
        return res.status(500).json({ message: `get my shop error ${error}` })
    }
}

export const getShopByCity = async (req, res) => {
    try {
        const { city } = req.params

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") }
        }).populate('items')
        if (!shops) {
            return res.status(400).json({ message: "shops not found" })
        }
        return res.status(200).json(shops)
    } catch (error) {
        return res.status(500).json({ message: `get shop by city error ${error}` })
    }
}

import bcrypt from "bcryptjs";

export const assignCook = async (req, res) => {
    try {
        const { cookEmail } = req.body;

        const shop = await Shop.findOne({ owner: req.userId });
        if (!shop) {
            return res.status(404).json({ message: "You don't have a shop yet. Please create one first." });
        }

        if (!cookEmail || cookEmail.trim() === "") {
            shop.cook = null;
            await shop.save();
            return res.status(200).json({ message: "Cook unassigned from shop.", shop });
        }

        let cook = await User.findOne({ email: cookEmail.trim() });
        if (!cook) {
            // Auto-create a cook user if they don't exist
            const hashedPassword = await bcrypt.hash("cookPassword123!", 10);
            cook = await User.create({
                fullName: cookEmail.split('@')[0],
                email: cookEmail.trim(),
                password: hashedPassword,
                role: "cook",
                isEmailVerified: true
            });
        } else if (cook.role !== "cook") {
            // Update the existing user's role to 'cook' so they can be assigned
            cook.role = "cook";
            await cook.save();
        }

        shop.cook = cook._id;
        await shop.save();
        await shop.populate("owner cook");

        return res.status(200).json({
            message: `Cook "${cook.fullName}" assigned to your shop successfully! (Password: cookPassword123! if newly created)`,
            shop
        });
    } catch (error) {
        return res.status(500).json({ message: `assignCook error: ${error.message}` });
    }
}

export const getCookShop = async (req, res) => {
    try {
        // Find the shop where this cook is assigned
        const shop = await Shop.findOne({ cook: req.userId }).populate("owner cook");
        if (!shop) {
            return res.status(404).json({ message: "You are not assigned to any shop yet. Ask the owner to assign you." });
        }
        return res.status(200).json(shop);
    } catch (error) {
        return res.status(500).json({ message: `getCookShop error: ${error.message}` });
    }
}