import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { setUserData } from '../../redux/userSlice';
import { useSocket } from '../../context/SocketContext';
import { serverUrl } from '../../App';
import { FaClock, FaCheck, FaExclamationTriangle, FaFire, FaTimes, FaBookOpen, FaUtensils, FaArrowRight, FaArrowLeft, FaSignOutAlt, FaConciergeBell } from 'react-icons/fa';

const INITIAL_ORDERS = [];

const LIVE_ALERTS = [];

const RECIPES = {
  'Paneer Tikka': { 
    prepTime: '15 mins', 
    ingredients: ['200g Paneer cubes', '3 tbsp thick Yogurt', '1 tbsp Tikka Masala', 'Capsicum & Onion chunks'], 
    instructions: '1. Mix yogurt and spices to form a paste. 2. Coat paneer and veggies well. 3. Skewer and grill at 200°C for 10-12 mins until edges char lightly.' 
  },
  'Margherita Pizza': {
    prepTime: '12 mins',
    ingredients: ['1 Pizza Base', '1/2 cup Pizza Sauce', '150g Mozzarella', 'Fresh Basil leaves'],
    instructions: '1. Spread sauce evenly on base. 2. Top generously with cheese. 3. Bake at 250°C for 8-10 mins. 4. Garnish with fresh basil before serving.'
  },
  'Veg Hakka Noodles': {
    prepTime: '8 mins',
    ingredients: ['150g boiled Noodles', 'Mixed Julienne Veggies (Cabbage, Carrot, Capsicum)', 'Soy Sauce, Vinegar, Garlic'],
    instructions: '1. Heat oil in wok, toss garlic and veggies on high heat. 2. Add noodles and sauces. 3. Toss vigorously for 2 mins. Serve hot.'
  }
};

