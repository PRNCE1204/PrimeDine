import React from 'react'
import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className='min-h-screen w-full flex flex-col items-center justify-center bg-[#fff9f6] p-6 text-center'>
      <div className='text-[120px] leading-none mb-4 select-none'>🍕</div>
      <h1 className='text-6xl font-extrabold text-[#ff4d2d] mb-2'>404</h1>
      <h2 className='text-2xl font-bold text-gray-800 mb-3'>Page Not Found</h2>
      <p className='text-gray-500 mb-8 max-w-sm'>
        Looks like this page got eaten! The page you're looking for doesn't exist.
      </p>
      <button
        className='bg-[#ff4d2d] text-white px-8 py-3 rounded-full font-semibold shadow-md hover:bg-orange-600 transition-colors duration-200'
        onClick={() => navigate('/')}
      >
        Go Back Home
      </button>
    </div>
  )
}

export default NotFound
