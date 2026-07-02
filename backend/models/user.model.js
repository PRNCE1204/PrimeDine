import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    mobile: {
        type: String,
        unique: true,
        sparse: true   // allows multiple docs with no mobile (e.g. Google-only signups)
    },
    googleId: {
        type: String,
    },
    role: {
        type: String,
        enum: ["customer", "admin", "cook"],
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    resetOtp: {
        type: String
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    otpExpires: {
        type: Date
    },
    socketId: {
        type: String,
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    }

}, { timestamps: true })

userSchema.index({ location: '2dsphere' })

const User = mongoose.model("User", userSchema)
export default User