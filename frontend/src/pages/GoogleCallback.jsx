import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { serverUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { ClipLoader } from 'react-spinners'
import toast from 'react-hot-toast'

function GoogleCallback() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // The backend already set the JWT cookie — just fetch current user
                const { data } = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true })
                dispatch(setUserData(data))
                toast.success(`Welcome, ${data.fullName.split(' ')[0]}! 🎉`)
                navigate("/dashboard")
            } catch (err) {
                toast.error("Google sign-in failed. Please try again.")
                setTimeout(() => navigate("/signin"), 2000)
            }
        }
        fetchUser()
    }, [])

    return (
        <div className='min-h-screen w-full flex flex-col items-center justify-center gap-4' style={{ backgroundColor: "#fff9f6" }}>
            {error ? (
                <div className='text-center'>
                    <p className='text-red-500 font-medium'>{error}</p>
                    <p className='text-gray-400 text-sm mt-1'>Redirecting back to sign in...</p>
                </div>
            ) : (
                <>
                    <ClipLoader size={40} color='#ff4d2d' />
                    <p className='text-gray-600 font-medium'>Completing Google sign-in...</p>
                </>
            )}
        </div>
    )
}

export default GoogleCallback
