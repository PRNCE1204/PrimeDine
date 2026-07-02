import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaFilter, FaQuoteLeft, FaCheckCircle, FaUtensils, FaUserTie, FaGlassCheers } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { serverUrl } from '../../App';

export default function Analytics() {
  const socket = useSocket();
  const [filter, setFilter] = useState('All');
  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/review/my-shop`, { withCredentials: true });
      setReviews(res.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => fetchReviews();
      socket.on('dashboard-updated', handleUpdate);
      socket.on('new-review', handleUpdate);
      return () => {
        socket.off('dashboard-updated', handleUpdate);
        socket.off('new-review', handleUpdate);
      };
    }
  }, [socket]);

  const filteredReviews = filter === 'All' ? reviews : reviews.filter(r => r.category === filter);

  // Compute average rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 'N/A';

  const renderStars = (rating) => {
    const numericRating = Math.round(Number(rating) || 0);
    return [...Array(5)].map((_, index) => (
      index < numericRating ? <FaStar key={index} className="text-yellow-400 drop-shadow-sm" /> : <FaRegStar key={index} className="text-gray-300" />
    ));
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Food': return <FaUtensils className="text-orange-500" />;
      case 'Service': return <FaUserTie className="text-blue-500" />;
      case 'Events': return <FaGlassCheers className="text-pink-500" />;
      default: return null;
    }
  };

  return (
    <div className='animate-fade-in'>
      
      {/* Header Area */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6'>
        <div>
          <h1 className='text-3xl font-black text-gray-900 tracking-tight'>Reviews & Feedback Hub</h1>
          <p className='text-gray-500 text-sm mt-2 font-medium'>Monitor customer satisfaction across food, service, and events.</p>
        </div>

        {/* Overall Rating Summary */}
        <div className='flex items-center gap-6 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100'>
          <div className='text-center'>
            <div className='text-4xl font-black text-gray-900'>{avgRating}</div>
            <div className='flex text-sm mt-1'>{renderStars(avgRating !== 'N/A' ? Math.round(avgRating) : 5)}</div>
          </div>
          <div className='w-px h-12 bg-gray-200'></div>
          <div>
            <div className='text-sm font-bold text-gray-500 uppercase tracking-wider mb-1'>Based on</div>
            <div className='text-xl font-bold text-gray-800'>{reviews.length} Reviews</div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className='flex flex-wrap items-center gap-3 mb-8'>
        <div className='flex items-center gap-2 text-gray-400 font-bold mr-2 uppercase text-xs tracking-wider'>
          <FaFilter /> Filter By
        </div>
        {['All', 'Food', 'Service', 'Events'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${filter === cat ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {cat !== 'All' && getCategoryIcon(cat)}
            {cat} Reviews
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
        {filteredReviews.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white border border-gray-100 rounded-3xl">
            <FaQuoteLeft className="text-4xl mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No customer reviews match this filter.</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review._id} className='bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-lg transition-all transform hover:-translate-y-1 relative overflow-hidden'>
              
              {/* Category Ribbon */}
              <div className='absolute top-0 right-0 bg-gray-50 px-4 py-2 rounded-bl-2xl border-b border-l border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-500'>
                {getCategoryIcon(review.category)} {review.category}
              </div>

              {/* Reviewer Info */}
              <div className='flex items-center justify-between mb-4 mt-2'>
                <div>
                  <h3 className='text-lg font-black text-gray-900 flex items-center gap-2'>
                    {review.customerName}
                    {review.verified && <FaCheckCircle className='text-blue-500 text-sm' title="Verified Customer" />}
                  </h3>
                  <p className='text-xs font-bold text-gray-400'>{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Stars & Tags */}
              <div className='flex flex-col gap-3 mb-5'>
                <div className='flex items-center gap-1 text-lg'>
                  {renderStars(review.rating)}
                </div>
                {review.tags && review.tags.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {review.tags.map(tag => (
                      <span key={tag} className='px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold'>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Text */}
              <div className='relative mt-auto pt-4 border-t border-dashed border-gray-100'>
                <FaQuoteLeft className='absolute top-4 left-0 text-gray-100 text-3xl' />
                <p className='relative z-10 text-gray-700 italic font-medium leading-relaxed pl-6'>
                  "{review.text}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
