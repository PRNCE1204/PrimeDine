import React, { useState, useEffect } from 'react'
import { FaClock, FaCheckCircle, FaFireAlt, FaUtensils, FaStar, FaCommentDots } from 'react-icons/fa'
import axios from 'axios'
import { serverUrl } from '../../App'
import toast from 'react-hot-toast'

function UserOrderCard({ data }) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [showReviewBox, setShowReviewBox] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const shopOrder = data.shopOrders?.[0] || {};
    const status = shopOrder.status || 'pending';
    const prepTimeMins = shopOrder.estimatedPrepTime || 0;
    const preparingAt = shopOrder.preparingAt;

    useEffect(() => {
        if (status !== 'preparing' || !preparingAt || prepTimeMins <= 0) {
            const calculateWaitTime = () => {
                const created = new Date(data.createdAt).getTime();
                const now = new Date().getTime();
                const diffInMinutes = Math.floor((now - created) / 60000);
                setTimeLeft(diffInMinutes > 0 ? diffInMinutes : 0);
            };
            calculateWaitTime();
            const timer = setInterval(calculateWaitTime, 60000);
            return () => clearInterval(timer);
        }

        const updateTimer = () => {
            const start = new Date(preparingAt).getTime();
            const now = new Date().getTime();
            const elapsedSeconds = Math.floor((now - start) / 1000);
            const totalSeconds = prepTimeMins * 60;
            const remaining = totalSeconds - elapsedSeconds;
            setTimeLeft(remaining > 0 ? remaining : 0);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [status, preparingAt, prepTimeMins, data.createdAt]);

    const formatCountdown = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}m ${s.toString().padStart(2, '0')}s`;
    };

    const getProgressBarPercentage = () => {
        if (status === 'pending') return 25;
        if (status === 'preparing') {
            if (prepTimeMins <= 0) return 50;
            const totalSeconds = prepTimeMins * 60;
            const elapsed = totalSeconds - timeLeft;
            return Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));
        }
        if (status === 'ready to pickup') return 90;
        return 100;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            day: "numeric", month: "short",
            hour: "numeric", minute: "2-digit", hour12: true
        })
    }

    const handleSubmitReview = async () => {
        if (!reviewRating) { 
            toast.error('Please select a star rating.'); 
            return; 
        }
        if (!reviewText.trim()) { 
            toast.error('Please write something before submitting.'); 
            return; 
        }
        setSubmitting(true);
        try {
            await axios.post(`${serverUrl}/api/review/create`, {
                rating: reviewRating,
                category: 'Food',
                text: reviewText,
                tags: [],
            }, { withCredentials: true });
            toast.success('Review submitted! Thank you 🙏');
            setSubmitted(true);
            setShowReviewBox(false);
        } catch (err) {
            toast.error('Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    };

    const isCompleted = status === 'completed' || status === 'delivered';
    const isPreparing = status === 'preparing';

    return (
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 hover:shadow-md transition-shadow animate-fade-in'>
            {/* Header */}
            <div className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isCompleted ? 'bg-green-50/50' : 'bg-gray-50'}`}>
                <div>
                    <div className='flex items-center gap-3 mb-1'>
                        <h3 className='text-lg font-black text-gray-900'>Order #{data._id.slice(-6)}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isCompleted ? 'bg-green-100 text-green-700' :
                            isPreparing ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {status}
                        </span>
                    </div>
                    <p className='text-sm font-medium text-gray-500'>
                        {formatDate(data.createdAt)} • {data.deliveryAddress?.text || 'Dine-in'}
                    </p>
                </div>
                <div className='flex flex-col items-end gap-1'>
                    <span className='text-2xl font-black text-[#ff4d2d]'>₹{data.totalAmount}</span>
                    <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>
                        {data.paymentMethod === 'cod' ? 'Pay Later (At Table)' : 'Paid Online'}
                    </span>
                </div>
            </div>

            {/* Progress / Timer */}
            {!isCompleted && (
                <div className='px-5 py-4 border-b border-gray-100 bg-white text-left'>
                    <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-bold text-gray-800 flex items-center gap-2'>
                            {isPreparing ? <FaFireAlt className="text-orange-500" /> : <FaClock className="text-blue-500" />}
                            {status === 'pending' ? 'Waiting for kitchen to accept...' :
                             status === 'preparing' ? (timeLeft > 0 ? 'Chef is cooking your gourmet meal 🍳' : 'Almost ready! Serving shortly... 🍕') :
                             'Food is ready! Please collect from counter.'}
                        </span>
                        <span className='text-sm font-black text-[#ff4d2d]'>
                            {status === 'preparing' && prepTimeMins > 0 ? (
                                timeLeft > 0 ? `${formatCountdown(timeLeft)} left` : "Almost ready!"
                            ) : `${timeLeft} mins elapsed`}
                        </span>
                    </div>
                    <div className='w-full h-2 bg-gray-100 rounded-full overflow-hidden'>
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                                status === 'preparing' ? 'bg-orange-500' :
                                status === 'ready to pickup' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${getProgressBarPercentage()}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className='p-5'>
                {data.shopOrders.map((shopOrder, idx) => (
                    <div key={idx} className='mb-4 last:mb-0'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {shopOrder.shopOrderItems.map((item, itemIdx) => (
                                <div key={itemIdx} className='flex gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors'>
                                    <div className='w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200'>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className='w-full h-full object-cover' />
                                        ) : (
                                            <div className='w-full h-full flex items-center justify-center text-gray-400'>
                                                <FaUtensils size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className='flex-1 flex flex-col justify-center text-left'>
                                        <h4 className='font-bold text-gray-900 text-sm mb-1'>{item.name}</h4>
                                        <p className='text-xs font-medium text-gray-500 mb-1'>Qty: {item.quantity}</p>
                                        <p className='font-black text-gray-800 text-sm'>₹{item.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Completed footer */}
            {isCompleted && (
                <div className='border-t border-gray-100'>
                    <div className='px-5 py-3 bg-green-50/60 flex items-center justify-between gap-2'>
                        <span className='text-green-600 font-bold text-sm flex items-center gap-2'>
                            <FaCheckCircle /> Order completed. Hope you enjoyed your meal!
                        </span>
                        {!submitted ? (
                            <button
                                onClick={() => setShowReviewBox(v => !v)}
                                className='flex items-center gap-2 px-4 py-2 bg-[#ff4d2d] hover:bg-[#e03c20] text-white text-xs font-bold rounded-xl transition-colors shadow-sm shrink-0'
                            >
                                <FaStar size={12} /> {showReviewBox ? 'Cancel' : 'Leave a Review'}
                            </button>
                        ) : (
                            <span className='text-xs text-gray-400 font-medium italic shrink-0'>✅ Review submitted</span>
                        )}
                    </div>

                    {/* Inline Review Box */}
                    {showReviewBox && !submitted && (
                        <div className='mx-5 mb-5 mt-1 bg-[#fffcfb] border border-[#ffe4df] rounded-2xl p-5 flex flex-col gap-4 text-left'>
                            <h4 className='text-sm font-bold text-gray-800 flex items-center gap-2'>
                                <FaCommentDots className='text-[#ff4d2d]' /> Rate your food experience
                            </h4>

                            {/* Stars */}
                            <div>
                                <p className='text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider'>Your Rating</p>
                                <div className='flex gap-2 items-center'>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <FaStar
                                            key={star}
                                            size={28}
                                            className={`cursor-pointer transition-colors ${(hoverRating || reviewRating) >= star ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setReviewRating(star)}
                                        />
                                    ))}
                                    {reviewRating > 0 && (
                                        <span className='text-sm font-bold text-yellow-500 ml-1'>
                                            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][reviewRating]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Textarea */}
                            <div>
                                <p className='text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider'>Your Feedback</p>
                                <textarea
                                    rows={3}
                                    placeholder='How was the taste, freshness, portion size? Tell us everything! 🍽️'
                                    value={reviewText}
                                    onChange={e => setReviewText(e.target.value)}
                                    className='w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#ff4d2d] resize-none'
                                />
                            </div>

                            <button
                                onClick={handleSubmitReview}
                                disabled={submitting || !reviewRating}
                                className='self-end px-6 py-2.5 bg-[#ff4d2d] hover:bg-[#e03c20] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm'
                            >
                                {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default UserOrderCard;