export default function CookDashboard() {
  const { userData } = useSelector(state => state.user);
  const socket = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isUnassigned, setIsUnassigned] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [prepTimeModalOrder, setPrepTimeModalOrder] = useState(null);
  const [customPrepTime, setCustomPrepTime] = useState('15');
  const [avgPrepTime, setAvgPrepTime] = useState(15);
  const [serviceRequests, setServiceRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('cook_service_requests');
      return saved ? JSON.parse(saved).filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  const [activityFeed, setActivityFeed] = useState(() => {
    try {
      const saved = localStorage.getItem('cook_activity_feed');
      return saved ? JSON.parse(saved).filter(Boolean) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cook_service_requests', JSON.stringify(serviceRequests));
  }, [serviceRequests]);

  useEffect(() => {
    localStorage.setItem('cook_activity_feed', JSON.stringify(activityFeed));
  }, [activityFeed]);

  const handleLogOut = async () => {
      try {
          await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
          dispatch(setUserData(null));
          toast.success("You've been logged out. 👋");
          navigate('/');
      } catch (error) {
          toast.error("Logout failed. Please try again.");
      }
  };

  const formatOrder = (order) => {
    if (!order) return null;
    // Determine table text based on payment method and delivery text
    const tableText = order.deliveryAddress?.text || 'Dine-in';
    const shopOrder = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
    
    if (!shopOrder) return null;
    
    // Calculate initial time
    const created = new Date(order.createdAt).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - created) / 60000);

    const start = shopOrder.preparingAt ? new Date(shopOrder.preparingAt).getTime() : null;
    const elapsedMinutes = start ? Math.floor((now - start) / 60000) : 0;
    const isDelayed = shopOrder.status === 'preparing' && start && shopOrder.estimatedPrepTime && (now > (start + shopOrder.estimatedPrepTime * 60000));

    return {
      _id: order._id,
      shopId: shopOrder.shop?._id || shopOrder.shop,
      id: order._id ? order._id.toString().slice(-4).toUpperCase() : '—',
      table: tableText.replace('Dine-in / ', '').replace('Table ', ''),
      time: diffInMinutes > 0 ? diffInMinutes : 0,
      createdAt: order.createdAt,
      status: shopOrder.status || 'pending',
      type: order.paymentMethod === 'cod' ? 'Dine-in' : 'Online',
      items: (shopOrder.shopOrderItems || []).map(i => ({
        name: i.name || (i.item && i.item.name) || 'Unknown Item',
        qty: i.quantity,
        note: ''
      })),
      preparingAt: shopOrder.preparingAt,
      estimatedPrepTime: shopOrder.estimatedPrepTime || 0,
      elapsedMinutes,
      isDelayed,
      delayMinutes: isDelayed ? Math.floor((now - (start + shopOrder.estimatedPrepTime * 60000)) / 60000) : 0
    };
  };

  // Helper to calculate average preparation time dynamically
  // NOTE: For cook/owner queries, shopOrders is already a single object (not array)
  const calculateAvgPrepTime = (rawOrders) => {
    if (!Array.isArray(rawOrders)) return 15;
    const completedOrders = rawOrders.filter(order => {
      if (!order) return false;
      const so = order.shopOrders && !Array.isArray(order.shopOrders)
        ? order.shopOrders
        : Array.isArray(order.shopOrders) ? order.shopOrders[0] : null;
      return so && (so.status === 'completed' || so.status === 'delivered') && so.preparingAt && so.completedAt;
    });

    if (completedOrders.length > 0) {
      const totalDiff = completedOrders.reduce((sum, order) => {
        if (!order) return sum;
        const so = order.shopOrders && !Array.isArray(order.shopOrders)
          ? order.shopOrders
          : Array.isArray(order.shopOrders) ? order.shopOrders[0] : null;
        if (!so) return sum;
        const diffMs = new Date(so.completedAt).getTime() - new Date(so.preparingAt).getTime();
        return sum + Math.max(1, Math.round(diffMs / 60000));
      }, 0);
      return Math.round(totalDiff / completedOrders.length);
    } else {
      const activePrepOrders = rawOrders.filter(order => {
        if (!order) return false;
        const so = order.shopOrders && !Array.isArray(order.shopOrders)
          ? order.shopOrders
          : Array.isArray(order.shopOrders) ? order.shopOrders[0] : null;
        return so && so.status === 'preparing' && so.estimatedPrepTime > 0;
      });
      if (activePrepOrders.length > 0) {
        const totalEst = activePrepOrders.reduce((sum, order) => {
          if (!order) return sum;
          const so = order.shopOrders && !Array.isArray(order.shopOrders)
            ? order.shopOrders
            : Array.isArray(order.shopOrders) ? order.shopOrders[0] : null;
          return sum + ((so && so.estimatedPrepTime) || 15);
        }, 0);
        return Math.round(totalEst / activePrepOrders.length);
      }
    }
    return 15; // default fallback
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true });

      // If the API returns an empty array, the cook might not be assigned to a shop.
      // We check the shop assignment endpoint to distinguish "no orders yet" from "not assigned".
      if (res.data.length === 0) {
        try {
          await axios.get(`${serverUrl}/api/shop/get-cook-shop`, { withCredentials: true });
          setIsUnassigned(false); // 200 means assigned, just no orders
        } catch (shopErr) {
          if (shopErr.response?.status === 404) {
            setIsUnassigned(true); // Cook has no shop linked
            return;
          }
        }
      } else {
        setIsUnassigned(false);
      }

      const activeOrders = res.data
        .filter(order => {
           if (!order) return false;
           // shopOrders is a single object for cook/owner queries (pre-filtered by backend)
           const so = order.shopOrders && !Array.isArray(order.shopOrders)
             ? order.shopOrders
             : Array.isArray(order.shopOrders) ? order.shopOrders[0] : null;
           return so && so.status !== 'completed' && so.status !== 'delivered';
        })
        .map(formatOrder)
        .filter(Boolean);
      setOrders(activeOrders);

      const avg = calculateAvgPrepTime(res.data);
      setAvgPrepTime(avg);
    } catch (error) {
      console.error("Error fetching cook orders:", error);
    }
  }, []);

  const fetchServiceRequests = useCallback(async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/service/active`, { withCredentials: true });
      setServiceRequests(res.data);
    } catch (err) {
      console.error("Error fetching service requests in CookDashboard:", err);
    }
  }, []);

  const handleResolveServiceRequest = async (requestId) => {
    try {
      await axios.post(`${serverUrl}/api/service/complete/${requestId}`, {}, { withCredentials: true });
      toast.success("Service request completed!");
      setServiceRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (error) {
      toast.error("Failed to resolve service request.");
    }
  };

  // Fetch initial orders
  useEffect(() => {
    fetchOrders();
    fetchServiceRequests();
  }, [fetchOrders, fetchServiceRequests]);

  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Timer effect to increment order wait times and check for delays dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const currentOrders = ordersRef.current;
      if (!currentOrders || currentOrders.length === 0) return;

      let hasUpdates = false;
      const updatedOrders = currentOrders.map(o => {
        if (o.status === 'ready' || o.status === 'completed') return o;
        const diff = Math.floor((now - new Date(o.createdAt).getTime()) / 60000);
        
        let isDelayed = o.isDelayed;
        let delayMinutes = o.delayMinutes;
        let elapsedMinutes = o.elapsedMinutes;
        let updatedLastAlertedMinutes = o.lastAlertedMinutes;

        if (o.status === 'preparing' && o.preparingAt && o.estimatedPrepTime) {
          const start = new Date(o.preparingAt).getTime();
          const deadline = start + o.estimatedPrepTime * 60000;
          const wasDelayed = o.isDelayed;
          isDelayed = now > deadline;
          delayMinutes = isDelayed ? Math.floor((now - deadline) / 60000) : 0;

          if (isDelayed) {
            const currentDelay = delayMinutes;
            const isInitial = !wasDelayed || updatedLastAlertedMinutes === undefined;
            const isMinuteInterval = currentDelay > 0 && updatedLastAlertedMinutes !== currentDelay;

            if (isInitial) {
              if (socket) {
                socket.emit('order-delayed', {
                  orderId: o._id,
                  shortId: o.id,
                  table: o.table,
                  delayMinutes: currentDelay,
                  isInitial: true
                });
              }
              updatedLastAlertedMinutes = 0;
              hasUpdates = true;
            } else if (isMinuteInterval) {
              if (socket) {
                socket.emit('order-delayed', {
                  orderId: o._id,
                  shortId: o.id,
                  table: o.table,
                  delayMinutes: currentDelay,
                  isInitial: false
                });
              }
              updatedLastAlertedMinutes = currentDelay;
              hasUpdates = true;
            }
          }
        }

        const newTime = diff > 0 ? diff : 0;
        if (
          o.time !== newTime ||
          o.elapsedMinutes !== elapsedMinutes ||
          o.isDelayed !== isDelayed ||
          o.delayMinutes !== delayMinutes ||
          o.lastAlertedMinutes !== updatedLastAlertedMinutes
        ) {
          hasUpdates = true;
          return {
            ...o,
            time: newTime,
            elapsedMinutes,
            isDelayed,
            delayMinutes,
            lastAlertedMinutes: updatedLastAlertedMinutes
          };
        }
        return o;
      });

      if (hasUpdates) {
        setOrders(updatedOrders);
      }
    }, 15000); // Check every 15 seconds
    return () => clearInterval(timer);
  }, [socket]);

  // Live WebSocket Updates
  useEffect(() => {
    if (socket) {
      const handleNewOrder = (data) => {
        const newFormattedOrder = formatOrder(data);
        if (!newFormattedOrder) return;
        toast.success(`HOT ALERT: New order for Table ${newFormattedOrder.table}! 🔥`, { duration: 4000 });
        setActivityFeed(prev => [{
          id: Date.now(),
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          message: `🆕 New Order #${newFormattedOrder.id} for Table ${newFormattedOrder.table}`
        }, ...prev].slice(0, 15));
        fetchOrders();
      };

      const handleStatusUpdate = ({ orderId, status }) => {
        const shortId = orderId ? orderId.substring(orderId.length - 4) : '—';
        const statusText = { preparing: 'Cooking 🍳', ready: 'Ready to Serve 🔔', completed: 'Served ✅', delivered: 'Served ✅' }[status] || status;
        setActivityFeed(prev => [{
          id: Date.now(),
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          message: `🍳 Order #${shortId} is now: ${statusText}`
        }, ...prev].slice(0, 15));
        fetchOrders();
      };

      const handleNewServiceRequest = (req) => {
        toast.success(`🔔 Service Request: Table ${req.tableNumber} requested ${req.requestType}!`, { duration: 5000 });
        setActivityFeed(prev => [{
          id: Date.now(),
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          message: `🔔 Table ${req.tableNumber} requested ${req.requestType}`
        }, ...prev].slice(0, 15));
        fetchServiceRequests();
      };

      const handleServiceRequestCompleted = ({ tableNumber }) => {
        setActivityFeed(prev => [{
          id: Date.now(),
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          message: `✔️ Table ${tableNumber} service request resolved`
        }, ...prev].slice(0, 15));
        fetchServiceRequests();
      };

      socket.on('new-order', handleNewOrder);
      socket.on('order-updated', handleStatusUpdate);
      socket.on('new-service-request', handleNewServiceRequest);
      socket.on('service-request-completed', handleServiceRequestCompleted);
      
      return () => {
        socket.off('new-order', handleNewOrder);
        socket.off('order-updated', handleStatusUpdate);
        socket.off('new-service-request', handleNewServiceRequest);
        socket.off('service-request-completed', handleServiceRequestCompleted);
      };
    }
  }, [socket, fetchOrders, fetchServiceRequests]);

  const handleConfirmPrepTime = async () => {
    if (!prepTimeModalOrder) return;
    const parsedTime = parseInt(customPrepTime);
    const prepTime = !isNaN(parsedTime) && parsedTime > 0 ? parsedTime : 15;
    
    const { orderId, _id, shopId, newStatus } = prepTimeModalOrder;

    // Close Modal and reset state
    setPrepTimeModalOrder(null);
    setCustomPrepTime('15');

    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Sync with backend
    try {
      await axios.post(`${serverUrl}/api/order/update-status/${_id}/${shopId}`, { 
        status: newStatus, 
        estimatedPrepTime: prepTime 
      }, { withCredentials: true });
      toast.success(`Cooking started! Timer set to ${prepTime} mins ⏱️`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating status", error);
      toast.error("Failed to sync order status.");
    }
  };

  const moveOrder = async (orderId, newStatus, _id, shopId) => {
    if (newStatus === 'preparing') {
      setPrepTimeModalOrder({ orderId, newStatus, _id, shopId, id: orderId });
      return;
    }

    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Sync with backend
    try {
      await axios.post(`${serverUrl}/api/order/update-status/${_id}/${shopId}`, { status: newStatus }, { withCredentials: true });
      fetchOrders();
    } catch (error) {
      console.error("Error updating status", error);
      toast.error("Failed to sync order status.");
    }
  };

  const newOrders = orders.filter(o => o.status === 'pending').sort((a, b) => b.time - a.time);
  const prepOrders = orders.filter(o => o.status === 'preparing').sort((a, b) => b.time - a.time);
  const readyOrders = orders.filter(o => o.status === 'ready').sort((a, b) => b.time - a.time);

  const renderOrder = (order, currentStatus) => {
    const isUrgent = order.time > 20 || order.isUrgent || order.isDelayed;
    
    return (
      <div key={order.id} className={`bg-white rounded-xl shadow-md border-l-4 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${order.isDelayed ? 'border-l-red-600 bg-red-50/10' : isUrgent ? 'border-l-red-500' : currentStatus === 'ready' ? 'border-l-green-500' : 'border-l-blue-500'}`}>
        {/* Order Header */}
        <div className={`px-4 py-3 border-b flex justify-between items-center ${order.isDelayed ? 'bg-red-50 border-red-100' : isUrgent ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
          <div>
            <h3 className='font-black text-gray-900 text-lg'>#{order.id}</h3>
            <p className='text-xs font-bold text-gray-500 uppercase tracking-wider'>{order.type} • {order.table}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${order.isDelayed ? 'bg-red-600 text-white animate-pulse' : isUrgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-white border border-gray-200 text-gray-700 shadow-sm'}`}>
            {order.isDelayed ? (
              <span className="flex items-center gap-1"><FaExclamationTriangle /> DELAYED +{order.delayMinutes}m</span>
            ) : (
              <><FaClock /> {order.time}m</>
            )}
          </div>
        </div>

        {/* Live Service Requests for this table */}
        {(() => {
          const tableRequests = serviceRequests.filter(r => String(r.tableNumber) === String(order.table));
          if (tableRequests.length === 0) return null;
          return (
            <div className="mx-4 mt-3 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-between gap-2 animate-pulse text-left">
              <span className="flex items-center gap-1.5"><FaConciergeBell /> Needs: {tableRequests.map(r => r.requestType).join(', ')}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  tableRequests.forEach(req => handleResolveServiceRequest(req._id));
                }}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-black text-[9px] uppercase tracking-wider transition-colors shrink-0"
              >
                Done
              </button>
            </div>
          );
        })()}

        {/* Order Body (Items) */}
        <div className='p-4'>
          <ul className='space-y-3'>
            {order.items.map((item, idx) => (
              <li key={idx} className='border-b border-gray-50 pb-2 last:border-0 last:pb-0'>
                <div className='flex justify-between items-start'>
                  <div className='flex items-start gap-2'>
                    <span className='font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded'>{item.qty}x</span>
                    <div>
                      <span className='font-bold text-gray-800 text-lg cursor-pointer hover:text-indigo-600 transition-colors flex items-center gap-2' onClick={() => setSelectedRecipe(item.name)}>
                        {item.name}
                        {RECIPES[item.name] && <FaBookOpen className="text-gray-300 text-sm" title="View Recipe" />}
                      </span>
                      {item.note && (
                        <p className='text-xs font-bold text-red-600 bg-red-50 inline-block px-2 py-1 rounded mt-1'>
                          ! {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Order Actions */}
        <div className='px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center gap-2'>
          {currentStatus === 'pending' && (
            <button onClick={() => moveOrder(order.id, 'preparing', order._id, order.shopId)} className='w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors'>
              <FaFire /> Start Cooking
            </button>
          )}
          {currentStatus === 'preparing' && (
            <button onClick={() => moveOrder(order.id, 'ready', order._id, order.shopId)} className='w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors'>
              <FaCheck /> Mark as Ready
            </button>
          )}
          {currentStatus === 'ready' && (
            <button onClick={() => moveOrder(order.id, 'completed', order._id, order.shopId)} className='w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors'>
              <FaUtensils /> Served to Table
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className='w-full h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden'>

      {/* Unassigned Cook State */}
      {isUnassigned && (
        <div className='min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4'>
          <div className='bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center space-y-6'>
            <div className='w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto border border-orange-100'>
              <FaUtensils className='text-orange-400 text-4xl' />
            </div>
            <div>
              <h2 className='text-2xl font-black text-gray-900 mb-2'>Kitchen Not Linked</h2>
              <p className='text-gray-500 font-medium leading-relaxed'>
                Your cook account hasn't been assigned to a restaurant yet.
              </p>
              <div className='mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left'>
                <p className='text-sm font-bold text-amber-800 mb-2'>📋 What to do:</p>
                <ol className='text-sm text-amber-700 font-medium space-y-1 list-decimal list-inside'>
                  <li>Ask your restaurant owner to log into the Owner Dashboard.</li>
                  <li>Tell them to go to the <strong>Staff</strong> tab.</li>
                  <li>Have them enter your email: <strong className='text-amber-900'>{userData?.email}</strong></li>
                  <li>Once assigned, refresh this page.</li>
                </ol>
              </div>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={fetchOrders}
                className='flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors'
              >
                🔄 Check Again
              </button>
              <button
                onClick={handleLogOut}
                className='px-5 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors'
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {!isUnassigned && (
        <>
          {/* Light Theme Nav for KDS */}
          <div className='fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 flex items-center justify-between h-[70px] px-6 shadow-sm'>
        <div className='flex items-center gap-4'>
          <div className='w-10 h-10 bg-[#DC2626] rounded-xl flex items-center justify-center text-white text-xl shadow-md'>
            <FaUtensils />
          </div>
          <div>
            <h1 className='text-xl font-black text-gray-900 tracking-wide'>Kitchen Display System</h1>
            <p className='text-xs font-bold text-gray-500'>Chef {userData?.fullName || 'Station'}</p>
          </div>
        </div>
        
        {/* Quick Stats in Nav */}
        <div className='flex items-center gap-6'>
          <div className='flex flex-col items-end hidden md:flex'>
            <span className='text-xs font-bold text-gray-500 uppercase'>Active Orders</span>
            <span className='text-xl font-black text-gray-900'>{orders.length}</span>
          </div>
          <div className='w-px h-8 bg-gray-200 hidden md:block'></div>
          <div className='flex flex-col items-end hidden md:flex'>
            <span className='text-xs font-bold text-gray-500 uppercase'>Avg Prep Time</span>
            <span className='text-xl font-black text-green-600'>{avgPrepTime}m</span>
          </div>
          <div className='w-px h-8 bg-gray-200'></div>
          <button 
            onClick={handleLogOut}
            className='flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors'
          >
            <FaSignOutAlt /> <span className='hidden sm:inline'>Log Out</span>
          </button>
        </div>
      </div>

      <main className='flex-1 h-[calc(100vh-70px)] mt-[70px] px-4 py-4 flex gap-6 overflow-hidden text-left box-border'>
        
        {/* Kanban Board */}
        <div className='flex-1 flex gap-6 overflow-x-auto pb-4 h-full max-h-full'>
          
          {/* Column 1: New (Pending) Orders */}
          <div className='w-full min-w-[320px] max-w-[400px] flex flex-col h-full bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-sm'>
            <div className='p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10'>
              <h2 className='text-lg font-black text-gray-900 flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-blue-500 animate-pulse'></span> New Order
              </h2>
              <span className='bg-white text-gray-700 shadow-sm border border-gray-200 px-3 py-1 rounded-full text-sm font-bold'>{newOrders.length}</span>
            </div>
            <div className='flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar'>
              {newOrders.map(o => renderOrder(o, 'pending'))}
              {newOrders.length === 0 && <p className='text-center text-gray-500 font-medium mt-10'>No new orders</p>}
            </div>
          </div>

          {/* Column: Preparing */}
          <div className='w-full min-w-[320px] max-w-[400px] flex flex-col h-full bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-sm'>
            <div className='p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10'>
              <h2 className='text-lg font-black text-gray-900 flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-yellow-500 animate-pulse'></span> Preparing
              </h2>
              <span className='bg-white text-gray-700 shadow-sm border border-gray-200 px-3 py-1 rounded-full text-sm font-bold'>{prepOrders.length}</span>
            </div>
            <div className='flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar'>
              {prepOrders.map(o => renderOrder(o, 'preparing'))}
              {prepOrders.length === 0 && <p className='text-center text-gray-500 font-medium mt-10'>No orders currently preparing</p>}
            </div>
          </div>

          {/* Column: Ready */}
          <div className='w-full min-w-[320px] max-w-[400px] flex flex-col h-full bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-sm'>
            <div className='p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10'>
              <h2 className='text-lg font-black text-gray-900 flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-green-500'></span> Ready to Serve
              </h2>
              <span className='bg-white text-gray-700 shadow-sm border border-gray-200 px-3 py-1 rounded-full text-sm font-bold'>{readyOrders.length}</span>
            </div>
            <div className='flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar'>
              {readyOrders.map(o => renderOrder(o, 'ready'))}
              {readyOrders.length === 0 && <p className='text-center text-gray-500 font-medium mt-10'>No orders waiting for pickup</p>}
            </div>
          </div>

          {/* Column 4: Alerts & Live Updates */}
          <div className='w-full min-w-[320px] max-w-[400px] flex flex-col h-full bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-sm'>
            
            {/* Top Half: Service Requests */}
            <div className='flex-1 h-1/2 flex flex-col overflow-hidden'>
              <div className='p-4 bg-orange-50 border-b border-orange-200 flex justify-between items-center sticky top-0 z-10 shrink-0'>
                <h2 className='text-sm font-black text-gray-900 flex items-center gap-2'>
                  <FaConciergeBell className="text-orange-500 animate-bounce" /> Service Requests
                </h2>
                <span className='bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-bold'>{serviceRequests.length}</span>
              </div>
              
              <div className='flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-orange-50/10'>
                {serviceRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                    <FaConciergeBell size={24} className="opacity-20 mb-2" />
                    <p className="text-xs font-bold">All clear!</p>
                    <p className="text-[10px] mt-0.5">No pending customer requests.</p>
                  </div>
                ) : (
                  serviceRequests.map((req) => {
                    const elapsed = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 60000);
                    return (
                      <div key={req._id} className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm flex flex-col gap-2 relative transition-all hover:shadow-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-gray-950 text-xs">Table {req.tableNumber}</h4>
                            <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1 mt-0.5">
                              <FaClock size={8} /> {elapsed > 0 ? `${elapsed} mins ago` : 'just now'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-black uppercase tracking-wider">
                            {req.requestType}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleResolveServiceRequest(req._id)}
                          className="w-full py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px] transition-colors shadow-sm"
                        >
                          Resolve Request
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Half: Live Updates */}
            <div className='flex-1 h-1/2 flex flex-col overflow-hidden border-t border-gray-200'>
              <div className='p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 shrink-0'>
                <h2 className='text-sm font-black text-gray-900 flex items-center gap-2'>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Live Updates
                </h2>
              </div>
              
              <div className='flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-gray-50/20'>
                {activityFeed.length === 0 ? (
                  <p className="text-gray-400 text-center mt-8 text-xs font-medium italic">Listening for live updates...</p>
                ) : (
                  activityFeed.map((feed) => (
                    <div key={feed.id} className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col gap-1 text-left hover:scale-[1.01] transition-transform">
                      <p className="text-xs text-gray-700 font-semibold leading-relaxed">{feed.message}</p>
                      <span className="text-[9px] text-gray-400 font-bold self-end">{feed.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Prep Time Input Modal */}
      {prepTimeModalOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-5 text-left" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 border border-indigo-100">
                <FaClock size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Set Preparation Time</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  How long will it take to prepare Order **#{prepTimeModalOrder.id}**?
                </p>
              </div>
            </div>

            {/* Presets Selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Minutes Presets</label>
              <div className="grid grid-cols-3 gap-2">
                {['5', '10', '15', '20', '30', '45'].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setCustomPrepTime(mins)}
                    type="button"
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                      customPrepTime === mins 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Or Custom Minutes</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customPrepTime}
                  onChange={(e) => setCustomPrepTime(e.target.value)}
                  className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">mins</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setPrepTimeModalOrder(null);
                  setCustomPrepTime('15');
                }}
                type="button"
                className="flex-1 py-3 border border-gray-200 text-gray-500 font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPrepTime}
                type="button"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Confirm & Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Quick-View Modal */}
      {selectedRecipe && RECIPES[selectedRecipe] && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4' onClick={() => setSelectedRecipe(null)}>
          <div className='bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden' onClick={e => e.stopPropagation()}>
            <div className='p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center'>
              <div>
                <h2 className='text-2xl font-black text-gray-900'>{selectedRecipe}</h2>
                <p className='text-sm font-bold text-indigo-600 mt-1 flex items-center gap-1'>
                  <FaClock /> Prep Time: {RECIPES[selectedRecipe].prepTime}
                </p>
              </div>
              <button onClick={() => setSelectedRecipe(null)} className='w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors'>
                <FaTimes />
              </button>
            </div>
            
            <div className='p-6'>
              <h3 className='font-black text-gray-800 uppercase tracking-wider text-sm mb-3'>Ingredients</h3>
              <ul className='grid grid-cols-2 gap-2 mb-6'>
                {RECIPES[selectedRecipe].ingredients.map((ing, i) => (
                  <li key={i} className='flex items-center gap-2 text-gray-600 font-medium text-sm'>
                    <div className='w-1.5 h-1.5 rounded-full bg-indigo-500'></div> {ing}
                  </li>
                ))}
              </ul>

              <h3 className='font-black text-gray-800 uppercase tracking-wider text-sm mb-3'>Instructions</h3>
              <div className='bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 font-medium leading-relaxed text-sm space-y-2'>
                {RECIPES[selectedRecipe].instructions.split(/\d+\./).filter(Boolean).map((step, i) => (
                  <p key={i} className='flex gap-3'>
                    <span className='font-black text-indigo-500'>{i + 1}.</span> {step.trim()}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Fallback modal if recipe not found */}
      {selectedRecipe && !RECIPES[selectedRecipe] && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4' onClick={() => setSelectedRecipe(null)}>
          <div className='bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm' onClick={e => e.stopPropagation()}>
            <FaBookOpen className="text-4xl text-gray-300 mx-auto mb-4" />
            <h2 className='text-xl font-black text-gray-900 mb-2'>Recipe Not Found</h2>
            <p className='text-gray-500 font-medium mb-6'>The recipe for "{selectedRecipe}" is not in the system yet.</p>
            <button onClick={() => setSelectedRecipe(null)} className='w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors'>Close</button>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}
