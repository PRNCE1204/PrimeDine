import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { serverUrl } from '../../App';
import toast from 'react-hot-toast';
import { FaUtensils, FaTimes, FaClock, FaCheckCircle, FaLock, FaKey } from 'react-icons/fa';

export default function TablePinWidget() {
  const { userData } = useSelector(state => state.user);
  const socket = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [session, setSession] = useState(null); // TableSession document from DB
  const [loading, setLoading] = useState(false);
  const [liveOrderStatus, setLiveOrderStatus] = useState(null); // null | 'pending' | 'preparing' | 'ready' | 'completed'

  const fetchMySession = useCallback(async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/order/table-session/my-session`, { withCredentials: true });
      setSession(res.data);
      if (res.data) {
        setTableNumber(res.data.tableNumber);
        setPartySize(res.data.partySize?.toString() || '1');
      } else {
        setTableNumber('');
        setLiveOrderStatus(null);
      }
    } catch (error) {
      console.error("Error fetching my table session:", error);
    }
  }, []);

  useEffect(() => {
    if (userData?._id) {
      fetchMySession();
    }
  }, [userData?._id, fetchMySession]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-table-pin-widget', handleOpen);
    return () => window.removeEventListener('open-table-pin-widget', handleOpen);
  }, []);

  useEffect(() => {
    if (!socket || !userData?._id) return;

    const handleSessionApproved = (data) => {
      if (String(data.userId) === String(userData._id)) {
        toast.success(`Table PIN Approved! Use PIN: ${data.pin} 🔑`, { duration: 6000 });
        fetchMySession();
        setIsOpen(true); // Open details popup to show them the PIN
      }
    };

    const handleSessionDeactivated = (data) => {
      if (session && String(session.tableNumber) === String(data.tableNumber)) {
        toast.success(`Table session cleared.`);
        setSession(null);
        setTableNumber('');
        setLiveOrderStatus(null);
      }
    };

    const handleOrderStatusUpdated = ({ status, userId: eventUserId }) => {
      if (String(eventUserId) === String(userData._id)) {
        setLiveOrderStatus(status);
        const messages = {
          preparing: '🍳 Your food is being prepared!',
          ready: '🔔 Your food is ready! A waiter will bring it shortly.',
          completed: '✅ Enjoy your meal!',
        };
        if (messages[status]) toast.success(messages[status], { duration: 5000 });
      }
    };

    socket.on('table-session-approved', handleSessionApproved);
    socket.on('table-session-deactivated', handleSessionDeactivated);
    socket.on('table-session-updated', fetchMySession);
    socket.on('order-status-updated', handleOrderStatusUpdated);

    return () => {
      socket.off('table-session-approved', handleSessionApproved);
      socket.off('table-session-deactivated', handleSessionDeactivated);
      socket.off('table-session-updated', fetchMySession);
      socket.off('order-status-updated', handleOrderStatusUpdated);
    };
  }, [socket, userData?._id, session, fetchMySession]);

  const handleRequestPin = async (e) => {
    e.preventDefault();
    if (!tableNumber) {
      toast.error("Please select a table number.");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${serverUrl}/api/order/table-session/request`, {
        tableNumber: tableNumber.toString(),
        partySize: parseInt(partySize)
      }, { withCredentials: true });
      setSession(res.data);
      toast.success("PIN Request sent to owner. Waiting for check-in verification... ⏳");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to request PIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!session) return;
    try {
      setLoading(true);
      const endpoint = session.pinRequestStatus === 'approved' 
        ? `${serverUrl}/api/order/table-session/release`
        : `${serverUrl}/api/order/table-session/deactivate`;
      
      await axios.post(endpoint, {
        tableNumber: session.tableNumber
      }, { withCredentials: true });
      
      setSession(null);
      setTableNumber('');
      if (session.pinRequestStatus === 'approved') {
        toast.success("Dine-in session ended. Awaiting payment clearance from owner.");
      } else {
        toast.success("Session closed.");
      }
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to close session.");
    } finally {
      setLoading(false);
    }
  };

  if (!userData || userData.role !== 'customer') return null;

  // Determine widget appearance based on status
  const requestStatus = session ? session.pinRequestStatus : 'none';

  return (
    <div className="fixed bottom-28 right-6 md:bottom-28 md:right-8 z-[9999] font-sans">

      {/* Floating Status Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 border hover:-translate-y-1 ${requestStatus === 'approved'
            ? 'bg-green-600 hover:bg-green-700 text-white border-green-700'
            : requestStatus === 'requested'
              ? 'bg-amber-50 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
              : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
          }`}
      >
        <FaUtensils />
        <span>
          {requestStatus === 'approved'
            ? `Table ${session.tableNumber} (PIN Active)`
            : requestStatus === 'requested'
              ? 'PIN Pending Waiter...'
              : 'Dine-In Check-In'}
        </span>
        <div className={`w-2.5 h-2.5 rounded-full border border-white ${requestStatus === 'approved' ? 'bg-green-300' : requestStatus === 'requested' ? 'bg-amber-300' : 'bg-red-400'
          }`}></div>
      </button>

      {/* Slide-Up Widget Modal Console */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-transparent z-[9998]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-6 z-[9999] text-left animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h4 className="font-black text-gray-900 text-sm tracking-tight flex items-center gap-1.5">
                <FaLock className="text-[#ff4d2d]" /> Dine-In Session
              </h4>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={16} />
              </button>
            </div>

            {requestStatus === 'none' && (
              <form onSubmit={handleRequestPin} className="space-y-4">
                <p className="text-xs text-gray-500 font-medium">
                  Sitting at a table? Request a Table PIN to unlock the ordering system.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Table Number</label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff4d2d] focus:border-[#ff4d2d] text-sm"
                  >
                    <option value="">-- Choose Table --</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Table {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Number of Guests</label>
                  <select
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff4d2d] focus:border-[#ff4d2d] text-sm"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Person' : 'People'}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#ff4d2d] hover:bg-[#e03c20] text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-60"
                >
                  {loading ? 'Submitting...' : 'Request PIN from Owner'}
                </button>
              </form>
            )}

            {requestStatus === 'requested' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-100 animate-pulse">
                  <FaClock size={20} />
                </div>
                <div>
                  <h5 className="font-bold text-gray-800 text-sm">Verifying Seating...</h5>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed px-2">
                    Request sent for **Table {session?.tableNumber}**. The owner/waiter is checking if you are physically seated there to approve your PIN.
                  </p>
                </div>
                <button
                  onClick={handleDeactivate}
                  disabled={loading}
                  className="py-2.5 px-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 font-bold text-xs hover:bg-gray-100 transition-colors"
                >
                  Cancel Request
                </button>
              </div>
            )}

            {requestStatus === 'approved' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-green-700 font-bold text-xs uppercase mb-2">
                    <FaCheckCircle /> Checked In (Table {session?.tableNumber})
                  </div>
                  <div className="text-xs text-gray-500 mb-2">Your Verification PIN is:</div>
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(session.verificationPin);
                      toast.success("PIN copied! 📋");
                    }}
                    className="bg-white border-2 border-dashed border-green-300 rounded-xl py-3 text-3xl font-black text-green-700 tracking-widest cursor-pointer hover:bg-green-100/30 transition-colors flex items-center justify-center gap-2 group relative"
                    title="Click to copy"
                  >
                    <FaKey className="text-green-500 text-base" />
                    <span>{session.verificationPin}</span>
                    <span className="absolute bottom-1 right-2 text-[8px] font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
                  </div>
                </div>

                {/* Live Kitchen Order Status Tracker */}
                {liveOrderStatus && (
                  <div className="rounded-2xl border overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Kitchen Status</p>
                    </div>
                    <div className="p-3 flex items-center gap-3">
                      {['pending', 'preparing', 'ready', 'completed'].map((step, i) => {
                        const steps = ['pending', 'preparing', 'ready', 'completed'];
                        const currentIdx = steps.indexOf(liveOrderStatus);
                        const stepIdx = steps.indexOf(step);
                        const isActive = stepIdx === currentIdx;
                        const isDone = stepIdx < currentIdx;
                        const labels = { pending: 'Queued', preparing: 'Cooking', ready: 'Ready!', completed: 'Served' };
                        const icons = { pending: '🕐', preparing: '🍳', ready: '🔔', completed: '✅' };
                        return (
                          <div key={step} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${isActive ? 'bg-[#ff4d2d] shadow-lg scale-110' : isDone ? 'bg-green-500' : 'bg-gray-100'}`}>
                              {icons[step]}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider text-center ${isActive ? 'text-[#ff4d2d]' : isDone ? 'text-green-600' : 'text-gray-400'}`}>{labels[step]}</span>
                            {i < 3 && <div className={`absolute h-0.5 w-4 mt-4 ml-10 ${isDone ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-gray-400 font-medium text-center">
                  *Orders placed on this device will require this PIN code.
                </p>

                <button
                  onClick={handleDeactivate}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 font-bold text-xs transition-colors"
                >
                  {loading ? 'Releasing...' : 'Check-Out / Release Table'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
