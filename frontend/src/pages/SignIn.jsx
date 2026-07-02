import React, { useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { useNavigate } from 'react-router-dom'
import axios from "axios"
import { serverUrl } from '../App'
import { ClipLoader } from 'react-spinners'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import toast from 'react-hot-toast'

function SignIn() {
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()

    const handleSignIn = async () => {
        // Client-side validation
        if (!email.trim()) { toast.error("Email is required."); return }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email address."); return }
        if (!password) { toast.error("Password is required."); return }

        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/auth/signin`, {
                email, password
            }, { withCredentials: true })
            dispatch(setUserData(result.data))
            toast.success(`Welcome back, ${result.data.fullName.split(' ')[0]}! 👋`)
            setLoading(false)
            navigate("/dashboard")
        } catch (error) {
            toast.error(error?.response?.data?.message || "Sign in failed. Please try again.")
            setLoading(false)
        }
    }

    const handleGoogleAuth = () => {
        window.location.href = `${serverUrl}/api/auth/google`
    }

    return (
        <div className='min-h-screen w-full flex items-center justify-center p-4 bg-[#050505]'>
            <div className='backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] w-full max-w-md p-8'>
                <h1 className='text-4xl font-bold mb-2 text-center text-[#e8000d] font-playfair tracking-wide'>Prime Dine</h1>
                <p className='text-gray-400 text-center mb-8 font-inter'>Sign In to access restaurant management and dine-in services</p>

                {/* Email */}
                <div className='mb-4 font-inter'>
                    <label htmlFor="email" className='block text-gray-300 font-medium mb-2'>Email</label>
                    <input
                        type="email"
                        className='w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#e8000d] transition-colors'
                        placeholder='Enter your Email'
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                    />
                </div>

                {/* Password */}
                <div className='mb-4 font-inter'>
                    <label htmlFor="password" className='block text-gray-300 font-medium mb-2'>Password</label>
                    <div className='relative'>
                        <input
                            type={showPassword ? "text" : "password"}
                            className='w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#e8000d] transition-colors pr-12'
                            placeholder='Enter your password'
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            required
                        />
                        <button className='absolute right-4 cursor-pointer top-[16px] text-gray-400 hover:text-white transition-colors' onClick={() => setShowPassword(prev => !prev)}>
                            {!showPassword ? <FaRegEye size={18} /> : <FaRegEyeSlash size={18} />}
                        </button>
                    </div>
                </div>

                <div className='text-right mb-6 cursor-pointer text-gray-400 hover:text-[#e8000d] font-medium font-inter transition-colors text-sm' onClick={() => navigate("/forgot-password")}>
                    Forgot Password?
                </div>

                <button
                    className='w-full font-semibold font-inter py-3 rounded-lg transition-all duration-300 bg-[#e8000d] text-white hover:bg-[#ff1a27] hover:shadow-[0_4px_15px_rgba(232,0,13,0.4)] cursor-pointer'
                    onClick={handleSignIn}
                    disabled={loading}
                >
                    {loading ? <ClipLoader size={20} color='white' /> : "Sign In"}
                </button>

                {/* Error removed — toasts handle errors */}

                <div className="relative flex items-center justify-center mt-6 mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative px-4 text-xs text-gray-500 bg-[#0c0c0c] uppercase font-inter rounded-full">Or continue with</div>
                </div>

                <button
                    className='w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3 transition cursor-pointer duration-200 text-white font-inter font-medium hover:bg-white/10'
                    onClick={handleGoogleAuth}
                >
                    <FcGoogle size={22} />
                    <span>Google</span>
                </button>

                <p className='text-center mt-8 cursor-pointer font-inter text-gray-400' onClick={() => navigate("/signup")}>
                    Don't have an account? <span className='text-[#e8000d] hover:text-[#ff1a27] font-semibold transition-colors'>Sign Up</span>
                </p>
            </div>

        </div>
    )
}

export default SignIn

