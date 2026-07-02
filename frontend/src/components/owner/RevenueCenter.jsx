import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, FaShoppingBag, FaUsers, FaReceipt, FaCalendarAlt,
  FaCalendarCheck, FaChartPie, FaHourglassHalf, FaGift, FaRupeeSign,
  FaHistory, FaArrowRight, FaFileInvoiceDollar, FaCheckCircle
} from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { serverUrl } from '../../App';

export default function RevenueCenter() {
  const socket = useSocket();

  const getLocalDateString = (d = new Date()) => {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'dining' | 'events'

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true });
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders in RevenueCenter:", error);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/reservation/get-all`, { withCredentials: true });
      setReservations(res.data);
    } catch (error) {
      console.error("Error fetching reservations in RevenueCenter:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchReservations();
  }, []);

  // Auto-rollover selectedDate when the calendar day changes at midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const todayStr = getLocalDateString();
      const oneMinAgoStr = getLocalDateString(new Date(Date.now() - 60000));
      if (selectedDate === oneMinAgoStr && oneMinAgoStr !== todayStr) {
        setSelectedDate(todayStr);
        fetchOrders();
        fetchReservations();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Sync with sockets
  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        fetchOrders();
        fetchReservations();
      };
      socket.on('dashboard-updated', handleUpdate);
      socket.on('new-order', handleUpdate);
      socket.on('order-updated', handleUpdate);
      socket.on('new-reservation', handleUpdate);
      socket.on('reservation-updated', handleUpdate);

      return () => {
        socket.off('dashboard-updated', handleUpdate);
        socket.off('new-order', handleUpdate);
        socket.off('order-updated', handleUpdate);
        socket.off('new-reservation', handleUpdate);
        socket.off('reservation-updated', handleUpdate);
      };
    }
  }, [socket]);

  // Filter orders by selectedDate
  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    const orderDate = getLocalDateString(order.createdAt);
    return orderDate === selectedDate;
  });

  // Calculate stats based on filteredOrders
  const completedOrders = filteredOrders.filter(order => {
    if (!order) return false;
    const status = Array.isArray(order.shopOrders) ? order.shopOrders[0]?.status : order.shopOrders?.status;
    return status === 'completed' || status === 'delivered' || status === 'ready to pickup' || status === 'ready';
  });

  const diningRevenue = completedOrders.reduce((sum, order) => {
    const so = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
    return sum + (so?.subtotal || order.totalAmount || 0);
  }, 0);

  const totalOrdersCount = filteredOrders.length;
  const customersServedVal = completedOrders.reduce((sum, order) => sum + (order.partySize || 1), 0);
  const avgBillVal = completedOrders.length > 0 ? Math.round(diningRevenue / completedOrders.length) : 0;

  // Filter reservations (events) by selectedDate
  const filteredReservations = reservations.filter(r => {
    if (!r) return false;
    const resDate = getLocalDateString(r.eventDate);
    return resDate === selectedDate;
  });

  const completedReservations = filteredReservations.filter(r => r.status === 'Completed' || r.status === 'Confirmed' || r.status === 'Decorating' || r.status === 'Decorated & Ready');

  const realizedEventRevenue = filteredReservations
    .filter(r => r.paymentStatus === 'Paid')
    .reduce((sum, r) => sum + (r.paidAmount || r.bill || 0), 0);

  const pendingEventRevenue = filteredReservations
    .filter(r => r.paymentStatus !== 'Paid' && r.status !== 'Cancelled')
    .reduce((sum, r) => sum + (r.bill || 0), 0);

  const totalEventRevenue = realizedEventRevenue;
  const eventBookingsCount = filteredReservations.length;
  const avgEventBill = completedReservations.length > 0 
    ? Math.round(completedReservations.reduce((sum, r) => sum + (r.bill || 0), 0) / completedReservations.length) 
    : 0;

  // Combined stats
  const totalCombinedRevenue = diningRevenue + realizedEventRevenue;
  const totalCombinedPending = pendingEventRevenue;

  const isToday = selectedDate === getLocalDateString();

  // Overview stats
  const overviewStats = [
    { label: "Combined Revenue", value: `₹${totalCombinedRevenue.toLocaleString('en-IN')}`, icon: <FaMoneyBillWave className="text-emerald-500" />, bg: "bg-emerald-50", desc: "Dining + paid events today" },
    { label: "Dining Revenue", value: `₹${diningRevenue.toLocaleString('en-IN')}`, icon: <FaShoppingBag className="text-blue-500" />, bg: "bg-blue-50", desc: `${completedOrders.length} completed orders` },
    { label: "Event Revenue (Paid)", value: `₹${realizedEventRevenue.toLocaleString('en-IN')}`, icon: <FaCalendarCheck className="text-purple-500" />, bg: "bg-purple-50", desc: `${completedReservations.length} active events` },
    { label: "Pending Event Rev", value: `₹${pendingEventRevenue.toLocaleString('en-IN')}`, icon: <FaHourglassHalf className="text-amber-500" />, bg: "bg-amber-50", desc: "Booked, unpaid events" },
  ];

  // Dining specific stats
  const diningStats = [
    { label: isToday ? "Today's Dining Rev" : "Selected Day Dining Rev", value: `₹${diningRevenue.toLocaleString('en-IN')}`, icon: <FaMoneyBillWave className="text-[#22C55E]" />, bg: "bg-green-50" },
    { label: "Total Orders", value: totalOrdersCount.toString(), icon: <FaShoppingBag className="text-blue-500" />, bg: "bg-blue-50" },
    { label: "Customers Served", value: customersServedVal.toString(), icon: <FaUsers className="text-purple-500" />, bg: "bg-purple-50" },
    { label: "Average Bill", value: `₹${avgBillVal.toLocaleString('en-IN')}`, icon: <FaReceipt className="text-orange-500" />, bg: "bg-orange-50" },
  ];

  // Event specific stats
  const eventStats = [
    { label: "Event Revenue (Paid)", value: `₹${realizedEventRevenue.toLocaleString('en-IN')}`, icon: <FaMoneyBillWave className="text-purple-600" />, bg: "bg-purple-50" },
    { label: "Pending Invoices", value: `₹${pendingEventRevenue.toLocaleString('en-IN')}`, icon: <FaHourglassHalf className="text-orange-500" />, bg: "bg-orange-50" },
    { label: "Event Bookings", value: eventBookingsCount.toString(), icon: <FaCalendarCheck className="text-blue-500" />, bg: "bg-blue-50" },
    { label: "Average Event Bill", value: `₹${avgEventBill.toLocaleString('en-IN')}`, icon: <FaReceipt className="text-pink-500" />, bg: "bg-pink-50" },
  ];

  // Event packages breakdown
  const packageShare = {
    Birthday: 0,
    Anniversary: 0,
    Dining: 0,
    Custom: 0
  };

  filteredReservations.forEach(r => {
    const type = r.eventType || 'Dining';
    const amount = r.paidAmount || r.bill || 0;
    if (type.toLowerCase().includes('birthday')) {
      packageShare.Birthday += amount;
    } else if (type.toLowerCase().includes('anniversary')) {
      packageShare.Anniversary += amount;
    } else if (type.toLowerCase().includes('dining') || type.toLowerCase().includes('walk-in')) {
      packageShare.Dining += amount;
    } else {
      packageShare.Custom += amount;
    }
  });

  const totalPackageAmount = Object.values(packageShare).reduce((sum, val) => sum + val, 0) || 1;
  const packageData = Object.keys(packageShare).map(key => ({
    name: key,
    value: packageShare[key],
    percentage: Math.round((packageShare[key] / totalPackageAmount) * 100),
    amount: `₹${packageShare[key].toLocaleString('en-IN')}`
  }));

  // Group graphData into timeslots: 10 AM, 12 PM, 2 PM, 4 PM, 7 PM, 10 PM
  const combinedTimeSlots = [
    { label: '10 AM', minH: 9, maxH: 11, dining: 0, events: 0 },
    { label: '12 PM', minH: 11, maxH: 13, dining: 0, events: 0 },
    { label: '2 PM', minH: 13, maxH: 15, dining: 0, events: 0 },
    { label: '4 PM', minH: 15, maxH: 18, dining: 0, events: 0 },
    { label: '7 PM', minH: 18, maxH: 21, dining: 0, events: 0 },
    { label: '10 PM', minH: 21, maxH: 24, dining: 0, events: 0 },
  ];

  completedOrders.forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    const so = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
    const amount = so?.subtotal || order.totalAmount || 0;
    const slot = combinedTimeSlots.find(s => hour >= s.minH && hour < s.maxH);
    if (slot) {
      slot.dining += amount;
    }
  });

  filteredReservations.forEach(r => {
    const hour = new Date(r.eventDate).getHours();
    const amount = r.paidAmount || r.bill || 0;
    const slot = combinedTimeSlots.find(s => hour >= s.minH && hour < s.maxH);
    if (slot) {
      slot.events += amount;
    }
  });

  const maxSlotCombined = Math.max(...combinedTimeSlots.map(s => s.dining + s.events)) || 1;
  const maxSlotDining = Math.max(...combinedTimeSlots.map(s => s.dining)) || 1;
  const maxSlotEvents = Math.max(...combinedTimeSlots.map(s => s.events)) || 1;

  // Format completed transactions for display
  const completedBills = completedOrders.slice(0, 5).map(order => {
    const id = order._id.substring(order._id.length - 4);
    const tableText = order.deliveryAddress?.text || 'Dine-in';
    const table = tableText.replace('Dine-in / ', '').replace('Table ', '');
    const createdDate = new Date(order.createdAt);
    const time = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const so = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
    const amount = `₹${(so?.subtotal || order.totalAmount || 0).toLocaleString('en-IN')}`;
    const status = order.payment ? 'Paid' : 'COD';

    return {
      id: `#${id}`,
      table,
      time,
      amount,
      status
    };
  });

  // Recent Event Bills/Ledger list
  const completedEventBills = filteredReservations.slice(0, 5).map(r => {
    const id = r._id.substring(r._id.length - 4);
    const createdDate = new Date(r.eventDate);
    const time = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const amount = `₹${(r.paidAmount || r.bill || 0).toLocaleString('en-IN')}`;
    const status = r.paymentStatus || 'Unpaid';
    return {
      id: `#${id}`,
      client: r.fullName,
      type: r.eventType,
      guests: r.guests,
      time,
      amount,
      status
    };
  });

  return (
    <div className='animate-fade-in text-left'>
      {/* Title Header */}
      <div className='flex justify-between items-end mb-8 flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-black text-gray-900 tracking-tight'>
            {isToday ? 'Live Financial Command' : 'Historical Financial Analytics'}
          </h1>
          <p className='text-gray-500 text-sm mt-1'>
            {isToday ? 'Real-time sales, order streams, and event invoicing' : `Financial metrics archived for ${selectedDate}`}
          </p>
        </div>
        <div className='flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100'>
          <FaCalendarAlt className='text-gray-400' />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className='outline-none bg-transparent text-sm font-bold text-gray-700 cursor-pointer'
          />
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className='flex gap-1 mb-8 border-b border-gray-200 pb-px flex-wrap'>
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 px-5 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'overview'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaChartPie /> Combined Overview
        </button>
        <button
          onClick={() => setActiveSubTab('dining')}
          className={`pb-3 px-5 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'dining'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaShoppingBag /> Dining Orders
        </button>
        <button
          onClick={() => setActiveSubTab('events')}
          className={`pb-3 px-5 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'events'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaCalendarCheck /> Event Invoicing
        </button>
      </div>

      {/* ── SUB-TAB: COMBINED OVERVIEW ────────────────────────────────────────── */}
      {activeSubTab === 'overview' && (
        <div className='space-y-8 animate-fade-in'>
          {/* Overview Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {overviewStats.map((stat, i) => (
              <div key={i} className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow'>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${stat.bg}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className='text-[10px] font-black text-gray-400 uppercase tracking-wider'>{stat.label}</p>
                  <h3 className='text-2xl font-black text-gray-800 mt-0.5'>{stat.value}</h3>
                  <p className='text-xs font-bold text-gray-400 mt-0.5'>{stat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline & Package Share side-by-side */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Timeline */}
            <div className='bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2'>
              <div className='flex justify-between items-start mb-6'>
                <h2 className='text-lg font-black text-gray-800 flex items-center gap-2'>
                  Combined Revenue Timeline
                </h2>
                <div className='flex items-center gap-4 text-xs font-bold'>
                  <span className='flex items-center gap-1.5'><span className='w-2.5 h-2.5 rounded-full bg-blue-500'></span> Dining</span>
                  <span className='flex items-center gap-1.5'><span className='w-2.5 h-2.5 rounded-full bg-purple-500'></span> Events</span>
                </div>
              </div>
              
              <div className='flex flex-col gap-6 mt-8'>
                {combinedTimeSlots.map((data, i) => {
                  const diningPct = (data.dining / maxSlotCombined) * 100;
                  const eventsPct = (data.events / maxSlotCombined) * 100;
                  const totalAmount = data.dining + data.events;
                  const isPeak = totalAmount > 0 && totalAmount === maxSlotCombined;
                  
                  return (
                    <div key={i} className='flex items-center gap-4'>
                      <div className='w-16 text-right font-bold text-gray-500 text-xs'>{data.label}</div>
                      <div className='flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden flex items-center relative group'>
                        <div 
                          className='h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out'
                          style={{ width: `${diningPct}%` }}
                        />
                        <div 
                          className='h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-1000 ease-out'
                          style={{ width: `${eventsPct}%` }}
                        />
                        
                        {isPeak && (
                          <div className='absolute right-3 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm animate-pulse'>
                            PEAK HOUR
                          </div>
                        )}
                        
                        <div className='absolute left-1/2 -translate-x-1/2 -top-10 bg-gray-900 text-white text-xs font-bold py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg'>
                          Dining: ₹{data.dining.toLocaleString('en-IN')} | Events: ₹{data.events.toLocaleString('en-IN')}
                          <div className='absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
                        </div>
                      </div>
                      <div className='w-28 font-bold text-gray-800 text-right text-sm'>₹{totalAmount.toLocaleString('en-IN')}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event Package Share */}
            <div className='bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6'>
              <div>
                <h3 className='text-lg font-black text-gray-800 flex items-center gap-2'>
                  Event Package Share
                </h3>
                <p className='text-xs font-bold text-gray-400 mt-1'>Revenue share generated by event type</p>
              </div>

              <div className='space-y-5 flex-1 flex flex-col justify-center'>
                {packageData.map((pkg, idx) => (
                  <div key={idx} className='space-y-1.5'>
                    <div className='flex justify-between items-center text-xs font-bold text-gray-600'>
                      <span className='flex items-center gap-2'>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          pkg.name === 'Birthday' ? 'bg-pink-500' :
                          pkg.name === 'Anniversary' ? 'bg-purple-500' :
                          pkg.name === 'Dining' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}></span>
                        {pkg.name} Package
                      </span>
                      <span>{pkg.amount} ({pkg.percentage}%)</span>
                    </div>
                    <div className='w-full h-2.5 bg-gray-100 rounded-full overflow-hidden'>
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          pkg.name === 'Birthday' ? 'bg-pink-500' :
                          pkg.name === 'Anniversary' ? 'bg-purple-500' :
                          pkg.name === 'Dining' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pkg.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB: DINING ANALYTICS ────────────────────────────────────────── */}
      {activeSubTab === 'dining' && (
        <div className='space-y-8 animate-fade-in'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {diningStats.map((stat, i) => (
              <div key={i} className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow'>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${stat.bg}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className='text-[10px] font-black text-gray-400 uppercase tracking-wider'>{stat.label}</p>
                  <h3 className='text-2xl font-black text-gray-800 mt-0.5'>{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className='bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100'>
            <h2 className='text-lg font-black text-gray-800 mb-6 flex items-center gap-2'>
              Dining Timeline <span className='text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-md ml-2'>Peak Hours</span>
            </h2>
            <div className='flex flex-col gap-6 mt-8'>
              {combinedTimeSlots.map((data, i) => {
                const widthPct = (data.dining / maxSlotDining) * 100;
                const isPeak = data.dining > 0 && data.dining === maxSlotDining;
                return (
                  <div key={i} className='flex items-center gap-4'>
                    <div className='w-16 text-right font-bold text-gray-500 text-xs'>{data.label}</div>
                    <div className='flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden flex items-center relative group'>
                      <div 
                        className={`h-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 ${isPeak ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-300'}`}
                        style={{ width: `${widthPct}%` }}
                      >
                        {isPeak && <span className='text-white text-[10px] font-black tracking-wider pr-1'>PEAK</span>}
                      </div>
                      
                      <div className='absolute left-1/2 -translate-x-1/2 -top-10 bg-gray-900 text-white text-xs font-bold py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg'>
                        ₹{data.dining.toLocaleString('en-IN')} Generated
                        <div className='absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
                      </div>
                    </div>
                    <div className='w-24 font-bold text-gray-800 text-right text-sm'>₹{data.dining.toLocaleString('en-IN')}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dining Bills */}
          <div className='bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100'>
            <h2 className='text-lg font-black text-gray-800 mb-6'>Recent Dining Transactions</h2>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='text-xs font-bold text-gray-400 border-b border-gray-100 tracking-wider uppercase text-left'>
                    <th className='pb-3'>Order ID</th>
                    <th className='pb-3'>Table / Details</th>
                    <th className='pb-3'>Time</th>
                    <th className='pb-3'>Amount</th>
                    <th className='pb-3 text-right'>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {completedBills.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400 font-medium italic">No dine-in receipts registered.</td>
                    </tr>
                  ) : (
                    completedBills.map((row, i) => (
                      <tr key={i} className='border-b border-gray-50 hover:bg-gray-50/50 transition-colors'>
                        <td className='py-4 font-black text-gray-800 text-sm'>{row.id}</td>
                        <td className='py-4 text-gray-600 font-bold text-sm'>Table {row.table}</td>
                        <td className='py-4 text-gray-400 font-semibold text-xs'>{row.time}</td>
                        <td className='py-4 font-extrabold text-gray-800 text-sm'>{row.amount}</td>
                        <td className='py-4 text-right'>
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${row.status === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB: EVENT ANALYTICS ────────────────────────────────────────── */}
      {activeSubTab === 'events' && (
        <div className='space-y-8 animate-fade-in'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {eventStats.map((stat, i) => (
              <div key={i} className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow'>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${stat.bg}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className='text-[10px] font-black text-gray-400 uppercase tracking-wider'>{stat.label}</p>
                  <h3 className='text-2xl font-black text-gray-800 mt-0.5'>{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>



          {/* Event Invoices Ledger */}
          <div className='bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100'>
            <h2 className='text-lg font-black text-gray-800 mb-6'>Event Ledger & Invoicing</h2>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='text-xs font-bold text-gray-400 border-b border-gray-100 tracking-wider uppercase text-left'>
                    <th className='pb-3'>Booking ID</th>
                    <th className='pb-3'>Client</th>
                    <th className='pb-3'>Event / Guests</th>
                    <th className='pb-3'>Scheduled Time</th>
                    <th className='pb-3'>Bill Amount</th>
                    <th className='pb-3 text-right'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedEventBills.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-400 font-medium italic">No events scheduled on this day.</td>
                    </tr>
                  ) : (
                    completedEventBills.map((row, i) => (
                      <tr key={i} className='border-b border-gray-50 hover:bg-gray-50/50 transition-colors'>
                        <td className='py-4 font-black text-gray-800 text-sm'>{row.id}</td>
                        <td className='py-4 text-gray-900 font-extrabold text-sm'>{row.client}</td>
                        <td className='py-4 text-gray-600 font-semibold text-xs'>
                          <span className='px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-md font-bold mr-2'>{row.type}</span>
                          <span>{row.guests} guests</span>
                        </td>
                        <td className='py-4 text-gray-400 font-semibold text-xs'>{row.time}</td>
                        <td className='py-4 font-black text-gray-800 text-sm'>{row.amount}</td>
                        <td className='py-4 text-right'>
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${row.status === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
