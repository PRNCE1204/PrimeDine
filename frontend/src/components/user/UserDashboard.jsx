import React from 'react'
import Nav from '../Nav'
import { useSelector } from 'react-redux';
import FoodCard from '../FoodCard';

function UserDashboard({ hideNav }) {
  const { searchItems } = useSelector(state => state.user)

  return (
    <div className='w-full flex flex-col gap-5 items-center bg-[#fff9f6] pb-4'>
      {!hideNav && <Nav />}

      {searchItems && searchItems.length > 0 && (
        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4'>
          <h1 className='text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2'>
            Search Results
          </h1>
          <div className='w-full h-auto flex flex-wrap gap-6 justify-center'>
            {searchItems.map((item) => (
              <FoodCard data={item} key={item._id} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDashboard
