import React, { useState, useEffect } from 'react'
import { FaRegEye, FaRegEyeSlash, FaCheckCircle } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { useNavigate } from 'react-router-dom'
import axios from "axios"
import { serverUrl } from '../App'
import { ClipLoader } from 'react-spinners'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import toast from 'react-hot-toast'

const primaryColor = "#e8000d"
const bgColor = "#050505"
const borderColor = "rgba(255, 255, 255, 0.1)"

// Password strength rules
const rules = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "One uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
    { label: "One number (0–9)", test: (p) => /\d/.test(p) },
    { label: "One special character (!@#$…)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

const getStrength = (password) => {
    const passed = rules.filter(r => r.test(password)).length
    if (passed <= 1) return { label: "Very Weak", color: "#e53e3e", width: "20%" }
    if (passed === 2) return { label: "Weak", color: "#dd6b20", width: "40%" }
    if (passed === 3) return { label: "Medium", color: "#d69e2e", width: "60%" }
    if (passed === 4) return { label: "Strong", color: "#38a169", width: "80%" }
    return { label: "Very Strong", color: "#22543d", width: "100%" }
}

function SignUp() {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    // Step 1 fields
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [mobile, setMobile] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    // Step 2 OTP
    const [step, setStep] = useState(1)
    const [otp, setOtp] = useState("")
    const [countdown, setCountdown] = useState(0)

    // UI state
    const [err, setErr] = useState("")
    const [loading, setLoading] = useState(false)

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown <= 0) return
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown])

    const strength = password ? getStrength(password) : null

    const validateStep1 = () => {
        if (!fullName.trim()) return "Full name is required."
        if (!email.trim()) return "Email is required."
        if (!/^[^\s@]+@gmail\.com$/.test(email)) return "Please enter a valid Gmail address (e.g. name@gmail.com)."
        if (!mobile.trim()) return "Mobile number is required."
        if (!/^\d{10,}$/.test(mobile)) return "Enter a valid mobile number (at least 10 digits)."
        if (!password) return "Password is required."
        const failedRules = rules.filter(r => !r.test(password))
        if (failedRules.length > 0) return "Password does not meet all the requirements below."
        if (!confirmPassword) return "Please re-enter your password."
        if (password !== confirmPassword) return "Passwords do not match."
        return null
    }

    // Send OTP to email
    const handleSendOtp = async () => {
        const error = validateStep1()
        if (error) { toast.error(error); return }
        setErr("")
        setLoading(true)
        try {
            await axios.post(`${serverUrl}/api/auth/send-signup-otp`, {
                fullName, email, password, mobile
            }, { withCredentials: true })
            setStep(2)
            setCountdown(30)
            toast.success("OTP sent! Check your inbox 📧")
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to send OTP. Try again.")
        }
        setLoading(false)
    }

    // Resend OTP
    const handleResendOtp = async () => {
        if (countdown > 0) return
        setErr("")
        setLoading(true)
        try {
            await axios.post(`${serverUrl}/api/auth/send-signup-otp`, {
                fullName, email, password, mobile
            }, { withCredentials: true })
            setCountdown(30)
            toast.success("OTP resent! Check your inbox 📧")
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to resend OTP.")
        }
        setLoading(false)
    }

    // Verify OTP and create account
    const handleVerifyAndCreate = async () => {
        if (!otp || otp.length < 4) { toast.error("Please enter the OTP."); return }
        setErr("")
        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/auth/signup`, {
                email, otp
            }, { withCredentials: true })
            dispatch(setUserData(result.data))
            toast.success(`Account created! Welcome to Prime Dine, ${result.data.fullName.split(' ')[0]}! 🎉`)
        } catch (error) {
            toast.error(error?.response?.data?.message || "Invalid OTP. Please try again.")
        }
        setLoading(false)
    }

    // Google Sign Up (creates customer automatically)
    const handleGoogleAuth = () => {
        window.location.href = `${serverUrl}/api/auth/google`
    }

    return (
        <div className='min-h-screen w-full flex items-center justify-center p-4 bg-[#050505]'>
            <div className='backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] w-full max-w-md p-8'>

                <h1 className='text-4xl font-bold mb-1 text-center text-[#e8000d] font-playfair tracking-wide'>Prime Dine</h1>
                <p className='text-gray-400 text-center mb-6 text-sm font-inter'>
                    {step === 1 ? "Create your account to get started with restaurant management and dine-in services" : `Enter the 6-digit OTP sent to ${email}`}
                </p>

                {/* ── STEP 1: FORM ── */}
                {step === 1 && (
                    <>
                        {/* Full Name */}
                        <div className='mb-4 font-inter'>
                            <label className='block text-gray-300 font-medium mb-1 text-sm'>Full Name <span className='text-[#e8000d]'>*</span></label>
                            <input
                                type="text"
                                className='w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#e8000d] transition-colors text-sm'
                                placeholder='Enter your full name'
                                value={fullName}
                                onChange={e => { setFullName(e.target.value); setErr("") }}
                            />
                        </div>

                        {/* Email */}
                        <div className='mb-4 font-inter'>
                            <label className='block text-gray-300 font-medium mb-1 text-sm'>Email <span className='text-[#e8000d]'>*</span></label>
                            <input
                                type="email"
                                className='w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#e8000d] transition-colors text-sm'
                                placeholder='Enter your email'
                                value={email}
                                onChange={e => { setEmail(e.target.value); setErr("") }}
                            />
                        </div>

                        {/* Mobile */}
                        <div className='mb-4 font-inter'>
                            <label className='block text-gray-300 font-medium mb-1 text-sm'>Mobile Number <span className='text-[#e8000d]'>*</span></label>
                            <input
                                type="tel"
                                className='w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#e8000d] transition-colors text-sm'
                                placeholder='Enter 10-digit mobile number'
                                value={mobile}
                                onChange={e => { setMobile(e.target.value.replace(/\D/g, '')); setErr("") }}
                                maxLength={15}
                            />
                        </div>

                        {/* Password */}
                        <div className='mb-2 font-inter'>
                            <label className='block text-gray-300 font-medium mb-1 text-sm'>Password <span className='text-[#e8000d]'>*</span></label>
                            <div className='relative'>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className='w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#e8000d] transition-colors pr-10 text-sm'
                                    placeholder='Create a strong password'
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setErr("") }}
                                />
                                <button
                                    className='absolute right-3 top-[11px] text-gray-400 cursor-pointer'
                                    onClick={() => setShowPassword(p => !p)}
                                    type="button"
                                >
                                    {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                                </button>
                            </div>
                        </div>

                        {/* Password strength bar */}
                        {password && strength && (
                            <div className='mb-3'>
                                <div className='w-full bg-gray-200 rounded-full h-1.5 mb-1'>
                                    <div
                                        className='h-1.5 rounded-full transition-all duration-300'
                                        style={{ width: strength.width, backgroundColor: strength.color }}
                                    />
                                </div>
                                <p className='text-xs font-medium' style={{ color: strength.color }}>{strength.label}</p>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div className='mb-4 font-inter'>
                            <label className='block text-gray-300 font-medium mb-1 text-sm'>Re-enter Password <span className='text-[#e8000d]'>*</span></label>
                            <div className='relative'>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className='w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors pr-10 text-sm'
                                    style={{
                                        borderColor: confirmPassword && password !== confirmPassword ? '#e8000d' : 'rgba(255, 255, 255, 0.1)'
                                    }}
                                    placeholder='Re-enter your password'
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setErr("") }}
                                />
                                <button
                                    className='absolute right-3 top-[11px] text-gray-400 cursor-pointer'
                                    onClick={() => setShowConfirmPassword(p => !p)}
                                    type="button"
                                >
                                    {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className='text-xs text-red-500 mt-1'>Passwords do not match</p>
                            )}
                            {confirmPassword && password === confirmPassword && (
                                <p className='text-xs text-green-600 mt-1 flex items-center gap-1'><FaCheckCircle size={10} /> Passwords match</p>
                            )}
                        </div>

                        {/* Role selection has been intentionally removed. All new signups default to Customer. */}

                        {/* Error */}
                        {err && <p className='text-[#e8000d] text-sm mb-3 text-center font-inter'>⚠️ {err}</p>}

                        {/* Send OTP Button */}
                        <button
                            className='w-full font-semibold font-inter py-3 rounded-lg transition-all duration-300 bg-[#e8000d] text-white hover:bg-[#ff1a27] hover:shadow-[0_4px_15px_rgba(232,0,13,0.4)] cursor-pointer'
                            onClick={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={18} color='white' /> : "Send OTP to Email"}
                        </button>

                        {/* Divider */}
                        <div className="relative flex items-center justify-center my-6">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                            <div className="relative px-4 text-xs text-gray-500 bg-[#0c0c0c] uppercase font-inter rounded-full">Or continue with</div>
                        </div>

                        {/* Google Sign Up */}
                        <button
                            className='w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3 transition cursor-pointer duration-200 text-white font-inter font-medium hover:bg-white/10'
                            onClick={handleGoogleAuth}
                        >
                            <FcGoogle size={22} />
                            <span>Google</span>
                        </button>

                        <p className='text-center mt-6 text-sm cursor-pointer text-gray-400 font-inter' onClick={() => navigate("/signin")}>
                            Already have an account? <span className='font-semibold text-[#e8000d] hover:text-[#ff1a27] transition-colors'>Sign In</span>
                        </p>
                    </>
                )}

                {/* ── STEP 2: OTP VERIFICATION ── */}
                {step === 2 && (
                    <>
                        {/* OTP icon */}
                        <div className='flex justify-center mb-5'>
                            <div className='w-16 h-16 rounded-full flex items-center justify-center text-3xl' style={{ backgroundColor: "#fff0ec" }}>
                                📧
                            </div>
                        </div>

                        <div className='mb-5 font-inter'>
                            <label className='block text-gray-300 font-medium mb-2 text-sm'>Enter OTP <span className='text-[#e8000d]'>*</span></label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                className='w-full bg-white/5 border border-white/10 rounded-lg px-3 py-4 focus:outline-none text-center text-2xl font-bold tracking-widest text-white placeholder-gray-600 focus:border-[#e8000d] transition-colors'
                                placeholder='------'
                                value={otp}
                                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setErr("") }}
                            />
                        </div>

                        {/* Error */}
                        {err && <p className='text-[#e8000d] text-sm mb-3 text-center font-inter'>⚠️ {err}</p>}

                        {/* Verify Button */}
                        <button
                            className='w-full font-semibold font-inter py-3 rounded-lg transition-all duration-300 bg-[#e8000d] text-white hover:bg-[#ff1a27] hover:shadow-[0_4px_15px_rgba(232,0,13,0.4)] cursor-pointer mb-4'
                            onClick={handleVerifyAndCreate}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={18} color='white' /> : "Verify & Create Account"}
                        </button>

                        {/* Resend OTP */}
                        <div className='text-center'>
                            <p className='text-sm text-gray-500 mb-1'>Didn't receive the OTP?</p>
                            <button
                                onClick={handleResendOtp}
                                disabled={countdown > 0 || loading}
                                className='text-sm font-semibold cursor-pointer'
                                style={{ color: countdown > 0 ? "#aaa" : primaryColor }}
                            >
                                {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                            </button>
                        </div>

                        {/* Back to form */}
                        <button
                            className='w-full mt-4 text-sm text-gray-400 hover:text-gray-600 cursor-pointer text-center'
                            onClick={() => { setStep(1); setOtp(""); setErr("") }}
                        >
                            ← Back to registration form
                        </button>
                    </>
                )}
            </div>

            {/* Role modal removed. */}
        </div>
    )
}

export default SignUp
