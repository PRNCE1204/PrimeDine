import mongoose from "mongoose";

const shopOrderItemSchema = new mongoose.Schema({
    item:{
        type: mongoose.Schema.Types.Mixed,
        ref: "Item",
        required:true
    },
    name:String,
    price:Number,
    quantity:Number,
    image:String
}, { timestamps: true })

const shopOrderSchema = new mongoose.Schema({
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    subtotal: Number,
    shopOrderItems: [shopOrderItemSchema],
    status:{
        type:String,
        enum:["pending","preparing","ready to pickup","ready","completed"],
        default:"pending"
    },
    estimatedPrepTime: {
        type: Number,
        default: 0
    },
    preparingAt: {
        type: Date,
        default: null
    },
    readyAt: {
        type: Date,
        default: null
    },
    completedAt:{
        type:Date,
        default:null
    }

}, { timestamps: true })

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    paymentMethod: {
        type: String,
        enum: ['cod', "online"],
        required: true
    },
    deliveryAddress: {
        text: String,
        latitude: Number,
        longitude: Number
    },
    totalAmount: {
        type: Number
    }
    ,
    shopOrders: [shopOrderSchema],
    partySize: {
        type: Number,
        default: 1
    },
    tableCleared: {
        type: Boolean,
        default: false
    },
    payment:{
        type:Boolean,
        default:false
    },
    razorpayOrderId:{
        type:String,
        default:""
    },
   razorpayPaymentId:{
    type:String,
       default:""
   }
}, { timestamps: true })

const Order=mongoose.model("Order",orderSchema)
export default Order