import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { getCurrentOrder, getMyOrders, getOrderById, placeOrder, updateOrderStatus, verifyPayment, requestTablePin, approveTablePin, deactivateTableSession, getActiveTableSessions, getMyTableSession, getActiveTableOrders, clearStaleTableOrders, releaseTableSession, getMyTableSessionsHistory, getOwnerTableSessionsHistory } from "../controllers/order.controllers.js"

const orderRouter=express.Router()

orderRouter.post("/place-order",isAuth,placeOrder)
orderRouter.post("/verify-payment",isAuth,verifyPayment)
orderRouter.get("/my-orders",isAuth,getMyOrders)
orderRouter.get("/get-current-order",isAuth,getCurrentOrder)
orderRouter.post("/update-status/:orderId/:shopId",isAuth,updateOrderStatus)
orderRouter.get('/get-order-by-id/:orderId',isAuth,getOrderById)

// Table session management routes
orderRouter.post("/table-session/request", isAuth, requestTablePin)
orderRouter.post("/table-session/approve", isAuth, approveTablePin)
orderRouter.post("/table-session/deactivate", isAuth, deactivateTableSession)
orderRouter.post("/table-session/release", isAuth, releaseTableSession)
orderRouter.get("/table-session/active", isAuth, getActiveTableSessions)
orderRouter.get("/table-session/my-session", isAuth, getMyTableSession)
orderRouter.get("/table-session/history", isAuth, getMyTableSessionsHistory)
orderRouter.get("/table-session/owner-history", isAuth, getOwnerTableSessionsHistory)

// Floor plan - only returns non-cleared dine-in orders (for Digital Twin live view)
orderRouter.get("/active-table-orders", isAuth, getActiveTableOrders)

// One-time migration: clears stale legacy table orders (owner only)
orderRouter.post("/clear-stale-table-orders", isAuth, clearStaleTableOrders)

export default orderRouter