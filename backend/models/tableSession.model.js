import mongoose from "mongoose";

const tableSessionSchema = new mongoose.Schema({
    tableNumber: {
        type: String,
        required: true,
        trim: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    verificationPin: {
        type: String,
        required: false
    },
    partySize: {
        type: Number,
        default: 1
    },
    pinRequestStatus: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected', 'unpaid'],
        default: 'none'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }],
    items: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    billAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const TableSession = mongoose.model("TableSession", tableSessionSchema);
export default TableSession;
