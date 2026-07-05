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

export const sendWelcomeMail = async (to, fullName) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject: "Welcome to PrimeDine! 🍽️",
        html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff9f6;padding:32px;border-radius:12px;border:1px solid #ffe0d6;text-align:center;">
            <h2 style="color:#ff4d2d;margin-bottom:12px;">Welcome to PrimeDine, ${fullName}! 🎉</h2>
            <p style="color:#555;font-size:16px;line-height:1.5;margin-top:0;">We're thrilled to have you join our dining family.</p>
            <p style="color:#555;font-size:14px;line-height:1.5;">At PrimeDine, you can seamlessly book tables, customize catering events, monitor seating layouts in real-time, and pre-order delicious meals.</p>
            <div style="margin:28px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;background:#ff4d2d;color:#fff;text-decoration:none;font-size:16px;font-weight:bold;padding:12px 30px;border-radius:8px;box-shadow:0 4px 6px rgba(255, 77, 45, 0.2);">Start Exploring 🚀</a>
            </div>
            <p style="color:#999;font-size:13px;border-top:1px solid #ffe0d6;padding-top:16px;margin-top:24px;">Thank you for signing in with Google. If you did not sign up for PrimeDine, you can safely ignore this email.</p>
        </div>`
    })
}

export const sendReceiptMail = async (to, fullName, pdfPath, pdfName, type) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject: `Your PrimeDine Invoice / Receipt for ${type === 'dining' ? 'Dining Session' : 'Event Booking'} 🧾`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center;">
            <h2 style="color: #111827; margin-bottom: 12px;">Payment Receipt 🍽️</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-top: 0;">Hi <strong>${fullName}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Your payment has been successfully recorded. We have attached the detailed PDF invoice/receipt to this email.</p>
            <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
                <span style="font-size: 13px; font-weight: bold; color: #374151;">Attachment: ${pdfName}</span>
            </div>
            <p style="color: #6b7280; font-size: 13px;">If you have any questions or require further assistance, please contact our support team at <a href="mailto:info@primedine.com" style="color: #2563eb; text-decoration: none;">info@primedine.com</a>.</p>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">Thank you for dining with PrimeDine!</p>
        </div>`,
        attachments: [
            {
                filename: pdfName,
                path: pdfPath
            }
        ]
    });
}
