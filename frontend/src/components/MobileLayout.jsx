import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { GoHome, GoHomeFill } from "react-icons/go"
import { FiShoppingCart } from "react-icons/fi"
import { FaShoppingCart } from "react-icons/fa"
import { TbReceipt2 } from "react-icons/tb"
import { IoPersonOutline, IoPerson } from "react-icons/io5"
import axios from 'axios'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import toast from 'react-hot-toast'

function MobileLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { cartItems, userData } = useSelector(state => state.user)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
      dispatch(setUserData(null))
      toast.success("You've been logged out. See you soon! 👋")
      setShowProfileMenu(false)
    } catch (error) {
      toast.error("Logout failed. Please try again.")
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className='w-full min-h-screen bg-[#F8FAFC]'>
      {/* Responsive Container (Full width on desktop, mobile-like on phones) */}
      <div className='w-full min-h-screen relative flex flex-col overflow-hidden mx-auto'>
        
        {/* Main Content Area - Scrollable */}
        <div className='flex-1 overflow-y-auto overflow-x-hidden pb-[80px] md:pb-0'>
          {children || <Outlet />}
        </div>

        {/* Profile Menu Overlay */}
        {showProfileMenu && (
          <div className='absolute bottom-[80px] right-4 bg-white rounded-2xl shadow-xl p-4 w-48 border border-gray-100 z-50 animate-fade-in'>
            <div className='font-bold text-gray-800 border-b border-gray-100 pb-3 mb-3 text-center'>
              Hi, {userData?.fullName?.split(' ')[0]}!
            </div>
            <button 
              className='w-full py-2 text-[#ff4d2d] font-semibold hover:bg-orange-50 rounded-lg transition-colors'
              onClick={handleLogOut}
            >
              Log Out
            </button>
          </div>
        )}

        {/* Bottom Navigation Bar (Hidden on Desktop) */}
        <div className='md:hidden absolute bottom-0 w-full h-[70px] bg-white border-t border-gray-200 flex items-center justify-around px-2 z-40 pb-safe'>
          
          <button 
            className='flex flex-col items-center justify-center w-16 gap-1'
            onClick={() => { navigate('/dashboard'); setShowProfileMenu(false); }}
          >
            {isActive('/dashboard') ? <GoHomeFill size={26} className='text-[#ff4d2d]' /> : <GoHome size={26} className='text-gray-500' />}
            <span className={`text-[10px] font-medium ${isActive('/dashboard') ? 'text-[#ff4d2d]' : 'text-gray-500'}`}>Menu</span>
          </button>

          <button 
            className='flex flex-col items-center justify-center w-16 gap-1'
            onClick={() => { navigate('/my-orders'); setShowProfileMenu(false); }}
          >
            <TbReceipt2 size={26} className={isActive('/my-orders') || location.pathname.includes('/track-order') ? 'text-[#ff4d2d]' : 'text-gray-500'} />
            <span className={`text-[10px] font-medium ${isActive('/my-orders') || location.pathname.includes('/track-order') ? 'text-[#ff4d2d]' : 'text-gray-500'}`}>Orders</span>
          </button>

        </div>

      </div>

      <style jsx>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default MobileLayout
