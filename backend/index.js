import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import adminSeeder from "./config/adminSeeder.js"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import userRouter from "./routes/user.routes.js"
import itemRouter from "./routes/item.routes.js"
import shopRouter from "./routes/shop.routes.js"
import orderRouter from "./routes/order.routes.js"
import reservationRouter from "./routes/reservation.routes.js"
import reviewRouter from "./routes/review.routes.js"
import serviceRouter from "./routes/service.routes.js"
import http from "http"
import { Server } from "socket.io"
import { socketHandler } from "./socket.js"
import session from "express-session"
import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
        methods: ['POST', 'GET']
    }
})

app.set("io", io)

const port = process.env.PORT || 5000

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// Session middleware (needed for Passport OAuth flow)
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, sameSite: "lax", maxAge: 10 * 60 * 1000 } // lax required for OAuth redirects
}))

// Passport setup
app.use(passport.initialize())
app.use(passport.session())

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8000/api/auth/google/callback",
        passReqToCallback: true
    },
    (req, accessToken, refreshToken, profile, done) => {
        return done(null, profile)
    }
))

// Minimal serialize/deserialize (we use JWT, not session auth)
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/shop", shopRouter)
app.use("/api/item", itemRouter)
app.use("/api/order", orderRouter)
app.use("/api/reservation", reservationRouter)
app.use("/api/review", reviewRouter)
app.use("/api/service", serviceRouter)

socketHandler(io)
server.listen(port, async () => {
    await connectDb()
    await adminSeeder()
    console.log(`server started at ${port}`)
})

