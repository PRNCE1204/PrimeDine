import React, { useState, useEffect, useCallback } from 'react';
import { FaClock, FaCheckCircle, FaFireAlt, FaExclamationCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { serverUrl } from '../../App';

// Computes how many minutes overdue an order is.
// Returns a positive number if delayed, 0 or negative if on time.
const getDelayMinutes = (order) => {
  if (!order.preparingAt || !order.estimatedPrepTime || order.status === 'Ready' || order.status === 'Completed') return 0;
  const deadline = new Date(order.preparingAt).getTime() + order.estimatedPrepTime * 60000;
  const diffMs = Date.now() - deadline;
  if (diffMs <= 0) return 0;
  const overdue = Math.floor(diffMs / 60000);
  return overdue > 0 ? overdue : 0.1; // return at least 0.1 to flag as delayed (> 0) immediately
};

export default function KitchenMonitor() {
  const socket = useSocket();
  const [queue, setQueue] = useState([]);
  const [tick, setTick] = useState(0); // forces re-render every second for live timer

  const formatOrder = (order) => {
    const tableText = order.deliveryAddress?.text || 'Dine-in';
    const shopOrder = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;

    const created = new Date(order.createdAt).getTime();
    const now = new Date().getTime();
    const diffInMinutes = Math.floor((now - created) / 60000);

    const statusMap = {
      'pending': 'Pending',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'completed': 'Completed',
      'delivered': 'Delivered'
    };

    return {
      _id: order._id,
      id: order._id.substring(order._id.length - 4),
      table: tableText.replace('Dine-in / ', '').replace('Table ', ''),
      status: statusMap[shopOrder?.status] || 'Pending',
      wait: diffInMinutes > 0 ? diffInMinutes : 0,
      createdAt: order.createdAt,
      preparingAt: shopOrder?.preparingAt || null,
      estimatedPrepTime: shopOrder?.estimatedPrepTime || 0,
      items: (shopOrder?.shopOrderItems || []).map(i => `${i.name || (i.item && i.item.name) || 'Item'} x${i.quantity}`)
    };
  };

  // Fetch and set queue
  const fetchQueue = useCallback(async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true });
      const activeOrders = res.data
        .filter(order => {
          const so = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
          return so && so.status !== 'completed' && so.status !== 'delivered';
        })
        .map(formatOrder);
      setQueue(activeOrders);
    } catch (error) {
      console.error('Error fetching kitchen queue:', error);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Polling fallback every 30 seconds
    const poll = setInterval(fetchQueue, 30000);
    return () => clearInterval(poll);
  }, [fetchQueue]);

  // Live tick every second — updates wait time + delay calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
      setQueue(prev => prev.map(q => {
        if (q.status === 'Ready' || q.status === 'Completed') return q;
        const diff = Math.floor((Date.now() - new Date(q.createdAt).getTime()) / 60000);
        return { ...q, wait: diff > 0 ? diff : 0 };
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Socket updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      const newFormattedOrder = formatOrder(data);
      setQueue(prev => {
        if (prev.find(q => q._id === newFormattedOrder._id)) return prev;
        return [newFormattedOrder, ...prev];
      });
      toast.success(`🍕 New order for Table ${newFormattedOrder.table}`);
    };

    // order-updated is emitted globally by the backend on every status change
    const handleStatusUpdate = ({ orderId, status, estimatedPrepTime, preparingAt }) => {
      const statusMap = {
        'pending': 'Pending', 'preparing': 'Preparing',
        'ready': 'Ready', 'completed': 'Completed', 'delivered': 'Delivered'
      };
      const mappedStatus = statusMap[status] || status;

      setQueue(prev => {
        return prev
          .map(q => {
            if (q._id !== orderId) return q;
            return {
              ...q,
              status: mappedStatus,
              // Always update prep time & preparingAt when cook sets them
              estimatedPrepTime: estimatedPrepTime !== undefined ? estimatedPrepTime : q.estimatedPrepTime,
              preparingAt: preparingAt !== undefined ? preparingAt : q.preparingAt,
            };
          })
          // Remove completed/delivered orders from live queue
          .filter(q => q.status !== 'Completed' && q.status !== 'Delivered');
      });
    };

    const handleOrderDelayedAlert = (data) => {
      const toastMsg = data.isInitial 
        ? `⚠️ Table ${data.table} order delay: waiting time is over!`
        : `⏰ Order #${data.shortId} for Table ${data.table} is delayed by ${data.delayMinutes} min`;
      toast.error(toastMsg, { duration: 8000 });
      fetchQueue();
    };

    const handleDashboardUpdated = () => fetchQueue();

    socket.on('new-order', handleNewOrder);
    socket.on('order-updated', handleStatusUpdate);
    socket.on('order-delayed-alert', handleOrderDelayedAlert);
    socket.on('dashboard-updated', handleDashboardUpdated);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-updated', handleStatusUpdate);
      socket.off('order-delayed-alert', handleOrderDelayedAlert);
      socket.off('dashboard-updated', handleDashboardUpdated);
    };
  }, [socket, fetchQueue]);

  // Classify orders for stats — delayed = past deadline
  const pendingCount   = queue.filter(q => q.status === 'Pending').length;
  const preparingCount = queue.filter(q => q.status === 'Preparing' && getDelayMinutes(q) <= 0).length;
  const readyCount     = queue.filter(q => q.status === 'Ready').length;
  const delayedCount   = queue.filter(q => q.status === 'Preparing' && getDelayMinutes(q) > 0).length;

  const stats = [
    { label: 'Pending',   value: pendingCount,   icon: <FaClock className="text-gray-500" />,            bg: 'bg-gray-50 border-gray-200 text-gray-700' },
    { label: 'Preparing', value: preparingCount,  icon: <FaFireAlt className="text-[#F59E0B]" />,         bg: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
    { label: 'Ready',     value: readyCount,      icon: <FaCheckCircle className="text-[#22C55E]" />,     bg: 'bg-green-50 border-green-200 text-green-800' },
    { label: 'Delayed',   value: delayedCount,    icon: <FaExclamationCircle className="text-[#EF4444]" />, bg: 'bg-red-50 border-red-200 text-red-800' },
  ];

  const getCardStyle = (order) => {
    const delayed = order.status === 'Preparing' && getDelayMinutes(order) > 0;
    if (delayed)                  return 'border-[#EF4444] bg-red-50/30';
    if (order.status === 'Ready') return 'border-[#22C55E] bg-green-50/20';
    if (order.status === 'Preparing') return 'border-[#F59E0B] bg-yellow-50/20';
    return 'border-gray-100 bg-white';
  };

  return (
    <div className='animate-fade-in'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Live Kitchen Monitor</h1>
        <p className='text-gray-500 text-sm mt-1'>Real-time view of kitchen queue — delays update every 10 seconds</p>
      </div>

      {/* Overview Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
        {stats.map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center shadow-sm ${stat.bg}`}>
            <div className='text-3xl mb-2'>{stat.icon}</div>
            <h3 className='text-4xl font-black mb-1'>{stat.value}</h3>
            <p className='text-sm font-bold uppercase tracking-wider opacity-80'>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Kitchen Queue */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        <div className='p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50'>
          <h2 className='text-lg font-bold text-gray-800'>Kitchen Queue</h2>
          <span className='text-sm font-bold text-gray-500'>Live</span>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 bg-gray-50/50'>
          {queue.length === 0 ? (
            <div className='col-span-full py-12 text-center text-gray-500'>
              <p className='text-lg font-medium'>No active orders in the kitchen.</p>
            </div>
          ) : (
            queue.map((order, i) => {
              const delayMins = order.status === 'Preparing' ? getDelayMinutes(order) : 0;
              const isDelayed = delayMins > 0;

              // If preparing, show time remaining or overdue
              let timerDisplay = null;
              if (order.status === 'Preparing' && order.preparingAt && order.estimatedPrepTime > 0) {
                const deadline = new Date(order.preparingAt).getTime() + order.estimatedPrepTime * 60000;
                const diffSec = Math.floor((deadline - Date.now()) / 1000);
                if (diffSec > 0) {
                  const m = Math.floor(diffSec / 60);
                  const s = diffSec % 60;
                  timerDisplay = { label: 'Time Remaining', value: `${m}m ${s}s`, color: 'text-yellow-600' };
                } else {
                  const overSec = Math.abs(Math.floor((Date.now() - deadline) / 1000));
                  const m = Math.floor(overSec / 60);
                  const s = overSec % 60;
                  timerDisplay = { label: '⚠️ Delayed by', value: `${m}m ${s}s`, color: 'text-red-600' };
                }
              }

              return (
                <div key={i} className={`p-5 rounded-2xl shadow-sm border-2 relative transition-all duration-500 ${getCardStyle(order)}`}>

                  {/* Delayed banner */}
                  {isDelayed && (
                    <div className='absolute -top-3 left-4 bg-[#EF4444] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md'>
                      <FaExclamationTriangle className='animate-pulse' /> DELAYED
                    </div>
                  )}

                  {/* Order Header */}
                  <div className='flex justify-between items-start mb-4 mt-1'>
                    <div>
                      <h3 className='text-xl font-black text-gray-900'>Order #{order.id}</h3>
                      <p className='text-sm font-bold text-gray-500'>
                        {order.table.startsWith('Table') ? order.table : `Table ${order.table}`}
                      </p>
                    </div>
                    <div className='text-right'>
                      <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold mb-1 ${
                        isDelayed            ? 'bg-red-100 text-red-700 animate-pulse' :
                        order.status === 'Ready'     ? 'bg-green-100 text-green-700' :
                        order.status === 'Preparing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {isDelayed ? 'Delayed' : order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className='bg-white/70 p-3 rounded-lg border border-gray-100 mb-4 min-h-[70px]'>
                    <ul className='space-y-1'>
                      {order.items.map((item, idx) => (
                        <li key={idx} className='text-sm font-medium text-gray-700 flex items-start gap-2'>
                          <span className='text-gray-400 mt-1'>•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Live countdown / overdue timer */}
                  {timerDisplay && (
                    <div className={`flex justify-between items-center py-3 px-4 rounded-xl mb-3 ${isDelayed ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${timerDisplay.color}`}>
                        {timerDisplay.label}
                      </span>
                      <span className={`font-black text-lg flex items-center gap-1.5 tabular-nums ${timerDisplay.color}`}>
                        <FaClock className={isDelayed ? 'animate-pulse' : ''} />
                        {timerDisplay.value}
                      </span>
                    </div>
                  )}

                  {/* Estimated prep time set by cook */}
                  {order.estimatedPrepTime > 0 && order.status === 'Preparing' && (
                    <div className='text-xs text-gray-400 font-medium mb-2'>
                      Cook set: {order.estimatedPrepTime} min prep time
                    </div>
                  )}

                  {/* Total wait time footer */}
                  <div className={`flex justify-between items-center pt-3 border-t ${isDelayed ? 'border-red-100 text-red-500' : 'border-gray-100 text-gray-500'}`}>
                    <span className='text-xs font-bold uppercase tracking-wider'>Total Wait</span>
                    <span className='font-black text-base flex items-center gap-1.5'>
                      <FaClock /> {order.wait} min
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
