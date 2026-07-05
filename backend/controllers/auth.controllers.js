import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import genToken from "../utils/token.js"
import { sendOtpMail, sendSignupOtpMail, sendWelcomeMail } from "../utils/mail.js"

// ─── Password strength validator ──────────────────────────────────────────────
const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
    return regex.test(password)
}

// ─── In-memory store for pending signups ──────────────────────────────────────
// key: email, value: { fullName, email, hashedPassword, mobile, otp, expiresAt }
// NOTE: role is intentionally NOT stored here — all registrations are CUSTOMER
const pendingSignups = new Map()

// ─── SEND SIGNUP OTP ──────────────────────────────────────────────────────────
export const sendSignupOtp = async (req, res) => {
    try {
        // role is intentionally destructured away and IGNORED — prevents privilege escalation
        const { fullName, email, password, mobile } = req.body

        // 1. Required fields
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." })
        }

        // 2. Strong password check
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
            })
        }

        // 3. Mobile length (optional field)
        if (mobile && mobile.length < 10) {
            return res.status(400).json({ message: "Mobile number must be at least 10 digits." })
        }

        // 4. Duplicate email check
        const existingEmail = await User.findOne({ email })
        if (existingEmail) {
            return res.status(400).json({ message: "This email is already registered. Please sign in." })
        }

        // 5. Duplicate mobile check (only if provided)
        if (mobile) {
            const existingMobile = await User.findOne({ mobile })
            if (existingMobile) {
                return res.status(400).json({ message: "This mobile number is already registered." })
            }
        }

        // 6. Generate OTP and store pending signup — role hardcoded to 'customer'
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedPassword = await bcrypt.hash(password, 10)

        pendingSignups.set(email, {
            fullName,
            email,
            hashedPassword,
            mobile: mobile || undefined,
            role: "customer",  // ← always customer, never from request
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000  // 5 minutes
        })

        console.log(`[DEVELOPMENT] Signup OTP generated for ${email}: ${otp}`)

        // 7. Send OTP email
        try {
            await sendSignupOtpMail(email, otp, fullName)
        } catch (mailError) {
            console.error(`[DEVELOPMENT] Failed to send email to ${email}:`, mailError.message)
        }

        return res.status(200).json({ message: "OTP sent successfully. Please check your email (or console)." })
    } catch (error) {
        console.error("sendSignupOtp error:", error)
        return res.status(500).json({ message: `Send signup OTP error: ${error.message}` })
    }
}

// ─── SIGN UP (requires OTP verification) ──────────────────────────────────────
export const signUp = async (req, res) => {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." })
        }

        const pending = pendingSignups.get(email)
        if (!pending) {
            return res.status(400).json({ message: "No pending signup found. Please start the registration again." })
        }

        if (pending.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." })
        }

        if (Date.now() > pending.expiresAt) {
            pendingSignups.delete(email)
            return res.status(400).json({ message: "OTP has expired. Please request a new one." })
        }

        // Double-check email uniqueness
        const existingEmail = await User.findOne({ email: pending.email })
        if (existingEmail) {
            pendingSignups.delete(email)
            return res.status(400).json({ message: "This email was just registered. Please sign in." })
        }

        // Create user — role is always 'customer' regardless of what's in pending
        const user = await User.create({
            fullName: pending.fullName,
            email: pending.email,
            password: pending.hashedPassword,
            mobile: pending.mobile,
            role: "customer",  // ← enforced at create time as well
            isEmailVerified: true
        })

        pendingSignups.delete(email)

        const token = await genToken(user._id, user.email, user.role)
        res.cookie("token", token, {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        return res.status(201).json(user)
    } catch (error) {
        console.error("signUp error:", error)
        return res.status(500).json({ message: `Sign up error: ${error.message}` })
    }
}

// ─── SIGN IN ──────────────────────────────────────────────────────────────────
export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "No account found with this email." })
        }

        if (!user.password) {
            return res.status(400).json({ message: "This account was registered with Google. Please sign in with Google." })
        }

        if (!user.isEmailVerified) {
            return res.status(400).json({ message: "Please verify your email before signing in." })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password. Please try again." })
        }

        const token = await genToken(user._id, user.email, user.role)
        res.cookie("token", token, {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        return res.status(200).json(user)
    } catch (error) {
        console.error("signIn error:", error)
        return res.status(500).json({ message: `Sign in error: ${error.message}` })
    }
}

