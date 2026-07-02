import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop"
    },
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    eventType: {
        type: String,
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    guests: {
        type: Number,
        default: 1
    },
    packageTitle: {
        type: String
    },
    decorationTheme: {
        type: String
    },
    meetingMode: {
        type: String
    },
    budgetRange: {
        type: String
    },
    requirements: {
        type: String
    },
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Decorating", "Decorated & Ready", "Completed", "Cancelled"],
        default: "Pending"
    },
    bill: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ["Unpaid", "Paid"],
        default: "Unpaid"
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number
    },
    review: {
        type: String
    }
}, { timestamps: true });

const Reservation = mongoose.model("Reservation", reservationSchema);
export default Reservation;
