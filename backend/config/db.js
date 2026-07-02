import mongoose from "mongoose"

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 5000
        })
        console.log("db connected")
    } catch (error) {
        console.error("Database connection failed:", error.message)
        console.error("Please verify that your database URL is correct and your IP is whitelisted on MongoDB Atlas.")
        process.exit(1)
    }
}

export default connectDb