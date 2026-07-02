import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import UserOrderCard from '../components/user/UserOrderCard';
import OwnerOrderCard from '../components/owner/OwnerOrderCard';
import { setMyOrders, updateOrderStatus, updateRealtimeOrderStatus } from '../redux/userSlice';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { serverUrl } from '../App';
import { FaCalendarAlt, FaUserFriends, FaStar, FaRegStar, FaUtensils, FaCheckCircle, FaClock, FaCommentDots, FaConciergeBell, FaBroom, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

function MyOrders() {
  const { userData, myOrders } = useSelector(state => state.user);
  const socket = useSocket();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'reservations', or 'sessions'
  const [reservations, setReservations] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [selectedSessionInvoice, setSelectedSessionInvoice] = useState(null);
  const [selectedEventInvoice, setSelectedEventInvoice] = useState(null);
  
   // Rating and review input states for each reservation
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [showReservationReview, setShowReservationReview] = useState({});


  const [tableSession, setTableSession] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);

  const fetchSessionHistory = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/order/table-session/history`, { withCredentials: true });
      setSessionHistory(res.data);
    } catch (error) {
      console.error("Error fetching table session history:", error);
    }
  };

  const fetchMySession = async () => {
    if (!userData || userData.role !== 'customer') return;
    try {
      const res = await axios.get(`${serverUrl}/api/order/table-session/my-session`, { withCredentials: true });
      setTableSession(res.data);
    } catch (error) {
      console.error("Error fetching table session:", error);
    }
  };

  const fetchActiveRequests = async () => {
    if (!tableSession) return;
    try {
      const res = await axios.get(`${serverUrl}/api/service/active`, { withCredentials: true });
      const filtered = res.data.filter(r => String(r.tableNumber) === String(tableSession.tableNumber));
      setActiveRequests(filtered);
    } catch (err) {
      console.error("Error fetching active requests:", err);
    }
  };

  const handleRequestService = async (requestType) => {
    if (!tableSession) return;
    try {
      const res = await axios.post(`${serverUrl}/api/service/request`, {
        tableNumber: tableSession.tableNumber,
        requestType
      }, { withCredentials: true });
      toast.success(`${requestType} requested! 🔔`);
      setActiveRequests(prev => [res.data, ...prev]);
    } catch (err) {
      toast.error("Failed to request service.");
    }
  };


  const handleReleaseTable = async () => {
    if (!tableSession) return;
    try {
      await axios.post(`${serverUrl}/api/order/table-session/deactivate`, {
        tableNumber: tableSession.tableNumber
      }, { withCredentials: true });
      setTableSession(null);
      toast.success("Dine-in session closed.");
    } catch (error) {
      toast.error("Failed to release table.");
    }
  };

  const fetchReservations = async () => {
    // Always fetch — socket may fire while user is on Orders tab
    try {
      const res = await axios.get(`${serverUrl}/api/reservation/get-all`, { withCredentials: true });
      setReservations(res.data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  useEffect(() => {
    fetchMySession();
  }, [userData]);

  useEffect(() => {
    if (tableSession) {
      fetchActiveRequests();
    } else {
      setActiveRequests([]);
    }
  }, [tableSession]);

  useEffect(() => {
    fetchReservations();
    fetchSessionHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'reservations') {
      fetchReservations();
    }
    if (activeTab === 'sessions') {
      fetchSessionHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('new-order', (data) => {
      if (data.shopOrders?.owner._id == userData._id) {
        dispatch(setMyOrders([data, ...myOrders]));
      }
    });

    socket.on('order-status-updated', ({ orderId, shopId, status, userId, estimatedPrepTime, preparingAt }) => {
      if (userId == userData._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status, estimatedPrepTime, preparingAt }));
      }
    });

    // Realtime reservation updates
    const handleReservationUpdate = (data) => {
      fetchReservations();
      // Show a live toast so customer knows their booking status changed
      if (data && data.fullName) {
        toast.success(
          `📅 Your booking "${data.packageTitle || data.eventType}" is now ${data.status}` +
          (data.paymentStatus ? ` · Payment: ${data.paymentStatus}` : ''),
          { duration: 5000 }
        );
      }
    };
    socket.on('new-reservation', () => fetchReservations());
    socket.on('reservation-updated', handleReservationUpdate);

    // Table session events
    const handleSessionApproved = (data) => {
      if (String(data.userId) === String(userData._id)) {
        fetchMySession();
      }
    };

    const handleSessionDeactivated = (data) => {
      if (tableSession && String(tableSession.tableNumber) === String(data.tableNumber)) {
        setTableSession(null);
      }
    };

    const handleServiceRequestCompleted = ({ requestId }) => {
      setActiveRequests(prev => prev.filter(r => r._id !== requestId));
      toast.success("Service request resolved by waitstaff! 👍");
    };

    socket.on('table-session-approved', handleSessionApproved);
    socket.on('table-session-deactivated', handleSessionDeactivated);
    socket.on('table-session-updated', fetchMySession);
    socket.on('service-request-completed', handleServiceRequestCompleted);

    return () => {
      socket.off('new-order');
      socket.off('order-status-updated');
      socket.off('new-reservation');
      socket.off('reservation-updated', handleReservationUpdate);
      socket.off('table-session-approved', handleSessionApproved);
      socket.off('table-session-deactivated', handleSessionDeactivated);
      socket.off('table-session-updated', fetchMySession);
      socket.off('service-request-completed', handleServiceRequestCompleted);
    };
  }, [socket, myOrders, userData._id, dispatch, activeTab, tableSession]);

  const handleSubmittingReview = async (resId, res) => {
    const rating = ratings[resId] || 5;
    const commentText = comments[resId] || "";

    if (!commentText.trim()) {
      toast.error("Please enter a review message.");
      return;
    }

    try {
      // Save rating to reservation record
      await axios.post(`${serverUrl}/api/reservation/update-status/${resId}`, {
        rating,
        review: commentText
      }, { withCredentials: true });
      toast.success("Thank you for your feedback! ❤️");
      fetchReservations();
    } catch (error) {
      toast.error("Failed to submit review.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-700 border border-green-200';
      case 'Decorating': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Decorated & Ready': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'Completed': return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-orange-100 text-orange-700 border border-orange-200';
    }
  };

  return (
    <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
      <div className='w-full max-w-[800px] p-4'>

        <div className='flex items-center gap-[20px] mb-6'>
          <div className='z-[10] cursor-pointer' onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
          </div>
          <h1 className='text-2xl font-bold text-start'>My Orders & Event Bookings</h1>
        </div>

        {/* Tab Selector */}
        <div className='flex gap-4 border-b border-gray-200 pb-4 mb-6 flex-wrap'>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-[#ff4d2d] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            🍕 Food Orders
          </button>
          <button 
            onClick={() => setActiveTab('reservations')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'reservations' ? 'bg-[#ff4d2d] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            🎉 Event Reservations
          </button>
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sessions' ? 'bg-[#ff4d2d] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            🧾 Dining Bills / History
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className='space-y-6'>
            {tableSession && tableSession.pinRequestStatus === 'approved' && (
              <div className="p-5 rounded-2xl bg-green-50 border border-green-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                    <FaUtensils size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-green-800 text-sm">Checked In at Table {tableSession.tableNumber}</h4>
                    <p className="text-green-600/80 text-xs mt-1 font-medium">Use PIN below to submit dine-in orders on this table.</p>
                    <div className="flex items-center gap-2 mt-3 bg-white border border-green-200 rounded-xl px-3 py-2 w-fit">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">PIN:</span>
                      <span 
                        onClick={() => {
                          navigator.clipboard.writeText(tableSession.verificationPin);
                          toast.success("PIN copied! 📋");
                        }}
                        className="font-mono text-lg font-black text-green-700 tracking-wider cursor-pointer hover:underline"
                        title="Click to copy PIN"
                      >
                        {tableSession.verificationPin}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleReleaseTable}
                  className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-500 rounded-xl font-bold text-xs transition-colors w-fit cursor-pointer"
                >
                  Release Table / Check-Out
                </button>
              </div>
            )}




            {tableSession && tableSession.pinRequestStatus === 'requested' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-250 shadow-sm flex items-center gap-3 animate-pulse text-left">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0">
                  <FaClock size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-amber-800 text-sm">Table {tableSession.tableNumber} Seating Request Pending</h4>
                  <p className="text-amber-600/80 text-xs mt-0.5 font-medium">Waiting for waiter approval. Your PIN will appear here shortly.</p>
                </div>
              </div>
            )}

            {myOrders && myOrders.length > 0 ? (
              myOrders.map((order, index) => (
                userData.role === "customer" ? (
                  <UserOrderCard data={order} key={index} />
                ) : userData.role === "admin" ? (
                  <OwnerOrderCard data={order} key={index} />
                ) : null
              ))
            ) : (
              <div className='flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
                <div className='text-7xl mb-4'>🛍️</div>
                <h2 className='text-xl font-semibold text-gray-700 mb-2'>No Orders Yet</h2>
                <p className='text-gray-400 text-sm'>Your orders will appear here once you place one.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'reservations' && (
          <div className='space-y-6 animate-fade-in'>
            {reservations && reservations.length > 0 ? (
              reservations.map((res) => (
                <div key={res._id} className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 text-left'>
                  <div className='flex justify-between items-start flex-wrap gap-3'>
                    <div>
                      <h3 className='text-lg font-black text-gray-900'>{res.packageTitle || res.eventType}</h3>
                      <p className='text-sm text-gray-500 font-semibold mt-1 flex items-center gap-1.5'>
                        <FaCalendarAlt className="text-[#ff4d2d]" /> {new Date(res.eventDate).toLocaleDateString()} at {new Date(res.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className='flex flex-col items-end gap-1.5'>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(res.status)}`}>
                        {res.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        (res.paymentStatus || 'Unpaid') === 'Paid'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {(res.paymentStatus || 'Unpaid') === 'Paid' ? '✅' : '⏳'} {res.paymentStatus || 'Unpaid'}
                        {res.paymentStatus === 'Paid' && res.paidAmount > 0 && ` · ₹${res.paidAmount}`}
                      </span>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm'>
                    <div>
                      <p className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-1'>Guests</p>
                      <p className='font-bold text-gray-800 flex items-center gap-2'><FaUserFriends className="text-gray-400" /> {res.guests} Guests</p>
                    </div>
                    <div>
                      <p className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-1'>Contact Phone</p>
                      <p className='font-bold text-gray-800'>{res.phone}</p>
                    </div>
                  </div>

                  {res.requirements && (
                    <div className='text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2.5 rounded-lg italic border-l-4 border-l-gray-300'>
                      "{res.requirements}"
                    </div>
                  )}

                  {res.bill > 0 && (
                    <button
                      onClick={() => setSelectedEventInvoice(res)}
                      className='w-full py-2.5 bg-purple-600 hover:bg-purple-750 text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer mb-2'
                    >
                      View Invoice / PDF
                    </button>
                  )}

                  {res.status === 'Completed' && (
                    <div className='border-t border-dashed border-gray-100 pt-4 mt-2 text-left'>
                      <div className='flex justify-between items-center bg-green-50/50 border border-green-100 px-4 py-2.5 rounded-xl text-green-700 font-bold text-sm mb-4 flex-wrap gap-2'>
                        <span className="flex items-center gap-2"><FaCheckCircle /> Event Completed successfully!</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600">Bill: ₹{res.bill || 0}</span>
                          {!res.rating && (
                            <button
                              onClick={() => setShowReservationReview(prev => ({ ...prev, [res._id]: !prev[res._id] }))}
                              className='flex items-center gap-1.5 px-3 py-1.5 bg-[#ff4d2d] hover:bg-[#e03c20] text-white text-xs font-bold rounded-lg transition-colors shadow-sm shrink-0'
                            >
                              <FaStar size={11} /> {showReservationReview[res._id] ? 'Cancel' : 'Leave a Review'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Review Box */}
                      {res.rating ? (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Your Review</h4>
                          <div className="flex gap-1 text-yellow-400 text-lg mb-2">
                            {[...Array(5)].map((_, i) => (
                              i < res.rating ? <FaStar key={i} /> : <FaRegStar key={i} className="text-gray-200" />
                            ))}
                          </div>
                          <p className="text-sm italic text-gray-600">"{res.review}"</p>
                        </div>
                      ) : (
                        showReservationReview[res._id] && (
                          <div className="bg-[#fffcfb] border border-[#ffe4df] rounded-xl p-5 flex flex-col gap-4">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <FaCommentDots className="text-[#ff4d2d]" /> How was your event experience?
                            </h4>

                            {/* Star Rating */}
                            <div>
                              <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">Your Rating</p>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar
                                    key={star}
                                    size={28}
                                    className={`cursor-pointer transition-colors ${ (ratings[res._id] || 0) >= star ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
                                    onClick={() => setRatings(prev => ({ ...prev, [res._id]: star }))}
                                  />
                                ))}
                                {ratings[res._id] && (
                                  <span className="text-sm font-bold text-yellow-500 ml-1 self-center">
                                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][ratings[res._id]]}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Text */}
                            <div>
                              <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">Your Feedback</p>
                              <textarea
                                rows="3"
                                placeholder="How was the venue, decorations, food, and host service?"
                                value={comments[res._id] || ""}
                                onChange={e => setComments(prev => ({ ...prev, [res._id]: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#ff4d2d] resize-none"
                              />
                            </div>

                            <button
                              onClick={() => {
                                handleSubmittingReview(res._id, res);
                                setShowReservationReview(prev => ({ ...prev, [res._id]: false }));
                              }}
                              disabled={!ratings[res._id]}
                              className="bg-[#ff4d2d] hover:bg-[#e03c20] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-5 py-2.5 rounded-xl self-end transition-colors shadow-sm animate-fade-in"
                            >
                              Submit Feedback
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className='flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
                <div className='text-7xl mb-4'>📅</div>
                <h2 className='text-xl font-semibold text-gray-700 mb-2'>No Reservations</h2>
                <p className='text-gray-400 text-sm'>Create custom bookings or select party packages on the Reservations tab!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className='space-y-6 animate-fade-in'>
            {sessionHistory && sessionHistory.length > 0 ? (
              sessionHistory.map((sess) => (
                <div key={sess._id} className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 text-left'>
                  <div className='flex justify-between items-start flex-wrap gap-3'>
                    <div>
                      <h3 className='text-lg font-black text-gray-900'>Table {sess.tableNumber} Dining Session</h3>
                      <p className='text-xs text-gray-400 font-bold mt-1 flex items-center gap-1.5'>
                        <FaClock className="text-gray-300" /> {new Date(sess.createdAt).toLocaleDateString('en-IN')} at {new Date(sess.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className='flex flex-col items-end gap-1.5'>
                      <span className='px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-black uppercase tracking-wider'>
                        Checked Out
                      </span>
                      <span className='text-lg font-black text-gray-800'>
                        ₹{(sess.billAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className='grid grid-cols-3 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs font-bold text-gray-500'>
                    <div>
                      <p className='text-[10px] text-gray-400 uppercase tracking-wider mb-0.5'>Party Size</p>
                      <p className='text-gray-800 flex items-center gap-1.5'><FaUserFriends className="text-gray-400" /> {sess.partySize || 1} Guests</p>
                    </div>
                    <div>
                      <p className='text-[10px] text-gray-400 uppercase tracking-wider mb-0.5'>Session PIN</p>
                      <p className='text-gray-800 font-mono tracking-wider'>{sess.verificationPin || '—'}</p>
                    </div>
                    <div>
                      <p className='text-[10px] text-gray-400 uppercase tracking-wider mb-0.5'>Items Ordered</p>
                      <p className='text-gray-800'>{sess.items?.reduce((sum, i) => sum + i.quantity, 0) || 0} items</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSessionInvoice(sess)}
                    className='w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer'
                  >
                    View Bill / PDF Invoice
                  </button>
                </div>
              ))
            ) : (
              <div className='flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
                <div className='text-7xl mb-4'>🧾</div>
                <h2 className='text-xl font-semibold text-gray-700 mb-2'>No Dining Session Bills</h2>
                <p className='text-gray-400 text-sm'>Checked-out sessions and consolidated dining bills will appear here.</p>
              </div>
            )}
          </div>
        )}


      {/* Dynamic PDF Invoice Modal */}
      {selectedSessionInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">Dining Session Receipt</h3>
              <button 
                onClick={() => setSelectedSessionInvoice(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-8 overflow-y-auto flex-1 text-left" id="printable-invoice">
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-invoice, #printable-invoice * {
                    visibility: visible !important;
                  }
                  #printable-invoice {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                  .no-print-element {
                    display: none !important;
                  }
                }
              `}} />

              {/* Invoice Layout */}
              <div className="border-b-2 border-gray-100 pb-6 mb-6">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-[#ff4d2d] tracking-wide uppercase">Prime Dine</h1>
                    <p className="text-xs text-gray-400 font-bold mt-1">Multi-Cuisine Fine Dining & Premium Events</p>
                    <p className="text-xs text-gray-400 font-medium">100 Fine Dine Blvd, City Center</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase inline-block border border-green-200">
                      Paid & Settled
                    </div>
                    <p className="text-xs text-gray-400 font-bold mt-2">PIN: {selectedSessionInvoice.verificationPin}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="grid grid-cols-2 gap-6 border-b border-gray-150 pb-6 mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invoice Details</p>
                  <p className="text-sm font-black text-gray-800">No: #SESS-{selectedSessionInvoice._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs font-bold text-gray-500">Date: {new Date(selectedSessionInvoice.createdAt).toLocaleDateString('en-IN')}</p>
                  <p className="text-xs font-bold text-gray-500">Time: {new Date(selectedSessionInvoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dine-in Info</p>
                  <p className="text-sm font-black text-gray-800">Table {selectedSessionInvoice.tableNumber}</p>
                  <p className="text-xs font-bold text-gray-500">Party Size: {selectedSessionInvoice.partySize || 1} Guests</p>
                  <p className="text-xs font-bold text-gray-500">Customer: {userData?.fullName}</p>
                </div>
              </div>

              {/* Items List Table */}
              <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Order Details</p>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-200">
                        <th className="py-2.5 px-4">Item Name</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4 text-right">Rate</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSessionInvoice.items && selectedSessionInvoice.items.length > 0 ? (
                        selectedSessionInvoice.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100 text-sm font-bold text-gray-700 last:border-0 hover:bg-gray-50/50">
                            <td className="py-3 px-4 text-gray-800">{item.name}</td>
                            <td className="py-3 px-4 text-center text-gray-600">{item.quantity}x</td>
                            <td className="py-3 px-4 text-right text-gray-600">₹{item.price.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-4 text-right text-gray-800">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-6 px-4 text-center text-gray-400 italic">No food items orders logged in this session.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoicing calculation */}
              <div className="flex flex-col items-end gap-2 bg-gray-50 p-6 rounded-2xl border border-gray-100 font-bold">
                <div className="flex justify-between w-64 text-sm text-gray-500 font-medium">
                  <span>Subtotal:</span>
                  <span>₹{(selectedSessionInvoice.billAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-xs text-gray-400 font-medium">
                  <span>CGST (2.5%):</span>
                  <span>₹{Math.round((selectedSessionInvoice.billAmount || 0) * 0.025).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-xs text-gray-400 font-medium">
                  <span>SGST (2.5%):</span>
                  <span>₹{Math.round((selectedSessionInvoice.billAmount || 0) * 0.025).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-gray-200 w-64 my-1"></div>
                <div className="flex justify-between w-64 text-base text-gray-900 font-black">
                  <span>Grand Total:</span>
                  <span>₹{Math.round((selectedSessionInvoice.billAmount || 0) * 1.05).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Invoice Footer */}
              <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-150 text-center">
                <p className="text-sm font-black text-gray-700">Thank you for dining with us! ❤️</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">Prime Dine Command Center · Digital Receipt</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 no-print-element">
              <button 
                onClick={() => setSelectedSessionInvoice(null)}
                className="flex-1 py-3 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-[#ff4d2d] hover:bg-[#e03c20] text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                Download PDF / Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Event PDF Invoice Modal */}
      {selectedEventInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">Event Reservation Invoice</h3>
              <button 
                onClick={() => setSelectedEventInvoice(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-8 overflow-y-auto flex-1 text-left" id="printable-invoice">
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-invoice, #printable-invoice * {
                    visibility: visible !important;
                  }
                  #printable-invoice {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                  .no-print-element {
                    display: none !important;
                  }
                }
              `}} />

              {/* Invoice Layout */}
              <div className="border-b-2 border-gray-100 pb-6 mb-6">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-purple-600 tracking-wide uppercase">Prime Dine Events</h1>
                    <p className="text-xs text-gray-400 font-bold mt-1">Multi-Cuisine Fine Dining & Premium Events</p>
                    <p className="text-xs text-gray-400 font-medium">100 Fine Dine Blvd, City Center</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase inline-block border ${
                      (selectedEventInvoice.paymentStatus || 'Unpaid') === 'Paid'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-650 border-red-200'
                    }`}>
                      {selectedEventInvoice.paymentStatus || 'Unpaid'}
                    </span>
                    <p className="text-xs text-gray-400 font-bold mt-2">Status: {selectedEventInvoice.status}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="grid grid-cols-2 gap-6 border-b border-gray-150 pb-6 mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invoice Details</p>
                  <p className="text-sm font-black text-gray-800">No: #EVT-{selectedEventInvoice._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs font-bold text-gray-500">Date: {new Date(selectedEventInvoice.eventDate).toLocaleDateString('en-IN')}</p>
                  <p className="text-xs font-bold text-gray-500">Time: {new Date(selectedEventInvoice.eventDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client Info</p>
                  <p className="text-sm font-black text-gray-800">{selectedEventInvoice.fullName}</p>
                  <p className="text-xs font-bold text-gray-500">Phone: {selectedEventInvoice.phone}</p>
                  <p className="text-xs font-bold text-gray-500">Guests: {selectedEventInvoice.guests} Guests</p>
                </div>
              </div>

              {/* Event Details Section */}
              <div className="mb-6 space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Booking Package & Theme</p>
                <div className="border border-gray-250 p-4 rounded-2xl bg-gray-50 grid grid-cols-2 gap-4 text-sm font-bold text-left">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Selected Package</span>
                    <span className="text-gray-800">{selectedEventInvoice.packageTitle || 'Custom Booking'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Event Type</span>
                    <span className="text-gray-800">{selectedEventInvoice.eventType}</span>
                  </div>
                  {selectedEventInvoice.decorationTheme && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-gray-400 uppercase block">Decoration Theme</span>
                      <span className="text-gray-800">{selectedEventInvoice.decorationTheme}</span>
                    </div>
                  )}
                  {selectedEventInvoice.requirements && (
                    <div className="col-span-2 border-t border-gray-200 pt-2">
                      <span className="text-[10px] text-gray-400 uppercase block">Specific Instructions</span>
                      <p className="text-xs text-gray-500 italic mt-0.5">"{selectedEventInvoice.requirements}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="flex flex-col items-end gap-2 bg-gray-50 p-6 rounded-2xl border border-gray-100 font-bold">
                <div className="flex justify-between w-64 text-sm text-gray-500 font-medium">
                  <span>Base Bill (Package & Deco):</span>
                  <span>₹{(selectedEventInvoice.bill || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-xs text-gray-400 font-medium">
                  <span>GST / Service tax (5%):</span>
                  <span>₹{Math.round((selectedEventInvoice.bill || 0) * 0.05).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-gray-200 w-64 my-1"></div>
                <div className="flex justify-between w-64 text-sm text-gray-900 font-black">
                  <span>Grand Total (Inclusive):</span>
                  <span>₹{Math.round((selectedEventInvoice.bill || 0) * 1.05).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-xs text-green-700 font-bold">
                  <span>Paid Amount:</span>
                  <span>- ₹{(selectedEventInvoice.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-gray-200 w-64 my-1"></div>
                <div className="flex justify-between w-64 text-base text-gray-900 font-black">
                  <span>Balance Due:</span>
                  <span className={selectedEventInvoice.paymentStatus === 'Paid' ? 'text-green-700' : 'text-red-650'}>
                    ₹{Math.round(
                      (selectedEventInvoice.paymentStatus === 'Paid')
                        ? 0
                        : Math.max(0, Math.round((selectedEventInvoice.bill || 0) * 1.05) - (selectedEventInvoice.paidAmount || 0))
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Invoice Footer */}
              <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-150 text-center">
                <p className="text-sm font-black text-gray-700">Thank you for hosting your special event with Prime Dine! ❤️</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">Prime Dine Command Center · Event Receipt</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 no-print-element">
              <button 
                onClick={() => setSelectedEventInvoice(null)}
                className="flex-1 py-3 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-[#ff4d2d] hover:bg-[#e03c20] text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                Download PDF / Print
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default MyOrders;
