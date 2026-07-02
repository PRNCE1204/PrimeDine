import React from 'react';
import { FaUserTie, FaConciergeBell, FaStar, FaFire, FaClock, FaCheckCircle } from 'react-icons/fa';

export default function StaffPerformance() {
  const waiters = [
    { name: 'Rakesh Sharma', requests: 54, avgResp: '2.4 min', rating: 4.7, avatar: 'RS' },
    { name: 'Suresh Kumar', requests: 42, avgResp: '3.1 min', rating: 4.5, avatar: 'SK' },
    { name: 'Amit Singh', requests: 61, avgResp: '1.8 min', rating: 4.9, avatar: 'AS', top: true },
    { name: 'Rahul Verma', requests: 38, avgResp: '4.2 min', rating: 4.1, avatar: 'RV' },
  ];

  const chefs = [
    { name: 'Chef Vikas', orders: 73, avgCook: '11 min', specialties: ['Indian', 'Tandoor'], avatar: 'CV', top: true },
    { name: 'Chef Sanjeev', orders: 58, avgCook: '14 min', specialties: ['Chinese', 'Continental'], avatar: 'CS' },
    { name: 'Chef Ranveer', orders: 45, avgCook: '12 min', specialties: ['Desserts', 'Italian'], avatar: 'CR' },
  ];

  return (
    <div className='animate-fade-in'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Staff Performance & Analytics</h1>
        <p className='text-gray-500 text-sm mt-1'>Monitor your front-of-house and kitchen team efficiency</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        
        {/* Waiter Performance */}
        <div className='bg-white p-8 rounded-2xl shadow-sm border border-gray-100'>
          <h2 className='text-xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
            <FaUserTie className='text-blue-500' /> Front-of-House (Waiters)
          </h2>
          <div className='space-y-4'>
            {waiters.map((waiter, i) => (
              <div key={i} className={`p-4 rounded-xl border flex items-center gap-4 transition-all hover:shadow-md ${waiter.top ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-white'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm ${waiter.top ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gray-400'}`}>
                  {waiter.avatar}
                </div>
                <div className='flex-1'>
                  <h3 className='font-bold text-gray-900 flex items-center gap-2'>
                    {waiter.name} 
                    {waiter.top && <span className='text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider'>Top Performer</span>}
                  </h3>
                  <div className='flex items-center gap-4 mt-2 text-sm'>
                    <span className='flex items-center gap-1 text-gray-600'><FaCheckCircle className='text-green-500'/> {waiter.requests} Req</span>
                    <span className='flex items-center gap-1 text-gray-600'><FaClock className='text-orange-400'/> {waiter.avgResp}</span>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='flex items-center gap-1 text-lg font-black text-gray-800'>
                    <FaStar className='text-yellow-400' /> {waiter.rating}
                  </div>
                  <span className='text-xs text-gray-400 font-medium'>Rating</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chef Performance */}
        <div className='bg-white p-8 rounded-2xl shadow-sm border border-gray-100'>
          <h2 className='text-xl font-bold text-gray-800 mb-6 flex items-center gap-3'>
            <FaFire className='text-orange-500' /> Kitchen Staff (Chefs)
          </h2>
          <div className='space-y-4'>
            {chefs.map((chef, i) => (
              <div key={i} className={`p-4 rounded-xl border flex items-center gap-4 transition-all hover:shadow-md ${chef.top ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100 bg-white'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm ${chef.top ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gray-400'}`}>
                  {chef.avatar}
                </div>
                <div className='flex-1'>
                  <h3 className='font-bold text-gray-900 flex items-center gap-2'>
                    {chef.name}
                    {chef.top && <span className='text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wider'>Fastest Output</span>}
                  </h3>
                  <div className='flex items-center gap-2 mt-2'>
                    {chef.specialties.map((spec, idx) => (
                      <span key={idx} className='text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md'>{spec}</span>
                    ))}
                  </div>
                </div>
                <div className='text-right'>
                  <div className='flex items-center gap-1 text-lg font-black text-gray-800 justify-end mb-1'>
                    <FaConciergeBell className='text-gray-400' /> {chef.orders}
                  </div>
                  <div className='flex items-center gap-1 text-sm font-bold text-orange-600 justify-end'>
                    <FaClock /> {chef.avgCook} avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
