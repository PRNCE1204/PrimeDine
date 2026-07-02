import React, { useState, useEffect } from 'react';
import { FaUserCog, FaCheckCircle, FaTimesCircle, FaEnvelope, FaUtensils, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { serverUrl } from '../../App';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

export default function StaffSettings() {
  const { myShopData } = useSelector(state => state.owner);
  const [cookEmail, setCookEmail] = useState('');
  const [currentCook, setCurrentCook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Load current cook assignment on mount
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/shop/get-my`, { withCredentials: true });
        if (res.data?.cook) {
          setCurrentCook(res.data.cook);
        } else {
          setCurrentCook(null);
        }
      } catch (err) {
        console.error('Failed to fetch shop data:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchShop();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!cookEmail.trim()) {
      toast.error('Please enter the cook\'s email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${serverUrl}/api/shop/assign-cook`, { cookEmail }, { withCredentials: true });
      toast.success(res.data.message);
      setCurrentCook(res.data.shop?.cook || null);
      setCookEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign cook.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${serverUrl}/api/shop/assign-cook`, { cookEmail: '' }, { withCredentials: true });
      toast.success('Cook removed from your shop.');
      setCurrentCook(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign cook.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='animate-fade-in max-w-2xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Staff Management</h1>
        <p className='text-gray-500 text-sm mt-1'>Assign a cook account to your restaurant's Kitchen Display System.</p>
      </div>

      {/* Current Cook Card */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6'>
        <h2 className='text-base font-bold text-gray-700 mb-4 flex items-center gap-2'>
          <FaUtensils className='text-[#DC2626]' /> Assigned Cook
        </h2>

        {fetching ? (
          <div className='flex items-center gap-3 text-gray-400'>
            <FaSpinner className='animate-spin' /> Loading...
          </div>
        ) : currentCook ? (
          <div className='flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-4'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-black text-xl border-2 border-green-300'>
                {currentCook.fullName?.slice(0, 1)?.toUpperCase()}
              </div>
              <div>
                <div className='font-bold text-gray-900'>{currentCook.fullName}</div>
                <div className='text-sm text-gray-500 flex items-center gap-1'>
                  <FaEnvelope className='text-xs' /> {currentCook.email}
                </div>
                <div className='text-xs font-bold text-green-600 flex items-center gap-1 mt-1'>
                  <FaCheckCircle /> Active Cook
                </div>
              </div>
            </div>
            <button
              onClick={handleUnassign}
              disabled={loading}
              className='flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50'
            >
              <FaTimesCircle /> Remove
            </button>
          </div>
        ) : (
          <div className='flex items-center gap-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-5 py-4 text-gray-400'>
            <FaUserCog className='text-2xl' />
            <div>
              <div className='font-bold text-gray-500'>No cook assigned yet</div>
              <div className='text-xs text-gray-400'>The cook dashboard will be empty until you assign a cook below.</div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Form */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
        <h2 className='text-base font-bold text-gray-700 mb-1 flex items-center gap-2'>
          <FaUserCog className='text-[#DC2626]' /> {currentCook ? 'Reassign Cook' : 'Assign a Cook'}
        </h2>
        <p className='text-xs text-gray-400 mb-5'>
          The cook must already have a registered account with role <strong>"cook"</strong>. Enter their exact sign-up email.
        </p>

        <form onSubmit={handleAssign} className='space-y-4'>
          <div>
            <label className='block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5'>
              Cook's Email Address
            </label>
            <div className='relative'>
              <FaEnvelope className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
              <input
                type='email'
                placeholder='cook@example.com'
                value={cookEmail}
                onChange={(e) => setCookEmail(e.target.value)}
                className='w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] text-sm text-gray-800 font-medium bg-gray-50'
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={loading || !cookEmail.trim()}
            className='w-full py-3 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? (
              <><FaSpinner className='animate-spin' /> Assigning...</>
            ) : (
              <><FaCheckCircle /> Assign Cook to My Shop</>
            )}
          </button>
        </form>

        <div className='mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed'>
          <strong>💡 How it works:</strong> Once assigned, the cook can log in with their account and go to <code>/dashboard</code>. They'll see all orders for your restaurant in real-time in the Kitchen Display System.
        </div>
      </div>
    </div>
  );
}
