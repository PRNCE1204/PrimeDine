import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { useSocket } from '../../context/SocketContext';
import { FaStar, FaUtensils, FaConciergeBell, FaCalendarAlt, FaFilter, FaUser, FaCheckCircle } from 'react-icons/fa';

const CATEGORY_CONFIG = {
  Food:    { icon: <FaUtensils />,      color: 'bg-orange-100 text-orange-600 border-orange-200',  dot: 'bg-orange-400' },
  Service: { icon: <FaConciergeBell />, color: 'bg-blue-100 text-blue-600 border-blue-200',         dot: 'bg-blue-400' },
  Events:  { icon: <FaCalendarAlt />,   color: 'bg-purple-100 text-purple-600 border-purple-200',   dot: 'bg-purple-400' },
};

const StarRating = ({ rating }) => (
  <div className='flex items-center gap-0.5'>
    {[1, 2, 3, 4, 5].map(s => (
      <FaStar key={s} className={s <= rating ? 'text-amber-400' : 'text-gray-200'} size={14} />
    ))}
  </div>
);

const RatingBar = ({ label, count, total, color }) => (
  <div className='flex items-center gap-3'>
    <span className='text-xs font-bold text-gray-500 w-16 shrink-0'>{label}</span>
    <div className='flex-1 h-2 bg-gray-100 rounded-full overflow-hidden'>
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
      />
    </div>
    <span className='text-xs font-black text-gray-700 w-4 text-right'>{count}</span>
  </div>
);

export default function ReviewsOverview() {
  const socket = useSocket();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/review/my-shop`, { withCredentials: true });
      setReviews(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Live update when a new review comes in
  useEffect(() => {
    if (!socket) return;
    const handleNewReview = (review) => {
      setReviews(prev => {
        if (prev.some(r => r._id === review._id)) return prev;
        return [review, ...prev];
      });
    };
    const handleUpdate = () => fetchReviews();
    socket.on('new-review', handleNewReview);
    socket.on('dashboard-updated', handleUpdate);
    return () => {
      socket.off('new-review', handleNewReview);
      socket.off('dashboard-updated', handleUpdate);
    };
  }, [socket]);

  const filters = ['All', 'Food', 'Service', 'Events'];
  const filtered = activeFilter === 'All' ? reviews : reviews.filter(r => r.category === activeFilter);

  // Stats
  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const foodRevs    = reviews.filter(r => r.category === 'Food');
  const serviceRevs = reviews.filter(r => r.category === 'Service');
  const eventRevs   = reviews.filter(r => r.category === 'Events');
  const avgFor = (arr) => arr.length > 0 ? (arr.reduce((s, r) => s + r.rating, 0) / arr.length).toFixed(1) : '—';

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }));

  return (
    <div className='animate-fade-in'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Guest Reviews</h1>
        <p className='text-gray-500 text-sm mt-1'>All reviews about food, service, and events — updated live</p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
        {/* Overall */}
        <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center'>
          <div className='text-5xl font-black text-gray-900 mb-1'>{avg}</div>
          <StarRating rating={Math.round(parseFloat(avg) || 0)} />
          <p className='text-xs text-gray-400 font-bold mt-2 uppercase tracking-wider'>Overall · {reviews.length} reviews</p>
        </div>
        {/* Food */}
        <div className='bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center justify-center text-center'>
          <FaUtensils className='text-orange-400 text-2xl mb-2' />
          <div className='text-3xl font-black text-orange-600 mb-1'>{avgFor(foodRevs)}</div>
          <StarRating rating={Math.round(parseFloat(avgFor(foodRevs)) || 0)} />
          <p className='text-xs text-orange-400 font-bold mt-2 uppercase tracking-wider'>Food · {foodRevs.length}</p>
        </div>
        {/* Service */}
        <div className='bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center'>
          <FaConciergeBell className='text-blue-400 text-2xl mb-2' />
          <div className='text-3xl font-black text-blue-600 mb-1'>{avgFor(serviceRevs)}</div>
          <StarRating rating={Math.round(parseFloat(avgFor(serviceRevs)) || 0)} />
          <p className='text-xs text-blue-400 font-bold mt-2 uppercase tracking-wider'>Service · {serviceRevs.length}</p>
        </div>
        {/* Events */}
        <div className='bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center justify-center text-center'>
          <FaCalendarAlt className='text-purple-400 text-2xl mb-2' />
          <div className='text-3xl font-black text-purple-600 mb-1'>{avgFor(eventRevs)}</div>
          <StarRating rating={Math.round(parseFloat(avgFor(eventRevs)) || 0)} />
          <p className='text-xs text-purple-400 font-bold mt-2 uppercase tracking-wider'>Events · {eventRevs.length}</p>
        </div>
      </div>

      <div className='flex flex-col xl:flex-row gap-6'>
        {/* Rating Breakdown */}
        <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full xl:w-64 shrink-0'>
          <h3 className='font-bold text-gray-800 mb-4'>Rating Breakdown</h3>
          <div className='space-y-3'>
            {ratingCounts.map(({ star, count }) => (
              <RatingBar
                key={star}
                label={`${star} Stars`}
                count={count}
                total={reviews.length}
                color={star >= 4 ? 'bg-amber-400' : star === 3 ? 'bg-yellow-300' : 'bg-red-400'}
              />
            ))}
          </div>
        </div>

        {/* Review List */}
        <div className='flex-1'>
          {/* Filter Tabs */}
          <div className='flex items-center gap-2 mb-5 flex-wrap'>
            <FaFilter className='text-gray-400 text-sm' />
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${
                  activeFilter === f
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {f} {f === 'All' ? `(${reviews.length})` : `(${reviews.filter(r => r.category === f).length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className='text-center py-16 text-gray-400 font-medium'>Loading reviews…</div>
          ) : filtered.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400'>
              <FaStar className='text-4xl mx-auto mb-3 opacity-20' />
              <p className='font-semibold'>No {activeFilter !== 'All' ? activeFilter : ''} reviews yet.</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filtered.map((review) => {
                const cat = CATEGORY_CONFIG[review.category] || CATEGORY_CONFIG['Food'];
                return (
                  <div key={review._id} className='bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200'>
                    <div className='flex items-start justify-between gap-4'>
                      {/* Left */}
                      <div className='flex items-start gap-3 flex-1 min-w-0'>
                        {/* Avatar */}
                        <div className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 font-black text-gray-700 text-sm uppercase border border-gray-200'>
                          {review.customerName?.charAt(0) || '?'}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='font-bold text-gray-900'>{review.customerName}</span>
                            {review.verified && (
                              <span className='flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 border border-green-200 px-2 py-0.5 rounded-full'>
                                <FaCheckCircle size={9} /> Verified
                              </span>
                            )}
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.color}`}>
                              {cat.icon} {review.category}
                            </span>
                          </div>
                          <div className='flex items-center gap-2 mt-1'>
                            <StarRating rating={review.rating} />
                            <span className='text-xs text-gray-400'>
                              {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className='text-sm text-gray-700 mt-2 leading-relaxed'>{review.text}</p>
                          {review.tags?.length > 0 && (
                            <div className='flex flex-wrap gap-1.5 mt-3'>
                              {review.tags.map((tag, i) => (
                                <span key={i} className='text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium'>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Rating badge */}
                      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                        review.rating >= 4 ? 'bg-amber-50 text-amber-500' :
                        review.rating === 3 ? 'bg-yellow-50 text-yellow-500' :
                        'bg-red-50 text-red-500'
                      }`}>
                        {review.rating}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
