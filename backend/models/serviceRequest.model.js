import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema({
    tableNumber: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    requestType: {
        type: String,
        enum: ['Water', 'Table Cleaning', 'Tissues', 'Finger Bowl', 'Call Waiter', 'Other'],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
    }
}, { timestamps: true });

const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);
export default ServiceRequest;
