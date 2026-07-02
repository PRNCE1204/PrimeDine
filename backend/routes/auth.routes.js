import express from "express"
import passport from "passport"
import { googleCallback, googleAuth, resetPassword, sendOtp, sendSignupOtp, signIn, signOut, signUp, verifyOtp } from "../controllers/auth.controllers.js"

const authRouter = express.Router()

authRouter.post("/send-signup-otp", sendSignupOtp)
authRouter.post("/signup", signUp)
authRouter.post("/signin", signIn)
authRouter.get("/signout", signOut)
authRouter.post("/send-otp", sendOtp)
authRouter.post("/verify-otp", verifyOtp)
authRouter.post("/reset-password", resetPassword)
authRouter.post("/google-auth", googleAuth)

// Initiate Google OAuth
authRouter.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}))

// Google OAuth callback
authRouter.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/signin?error=google_auth_failed", session: true }),
    googleCallback
)

export default authRouter