import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()
const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

export const sendOtpMail = async (to, otp) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject: "Reset Your Password — Vingo",
        html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`
    })
}

export const sendSignupOtpMail = async (to, otp, fullName) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject: "Verify Your Email — Vingo",
        html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff9f6;padding:32px;border-radius:12px;border:1px solid #ffe0d6;">
            <h2 style="color:#ff4d2d;margin-bottom:4px;">Welcome to Vingo! 🍔</h2>
            <p style="color:#555;margin-top:0;">Hi <strong>${fullName}</strong>, thanks for signing up.</p>
            <p style="color:#555;">Use the OTP below to verify your email address. It expires in <strong>5 minutes</strong>.</p>
            <div style="text-align:center;margin:28px 0;">
                <span style="display:inline-block;background:#ff4d2d;color:#fff;font-size:32px;font-weight:bold;letter-spacing:10px;padding:16px 28px;border-radius:10px;">${otp}</span>
            </div>
            <p style="color:#999;font-size:13px;">If you did not sign up for Vingo, you can safely ignore this email.</p>
        </div>`
    })
}

export const sendDeliveryOtpMail = async (user, otp) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: "Delivery OTP",
        html: `<p>Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`
    })
}
