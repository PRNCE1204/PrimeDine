import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    category: {
        type: String,
        enum: ["Food", "Service", "Events"],
        required: true
    },
    tags: [{
        type: String
    }],
    text: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