// ─── SIGN OUT ─────────────────────────────────────────────────────────────────
export const signOut = async (req, res) => {
    try {
        res.clearCookie("token")
        return res.status(200).json({ message: "Logged out successfully" })
    } catch (error) {
        return res.status(500).json({ message: `Sign out error: ${error.message}` })
    }
}

// ─── SEND OTP (password reset) ────────────────────────────────────────────────
export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "No account found with this email." })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        user.resetOtp = otp
        user.otpExpires = Date.now() + 5 * 60 * 1000
        user.isOtpVerified = false
        await user.save()
        await sendOtpMail(email, otp)
        return res.status(200).json({ message: "OTP sent successfully." })
    } catch (error) {
        return res.status(500).json({ message: `Send OTP error: ${error.message}` })
    }
}

// ─── VERIFY OTP (password reset) ─────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        const user = await User.findOne({ email })
        if (!user || user.resetOtp != otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP." })
        }
        user.isOtpVerified = true
        user.resetOtp = undefined
        user.otpExpires = undefined
        await user.save()
        return res.status(200).json({ message: "OTP verified successfully." })
    } catch (error) {
        return res.status(500).json({ message: `Verify OTP error: ${error.message}` })
    }
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body
        const user = await User.findOne({ email })
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "OTP verification is required before resetting your password." })
        }
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                message: "New password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
            })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        user.isOtpVerified = false
        await user.save()
        return res.status(200).json({ message: "Password reset successfully." })
    } catch (error) {
        return res.status(500).json({ message: `Reset password error: ${error.message}` })
    }
}

// ─── GOOGLE OAUTH CALLBACK (Passport redirect flow) ───────────────────────────
// NOTE: Google Login always creates CUSTOMER accounts. Role is NEVER taken from state or query params.
export const googleCallback = async (req, res) => {
    try {
        const { id: googleId, emails, displayName } = req.user
        const email = emails[0].value

        let user = await User.findOne({ email })
        if (!user) {
            // New user via Google → always create as customer
            user = await User.create({
                fullName: displayName,
                email,
                googleId,
                role: "customer",  // ← hardcoded, never from state
                isEmailVerified: true
            })
            try {
                await sendWelcomeMail(email, displayName)
            } catch (mailError) {
                console.error("Failed to send welcome email in googleCallback:", mailError.message)
            }
        } else {
            // Existing user → just link googleId if not already linked
            if (!user.googleId) {
                user.googleId = googleId
            }
            if (!user.isEmailVerified) user.isEmailVerified = true
            await user.save()
        }

        const token = await genToken(user._id, user.email, user.role)
        res.cookie("token", token, {
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        return res.redirect(`${process.env.FRONTEND_URL}/auth/callback`)
    } catch (error) {
        console.error("googleCallback error:", error)
        return res.redirect(`${process.env.FRONTEND_URL}/signin?error=google_auth_failed`)
    }
}

// ─── GOOGLE AUTH (Firebase client-side flow) ──────────────────────────────────
// NOTE: role is intentionally NOT accepted — new accounts always get 'customer'
export const googleAuth = async (req, res) => {
    try {
        const { fullName, email, mobile } = req.body
        let user = await User.findOne({ email })
        if (!user) {
            user = await User.create({
                fullName,
                email,
                mobile: mobile || undefined,
                role: "customer",  // ← hardcoded always
                isEmailVerified: true
            })
            try {
                await sendWelcomeMail(email, fullName)
            } catch (mailError) {
                console.error("Failed to send welcome email in googleAuth:", mailError.message)
            }
        } else {
            // Existing account — update mobile if missing but NEVER change the role
            if (mobile && !user.mobile) user.mobile = mobile
            if (!user.isEmailVerified) user.isEmailVerified = true
            await user.save()
        }

        const token = await genToken(user._id, user.email, user.role)
        res.cookie("token", token, {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        return res.status(200).json(user)
    } catch (error) {
        console.error("googleAuth error:", error)
        return res.status(500).json({ message: `Google auth error: ${error.message}` })
    }
}