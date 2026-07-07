import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaUser, FaClock, FaReceipt, FaUtensils, FaExclamationCircle, FaTimes, FaCube, FaFire, FaMoneyBillWave, FaHistory, FaCalendarAlt, FaBell, FaConciergeBell } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { serverUrl } from '../../App';
import toast from 'react-hot-toast';

const BASE_TABLES = [
  { id: 1, no: 1, capacity: 4, type: 'round' },
  { id: 2, no: 2, capacity: 2, type: 'square' },
  { id: 3, no: 3, capacity: 6, type: 'rectangle' },
  { id: 4, no: 4, capacity: 4, type: 'square' },
  { id: 5, no: 5, capacity: 8, type: 'rectangle' },
  { id: 6, no: 6, capacity: 2, type: 'round' },
  { id: 7, no: 7, capacity: 4, type: 'square' },
  { id: 8, no: 8, capacity: 4, type: 'square' },
  { id: 9, no: 9, capacity: 6, type: 'rectangle' },
  { id: 10, no: 10, capacity: 4, type: 'round' },
  { id: 11, no: 11, capacity: 4, type: 'square' },
  { id: 12, no: 12, capacity: 8, type: 'rectangle' },
];

const STATUS_COLORS = {
  'Free': { bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]', text: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
  'Reserved': { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-600', dot: 'bg-blue-500' },
  'Food Preparing': { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
  'Waiting for Service': { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-600', dot: 'bg-orange-500' },
  'Emergency': { bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]', text: 'text-[#EF4444]', dot: 'bg-[#EF4444] animate-pulse' },
  'Occupied': { bg: 'bg-indigo-500/10', border: 'border-indigo-500', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  'PIN Requested': { bg: 'bg-amber-500/10', border: 'border-amber-500 border-dashed animate-pulse', text: 'text-amber-600 font-bold', dot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-ping' },
  'Unpaid Bill': { bg: 'bg-red-500/10', border: 'border-red-500 border-dashed animate-pulse', text: 'text-red-600 font-extrabold', dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse' },
  'Delayed': { bg: 'bg-red-500/10', border: 'border-red-600 border-[3px] animate-pulse', text: 'text-red-600 font-black', dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-ping' },
};

export default function DigitalTwin() {
  const socket = useSocket();
  const [selectedTable, setSelectedTable] = useState(null);
  const [heatmapMode, setHeatmapMode] = useState('status');
  const [tables, setTables] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [activityFeed, setActivityFeed] = useState(() => {
    try {
      const saved = localStorage.getItem('owner_activity_feed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customPin, setCustomPin] = useState("");
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [itemsServedToday, setItemsServedToday] = useState(0);
  const [serviceRequests, setServiceRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('owner_service_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const alertedDelaysRef = useRef(new Map());

  useEffect(() => {
    localStorage.setItem('owner_activity_feed', JSON.stringify(activityFeed));
  }, [activityFeed]);

  useEffect(() => {
    localStorage.setItem('owner_service_requests', JSON.stringify(serviceRequests));
  }, [serviceRequests]);

  useEffect(() => {
    if (selectedTable) {
      const live = tables.find(t => String(t.no) === String(selectedTable.no));
      if (live) {
        if (
          live.status !== selectedTable.status ||
          live.foodStatus !== selectedTable.foodStatus ||
          live.pin !== selectedTable.pin ||
          live.pinRequestStatus !== selectedTable.pinRequestStatus ||
          JSON.stringify(live.allOrders) !== JSON.stringify(selectedTable.allOrders)
        ) {
          setSelectedTable(live);
        }
      }
    }
  }, [tables, selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      if (selectedTable.pinRequestStatus === 'requested') {
        // Suggest a random PIN
        setCustomPin(Math.floor(1000 + Math.random() * 9000).toString());
      } else {
        setCustomPin(selectedTable.pin || "");
      }
    }
  }, [selectedTable]);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/order/table-session/active`, { withCredentials: true });
      setActiveSessions(res.data);
    } catch (error) {
      console.error("Error fetching active table sessions:", error);
    }
  }, []);

  const processOrdersToTables = useCallback((orders, sessionsList) => {
    let updatedTables = BASE_TABLES.map(t => ({
      ...t,
      status: 'Free',
      seated: null,
      waitTime: 0,
      customers: 0,
      bill: 0,
      items: [],
      allOrders: [], // all orders including completed
      foodStatus: null,
      pin: null,
      pinRequestStatus: 'none'
    }));

    // Pre-populate active table session PINs
    const list = sessionsList || [];
    list.forEach(session => {
      let t = updatedTables.find(tbl => tbl.no === parseInt(session.tableNumber));
      if (t) {
        t.pinRequestStatus = session.pinRequestStatus;
        t.status = session.pinRequestStatus === 'unpaid' ? 'Unpaid Bill' : session.pinRequestStatus === 'requested' ? 'PIN Requested' : 'Occupied';
        t.pin = session.verificationPin;
        t.customers = session.partySize || 1;
        t.seated = new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }
    });

    // Process ALL orders (active + completed) per table
    orders.forEach(order => {
      // Find shop order corresponding to current order
      const so = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
      if (so) {
        const orderDate = new Date(order.createdAt);
        const isCompleted = so.status === 'completed' || so.status === 'delivered';
        const tableNumberStr = order.deliveryAddress?.text?.replace('Dine-in / ', '')?.replace('Table ', '')?.trim();
        const tableNo = parseInt(tableNumberStr);
        let t = updatedTables.find(tbl => tbl.no === tableNo);
        if (t) {
          t.bill += so.subtotal || order.totalAmount || 0;

          // Clean up alerted delay status if completed or ready
          if (isCompleted || so.status === 'ready') {
            alertedDelaysRef.current.delete(order._id);
          }

          // Store full order info for the detail panel
          t.allOrders.push({
            _id: order._id,
            shortId: order._id.toString().slice(-4).toUpperCase(),
            status: so.status,
            items: (so.shopOrderItems || []).map(i => i.name || (i.item && i.item.name) || 'Unknown Item'),
            total: so.subtotal || order.totalAmount || 0,
            createdAt: orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            createdAtDate: orderDate,
            preparingAt: so.preparingAt,
            estimatedPrepTime: so.estimatedPrepTime,
            isCompleted
          });

          // Only active orders update table status
          if (!isCompleted) {
            const waitTime = Math.floor((new Date().getTime() - orderDate.getTime()) / 60000);
            const isOrderDelayed = so.status === 'preparing' && so.preparingAt && so.estimatedPrepTime && 
              (new Date().getTime() - (new Date(so.preparingAt).getTime() + so.estimatedPrepTime * 60000) > 0);

            if (isOrderDelayed) {
              t.status = 'Delayed';
              t.foodStatus = 'Delayed';

              // Calculate delay minutes
              const deadline = new Date(so.preparingAt).getTime() + so.estimatedPrepTime * 60000;
              const delayMins = Math.max(0, Math.floor((new Date().getTime() - deadline) / 60000));
              const orderId = order._id;
              const shortId = orderId.toString().slice(-4).toUpperCase();
              const tableNo = t.no;

              const lastAlerted = alertedDelaysRef.current.get(orderId);
              const isInitial = lastAlerted === undefined;
              const isMinuteInterval = delayMins > 0 && lastAlerted !== delayMins;

              if (isInitial || isMinuteInterval) {
                const messageText = isInitial
                  ? `⚠️ Table ${tableNo} order delay: waiting time is over!`
                  : `⏰ Order #${shortId} for Table ${tableNo} is delayed by ${delayMins} min`;

                // Add to activity feed
                setActivityFeed(prev => {
                  if (prev.length > 0 && prev[0].message === messageText) {
                    return prev;
                  }
                  return [{
                    id: Date.now() + Math.random(),
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    type: 'alert',
                    message: messageText
                  }, ...prev].slice(0, 15);
                });

                toast.error(messageText, { duration: 8500 });
                alertedDelaysRef.current.set(orderId, isInitial ? 0 : delayMins);
              }
            } else {
              t.status = so.status === 'pending' ? 'Waiting for Service' : so.status === 'preparing' ? 'Food Preparing' : so.status === 'ready' ? 'Occupied' : 'Occupied';
              t.foodStatus = so.status === 'preparing' ? 'Preparing' : so.status === 'ready' ? 'Ready' : 'Pending';
            }
            t.waitTime = Math.max(t.waitTime, waitTime);
            if (!t.seated) {
              t.seated = orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
            // Populate items only from active orders for backward compat
            if (so.shopOrderItems) {
              so.shopOrderItems.forEach(item => {
                t.items.push(item.name || (item.item && item.item.name) || 'Unknown Item');
              });
            }
          }
        }
      }
    });

    setTables(updatedTables);
  }, [alertedDelaysRef]);

  const fetchOrders = useCallback(async () => {
    try {
      // Use the dedicated endpoint that ONLY returns non-cleared dine-in orders.
      // This prevents old session orders from polluting the live floor plan.
      const ordersRes = await axios.get(`${serverUrl}/api/order/active-table-orders`, { withCredentials: true });
      const sessionsRes = await axios.get(`${serverUrl}/api/order/table-session/active`, { withCredentials: true });
      setActiveSessions(sessionsRes.data);
      processOrdersToTables(ordersRes.data, sessionsRes.data);

      const getLocalDateString = (d = new Date()) => {
        const date = new Date(d);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Compute today's total revenue from ALL orders (not just active tables)
      const allOrdersRes = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true });
      const todayStr = getLocalDateString();
      const todayTotal = allOrdersRes.data.reduce((sum, order) => {
        if (getLocalDateString(order.createdAt) === todayStr) {
          const so = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
          return sum + (so?.subtotal || order.totalAmount || 0);
        }
        return sum;
      }, 0);
      setTodayRevenue(todayTotal);

      // Count total items served today (from completed or ready orders)
      const itemCount = allOrdersRes.data.reduce((sum, order) => {
        if (getLocalDateString(order.createdAt) !== todayStr) return sum;
        const so = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
        if (!so) return sum;
        const qty = (so.shopOrderItems || []).reduce((s, i) => s + (i.quantity || 1), 0);
        return sum + qty;
      }, 0);
      setItemsServedToday(itemCount);

      // Fetch active service requests
      const serviceRes = await axios.get(`${serverUrl}/api/service/active`, { withCredentials: true });
      setServiceRequests(serviceRes.data);
    } catch (error) {
      console.error("Error fetching orders for digital twin:", error);
    }
  }, [processOrdersToTables]);

  const handleClearStaleOrders = async () => {
    try {
      const res = await axios.post(`${serverUrl}/api/order/clear-stale-table-orders`, {}, { withCredentials: true });
      toast.success(res.data.message || 'Stale orders cleared!');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear stale orders.');
    }
  };


  const handleActivateTable = async (tableNo) => {
    try {
      await axios.post(`${serverUrl}/api/order/table-session/activate`, { tableNumber: tableNo.toString() }, { withCredentials: true });
      toast.success(`Table ${tableNo} session activated! PIN generated. 🔑`);
      fetchOrders();
      setSelectedTable(null);
    } catch (error) {
      toast.error("Failed to activate table session.");
    }
  };

  const handleDeactivateTable = async (tableNo) => {
    try {
      await axios.post(`${serverUrl}/api/order/table-session/deactivate`, { tableNumber: tableNo.toString() }, { withCredentials: true });
      toast.success(`Table ${tableNo} session closed. Table is now Free.`);
      fetchOrders();
      setSelectedTable(null);
    } catch (error) {
      toast.error("Failed to deactivate table session.");
    }
  };

  const handleApproveRequest = async (tableNo, pin) => {
    try {
      await axios.post(`${serverUrl}/api/order/table-session/approve`, { 
        tableNumber: tableNo.toString(), 
        customPin: pin 
      }, { withCredentials: true });
      toast.success(`Table ${tableNo} session approved with PIN: ${pin} 🔑`);
      fetchOrders();
      setSelectedTable(null);
    } catch (error) {
      toast.error("Failed to approve table session.");
    }
  };

  const handleResolveServiceRequest = async (requestId) => {
    try {
      await axios.post(`${serverUrl}/api/service/complete/${requestId}`, {}, { withCredentials: true });
      toast.success("Service request marked as completed!");
      setServiceRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (error) {
      toast.error("Failed to complete request.");
    }
  };


  useEffect(() => {
    fetchOrders();
    // Update wait times every minute
    const timer = setInterval(() => {
      fetchOrders();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  const fetchOrdersRef = useRef(fetchOrders);
  useEffect(() => {
    fetchOrdersRef.current = fetchOrders;
  }, [fetchOrders]);

  useEffect(() => {
    if (socket) {
      const handleDashboardUpdate = () => {
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleTableSessionUpdate = () => {
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleTableSessionRequested = (data) => {
        toast.success(`Dine-in Seating Requested: Table ${data.tableNumber} (Party of ${data.partySize || 1}) ⏱️`, { duration: 6000 });
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'status',
            message: `Table ${data.tableNumber} requested a PIN (Party size: ${data.partySize || 1})`
          }, ...prev].slice(0, 15);
          return updated;
        });
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleTableSessionApproved = (data) => {
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'status',
            message: `🔑 Table ${data.tableNumber} seating approved (PIN: ${data.verificationPin})`
          }, ...prev].slice(0, 15);
          return updated;
        });
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleTableSessionDeactivated = (data) => {
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'status',
            message: `🚪 Table ${data.tableNumber} checked out / released`
          }, ...prev].slice(0, 15);
          return updated;
        });
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleOrderStatusUpdated = ({ orderId, status }) => {
        const statusLabels = { preparing: 'Food Preparing 🍳', ready: 'Food Ready 🔔', completed: 'Order Served ✅' };
        const shortId = orderId ? orderId.substring(orderId.length - 4) : '—';
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'status',
            message: `Order #${shortId} status → ${statusLabels[status] || status}`
          }, ...prev].slice(0, 15);
          return updated;
        });
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleNewOrder = (data) => {
        const tableText = data.deliveryAddress?.text.replace('Dine-in / ', '').replace('Table ', '') || 'Dine-in';
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'order',
            message: `🍕 New Order #${data._id.substring(data._id.length - 4)} for Table ${tableText} (₹${data.totalAmount})`
          }, ...prev].slice(0, 15);
          return updated;
        });
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleNewReservation = (data) => {
        toast.success(`🎉 New Booking: ${data.packageTitle || data.eventType} for ${data.fullName}!`, { duration: 6000 });
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'status',
            message: `🎉 New Booking: ${data.packageTitle || data.eventType} for ${data.fullName}`
          }, ...prev].slice(0, 15);
          return updated;
        });
      };

      const handleNewReview = (data) => {
        toast.success(`⭐ New Review: ${data.rating} stars from ${data.customerName || 'Guest'}!`, { duration: 6000 });
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'alert',
            message: `⭐ Review: ${data.rating} stars from ${data.customerName || 'Guest'}`
          }, ...prev].slice(0, 15);
          return updated;
        });
      };

      const handleNewServiceRequest = (req) => {
        toast(`🔔 Table ${req.tableNumber} requested ${req.requestType}!`, { icon: '🔔', duration: 6000 });
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'service',
            message: `🔔 Table ${req.tableNumber} requested ${req.requestType}`
          }, ...prev].slice(0, 15);
          return updated;
        });
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleServiceRequestCompleted = ({ tableNumber }) => {
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'service',
            message: `✔️ Table ${tableNumber} request resolved`
          }, ...prev].slice(0, 15);
          return updated;
        });
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleOrderDelayedAlert = (data) => {
        const messageText = data.isInitial 
          ? `⚠️ Table ${data.table} order delay: waiting time is over!`
          : `⏰ Order #${data.shortId} for Table ${data.table} is delayed by ${data.delayMinutes} min`;

        if (data.orderId) {
          alertedDelaysRef.current.set(data.orderId, data.isInitial ? 0 : data.delayMinutes);
        }

        toast.error(messageText, { duration: 8500 });
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'alert',
            message: messageText
          }, ...prev].slice(0, 15);
          return updated;
        });
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      const handleTableSessionUnpaid = (data) => {
        toast.error(`💰 Table ${data.tableNumber} session has ended. Bill is Unpaid!`, { duration: 8000 });
        setActivityFeed(prev => {
          const updated = [{
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'alert',
            message: `💰 Table ${data.tableNumber} checkout: Awaiting Payment`
          }, ...prev].slice(0, 15);
          return updated;
        });
        if (fetchOrdersRef.current) fetchOrdersRef.current();
      };

      socket.on('dashboard-updated', handleDashboardUpdate);
      socket.on('table-session-updated', handleTableSessionUpdate);
      socket.on('table-session-requested', handleTableSessionRequested);
      socket.on('table-session-approved', handleTableSessionApproved);
      socket.on('table-session-deactivated', handleTableSessionDeactivated);
      socket.on('order-updated', handleOrderStatusUpdated);
      socket.on('new-order', handleNewOrder);
      socket.on('new-reservation', handleNewReservation);
      socket.on('new-review', handleNewReview);
      socket.on('new-service-request', handleNewServiceRequest);
      socket.on('service-request-completed', handleServiceRequestCompleted);
      socket.on('order-delayed-alert', handleOrderDelayedAlert);
      socket.on('table-session-unpaid', handleTableSessionUnpaid);

      return () => {
        socket.off('dashboard-updated', handleDashboardUpdate);
        socket.off('table-session-updated', handleTableSessionUpdate);
        socket.off('table-session-requested', handleTableSessionRequested);
        socket.off('table-session-approved', handleTableSessionApproved);
        socket.off('table-session-deactivated', handleTableSessionDeactivated);
        socket.off('order-updated', handleOrderStatusUpdated);
        socket.off('new-order', handleNewOrder);
        socket.off('new-reservation', handleNewReservation);
        socket.off('new-review', handleNewReview);
        socket.off('new-service-request', handleNewServiceRequest);
        socket.off('service-request-completed', handleServiceRequestCompleted);
        socket.off('order-delayed-alert', handleOrderDelayedAlert);
        socket.off('table-session-unpaid', handleTableSessionUnpaid);
      };
    }
  }, [socket]);


  const getTableColorStyle = (table) => {
    if (heatmapMode === 'status') {
      return STATUS_COLORS[table.status] || STATUS_COLORS['Free'];
    }
    
    if (heatmapMode === 'revenue') {
      if (table.status === 'Free' || table.status === 'Reserved') return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-400', dot: 'bg-gray-300' };
      if (table.bill > 4000) return { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-700', dot: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' };
      if (table.bill > 2000) return { bg: 'bg-yellow-400/20', border: 'border-yellow-400', text: 'text-yellow-700', dot: 'bg-yellow-400' };
      return { bg: 'bg-orange-400/20', border: 'border-orange-400', text: 'text-orange-700', dot: 'bg-orange-400' };
    }

    if (heatmapMode === 'waitTime') {
      if (table.status === 'Free' || table.status === 'Reserved') return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-400', dot: 'bg-gray-300' };
      if (table.waitTime > 30) return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-700', dot: 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' };
      if (table.waitTime > 15) return { bg: 'bg-orange-400/20', border: 'border-orange-400', text: 'text-orange-700', dot: 'bg-orange-400' };
      return { bg: 'bg-green-400/20', border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-400' };
    }
  };

  const renderTableShape = (table) => {
    const color = getTableColorStyle(table);
    let shapeClass = '';
    
    if (table.type === 'round') shapeClass = 'rounded-full aspect-square w-24 h-24 sm:w-32 sm:h-32';
    else if (table.type === 'square') shapeClass = 'rounded-2xl aspect-square w-24 h-24 sm:w-32 sm:h-32';
    else if (table.type === 'rectangle') shapeClass = 'rounded-2xl w-36 h-24 sm:w-48 sm:h-32';

    const tableRequests = serviceRequests.filter(r => String(r.tableNumber) === String(table.no));
    const hasServiceRequest = tableRequests.length > 0;

    return (
      <div 
        key={table.id}
        onClick={() => setSelectedTable(table)}
        className={`relative flex flex-col items-center justify-center cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl border-[3px] ${shapeClass} ${color.bg} ${
          hasServiceRequest ? 'border-orange-500 animate-pulse' : color.border
        } backdrop-blur-md`}
      >
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${hasServiceRequest ? 'bg-orange-500 animate-ping' : color.dot}`}></div>
        
        {hasServiceRequest && (
          <div className="absolute -top-3 -left-3 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce z-10" title={`${tableRequests.length} pending service request(s)`}>
            <FaConciergeBell size={14} />
          </div>
        )}

        <span className={`text-lg sm:text-2xl font-black text-gray-800`}>{table.no}</span>
        
        {heatmapMode === 'status' && (
          <span className={`text-[10px] sm:text-xs font-bold mt-1 px-2 py-0.5 rounded-full bg-white/80 shadow-sm ${color.text} text-center leading-tight`}>
            {table.status}
          </span>
        )}
        
        {heatmapMode === 'revenue' && table.bill > 0 && (
          <span className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full bg-white/80 shadow-sm ${color.text}`}>
            ₹{table.bill}
          </span>
        )}

        {heatmapMode === 'waitTime' && table.waitTime > 0 && (
          <span className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full bg-white/80 shadow-sm ${color.text}`}>
            {table.waitTime}m wait
          </span>
        )}

        {table.status !== 'Free' && table.status !== 'Reserved' && (
          <div className='absolute bottom-2 text-[10px] sm:text-xs text-gray-700 font-bold flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full'>
            <FaUser /> {table.customers}/{table.capacity}
          </div>
        )}
      </div>
    );
  };

  const renderActivityIcon = (type) => {
    switch(type) {
      case 'alert': return <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0"><FaExclamationCircle /></div>;
      case 'order': return <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center shrink-0"><FaUtensils /></div>;
      case 'service': return <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0"><FaConciergeBell /></div>;
      case 'status': return <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0"><FaClock /></div>;
      default: return <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0"><FaBell /></div>;
    }
  };

  const totalRevenue = tables.reduce((acc, t) => acc + t.bill, 0);
  const occupiedSeats = tables.reduce((acc, t) => acc + t.customers, 0);
  const totalSeats = tables.reduce((acc, t) => acc + t.capacity, 0);
  const activeTables = tables.filter(t => t.waitTime > 0);
  const avgWaitTime = activeTables.length > 0 ? Math.floor(activeTables.reduce((acc, t) => acc + t.waitTime, 0) / activeTables.length) : 0;

  return (
    <div className='relative flex flex-col xl:flex-row gap-6 xl:h-[calc(100vh-140px)] bg-gray-50 p-2 sm:p-6 xl:overflow-hidden'>
      
      {/* Main Floor Plan Area */}
      <div className='flex-1 flex flex-col gap-4'>
        
        {/* Top Control Bar & Quick Metrics */}
        <div className='flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center'>
        </div>

        {/* Quick Stats Overlay (Glassmorphism) */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-sm'>
            <div className='text-sm text-gray-500 font-medium mb-1'>Today's Revenue</div>
            <div className='text-2xl font-black text-gray-900'>₹{todayRevenue.toLocaleString()}</div>
            <div className='text-xs text-green-600 font-bold mt-1'>Updated Live</div>
          </div>
          <div className='bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-sm'>
            <div className='text-sm text-gray-500 font-medium mb-1'>Floor Occupancy</div>
            <div className='text-2xl font-black text-gray-900'>{Math.round((occupiedSeats/totalSeats)*100) || 0}%</div>
            <div className='text-xs text-gray-500 font-bold mt-1'>{occupiedSeats}/{totalSeats} seats filled</div>
          </div>
          <div className='bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-sm'>
            <div className='text-sm text-gray-500 font-medium mb-1'>Items Served Today</div>
            <div className='text-2xl font-black text-indigo-600'>{itemsServedToday}</div>
            <div className='text-xs text-gray-500 font-bold mt-1'>Across all orders</div>
          </div>
          <div className='bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-100 shadow-sm'>
            <div className='text-sm text-gray-500 font-medium mb-1 flex items-center gap-1'>
              <FaFire className={serviceRequests.length > 0 ? 'text-red-500 animate-pulse' : 'text-gray-400'} /> Active Emergencies
            </div>
            <div className={`text-2xl font-black ${serviceRequests.length > 0 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>{serviceRequests.length}</div>
            <div className={`text-xs font-bold mt-1 ${serviceRequests.length > 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {serviceRequests.length > 0 ? `${serviceRequests.length} pending service call(s)` : 'All tables satisfied'}
            </div>
          </div>
        </div>

        {/* Floor Plan Grid */}
        <div className={`flex-1 bg-white p-8 rounded-3xl shadow-inner border-2 border-gray-100 xl:h-full relative xl:overflow-y-auto custom-scrollbar transition-all duration-1000`}>
          
          <div 
            className={`relative z-10 flex flex-wrap gap-10 justify-center items-center w-full max-w-4xl min-h-full m-auto transition-all duration-1000 ease-in-out`}
          >
            {tables.map(renderTableShape)}
          </div>
        </div>
      </div>

      {/* Sidebar: Service Requests & Live Activity */}
      <div className='w-full xl:w-80 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0 h-[600px] xl:h-full text-left'>
        
        {/* Top Section: Service Requests */}
        <div className="flex-1 flex flex-col h-1/2 overflow-hidden border-b border-gray-100">
          <div className='p-4 border-b border-gray-150 bg-orange-50/50 flex justify-between items-center shrink-0'>
            <h2 className='text-sm font-black text-gray-900 flex items-center gap-2'>
              <FaConciergeBell className="text-orange-500 animate-bounce" /> Service Requests
            </h2>
            <span className='bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold'>
              {serviceRequests.length}
            </span>
          </div>
          
          <div className='p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar'>
            {serviceRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <FaConciergeBell size={24} className="opacity-20 mb-2" />
                <p className="text-[11px] font-bold">All clear!</p>
                <p className="text-[9px] mt-0.5 text-gray-400/80">No customer requests.</p>
              </div>
            ) : (
              serviceRequests.map((req) => {
                const elapsed = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 60000);
                return (
                  <div key={req._id} className="bg-orange-50/30 p-3 rounded-xl border border-orange-100 shadow-sm flex flex-col gap-2 relative transition-all hover:bg-orange-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-gray-950 text-xs">Table {req.tableNumber}</h4>
                        <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1 mt-0.5">
                          <FaClock size={8} /> {elapsed > 0 ? `${elapsed}m ago` : 'just now'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-black uppercase">
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

        {/* Bottom Section: Live Activity Log */}
        <div className="flex-1 flex flex-col h-1/2 overflow-hidden bg-gray-50/20">
          <div className='p-4 border-b border-gray-150 bg-gray-50 flex justify-between items-center shrink-0'>
            <h2 className='text-sm font-black text-gray-900 flex items-center gap-2'>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Live Updates
            </h2>
          </div>
          <div className='p-4 flex-1 overflow-y-auto space-y-2.5 custom-scrollbar'>
            {activityFeed.length === 0 && <p className="text-gray-400 text-center mt-4 text-xs font-medium italic">Listening for live updates...</p>}
            {activityFeed.map(feed => (
              <div key={feed.id} className='p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-start gap-3 bg-white border border-gray-100 shadow-sm cursor-pointer group'>
                {renderActivityIcon(feed.type)}
                <div>
                  <p className='text-xs text-gray-800 font-medium group-hover:text-indigo-600 transition-colors line-clamp-2'>{feed.message}</p>
                  <span className='text-[10px] text-gray-400 font-bold mt-1 block'>{feed.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Slide-out Panel for Table Details */}
      {selectedTable && (
        <>
          <div className='fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]' onClick={() => setSelectedTable(null)}></div>
          <div className='fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col border-l border-gray-200'>
            
            {/* Panel Header */}
            <div className='p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md sticky top-0 z-10'>
              <div className='flex items-center gap-4'>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 shadow-sm ${STATUS_COLORS[selectedTable.status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[selectedTable.status]?.border || 'border-gray-200'}`}>
                  <span className='text-2xl font-black text-gray-800'>{selectedTable.no}</span>
                </div>
                <div>
                  <h2 className='text-2xl font-black text-gray-900'>Table {selectedTable.no}</h2>
                  <span className={`text-sm font-bold uppercase tracking-wider ${STATUS_COLORS[selectedTable.status]?.text || 'text-gray-500'}`}>
                    {selectedTable.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedTable(null)} className='p-3 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-colors'>
                <FaTimes size={20} />
              </button>
            </div>

            {/* Panel Body */}
            <div className='flex-1 overflow-y-auto p-6 bg-white'>
              {selectedTable.status === 'Free' ? (
                <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                  <div className='w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4'>
                    <FaUtensils size={40} className='text-gray-300' />
                  </div>
                  <p className='text-lg font-bold text-gray-500'>Table is currently empty</p>
                  <p className='text-sm mt-2'>Capacity: {selectedTable.capacity} persons</p>
                </div>
              ) : selectedTable.status === 'Reserved' ? (
                <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                  <div className='w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4'>
                    <FaCalendarAlt size={40} className='text-blue-300' />
                  </div>
                  <p className='text-xl font-bold text-gray-800'>Reserved</p>
                  <p className='text-md mt-1 text-gray-500'>Party of {selectedTable.capacity}</p>
                </div>
              ) : (
                <div className='space-y-6'>
                  
                  {/* Pending PIN Request Banner */}
                  {selectedTable.pinRequestStatus === 'requested' && (
                    <div className='bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm'>
                      <p className='font-bold flex items-center gap-1.5 mb-1'>
                        <FaClock /> PIN Request Pending
                      </p>
                      <p className='text-xs leading-relaxed'>
                        A customer with <strong className="text-amber-950 font-extrabold">{selectedTable.customers || 1} {selectedTable.customers === 1 ? 'person' : 'people'}</strong> is requesting to seat at **Table {selectedTable.no}**. Please verify they are physically seated at this table, assign a PIN, and click Approve.
                      </p>
                    </div>
                  )}

                  {/* Table Service Requests */}
                  {serviceRequests.some(r => String(r.tableNumber) === String(selectedTable.no)) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                      <h4 className="text-sm font-black text-orange-800 flex items-center gap-2">
                        <FaConciergeBell className="animate-bounce" /> Pending Service Calls
                      </h4>
                      <div className="space-y-2">
                        {serviceRequests
                          .filter(r => String(r.tableNumber) === String(selectedTable.no))
                          .map(req => (
                            <div key={req._id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-orange-100 shadow-sm text-left">
                              <span className="text-xs font-bold text-gray-700">{req.requestType}</span>
                              <button
                                onClick={() => handleResolveServiceRequest(req._id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black rounded-lg transition-colors uppercase tracking-wider"
                              >
                                Done
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Stats Grid */}
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors'>
                      <div className='flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2'>
                        <FaUser className="text-indigo-400" /> Guests
                      </div>
                      <div className='text-xl font-black text-gray-800'>{selectedTable.customers} <span className='text-sm text-gray-400 font-medium'>/ {selectedTable.capacity}</span></div>
                    </div>
                    <div className='bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors'>
                      <div className='flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2'>
                        <FaClock className="text-blue-400" /> Time Seated
                      </div>
                      <div className='text-xl font-black text-gray-800'>{selectedTable.seated || '—'}</div>
                    </div>
                    <div className='bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors'>
                      <div className='flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2'>
                        <FaReceipt className="text-green-400" /> Total Bill
                      </div>
                      <div className='text-xl font-black text-[#DC2626]'>₹{(selectedTable.bill || 0).toLocaleString()}</div>
                    </div>
                    <div className='bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors'>
                      <div className='flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2'>
                        <FaFire className="text-orange-400" /> Kitchen
                      </div>
                      <div className={`text-sm font-black ${ selectedTable.foodStatus === 'Ready' ? 'text-green-600' : selectedTable.foodStatus === 'Preparing' ? 'text-yellow-600' : 'text-gray-500' }`}>
                        {selectedTable.foodStatus || 'Idle'}
                      </div>
                    </div>
                  </div>

                  {/* All Orders for this Table */}
                  {selectedTable.allOrders && selectedTable.allOrders.length > 0 && (
                    <div>
                      <h3 className='text-sm font-black text-gray-800 mb-3 flex items-center gap-2'>
                        <FaReceipt className="text-gray-400" /> Orders ({selectedTable.allOrders.length})
                      </h3>
                      <div className='space-y-3'>
                        {selectedTable.allOrders.map((order, i) => {
                          const statusConfig = {
                            pending: { label: 'Waiting', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
                            preparing: { label: 'Cooking 🍳', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse' },
                            ready: { label: 'Ready 🔔', cls: 'bg-green-100 text-green-700 border-green-200' },
                            completed: { label: 'Served ✅', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
                            delivered: { label: 'Served ✅', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
                          };
                          const sc = statusConfig[order.status] || statusConfig.pending;
                          const isOrderDelayed = order.status === 'preparing' && order.preparingAt && order.estimatedPrepTime && 
                            (new Date().getTime() - (new Date(order.preparingAt).getTime() + order.estimatedPrepTime * 60000) > 0);
                          
                          const badgeLabel = isOrderDelayed ? 'Delayed ⏰' : sc.label;
                          const badgeClass = isOrderDelayed ? 'bg-red-100 text-red-750 border-red-200 animate-pulse font-black' : sc.cls;

                          return (
                            <div key={order._id || i} className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${ order.isCompleted ? 'border-gray-100 opacity-75' : 'border-gray-200' }`}>
                              <div className='px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-xs font-black text-gray-500 uppercase tracking-wider'>#{order.shortId}</span>
                                  <span className='text-[10px] text-gray-400'>{order.createdAt}</span>
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${badgeClass}`}>
                                  {badgeLabel}
                                </span>
                              </div>
                              <div className='px-4 py-3'>
                                <ul className='space-y-1.5 mb-3'>
                                  {order.items.map((item, j) => (
                                    <li key={j} className='flex items-center gap-2 text-sm text-gray-700 font-medium'>
                                      <div className='w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0'></div> {item}
                                    </li>
                                  ))}
                                </ul>
                                {order.status === 'preparing' && order.estimatedPrepTime && (
                                  <p className='text-[10px] font-bold text-yellow-600 flex items-center gap-1'>
                                    <FaClock /> Est. {order.estimatedPrepTime} min cook time
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total Bill */}
                      <div className='mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-end'>
                        <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Total Bill</span>
                        <span className='text-2xl font-black text-[#DC2626]'>₹{(selectedTable.bill || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {(!selectedTable.allOrders || selectedTable.allOrders.length === 0) && (
                    <div className='text-center py-6 text-gray-400'>
                      <FaUtensils className='mx-auto text-3xl text-gray-200 mb-2' />
                      <p className='text-sm font-medium'>No orders placed yet</p>
                    </div>
                  )}

                  {/* Session PIN Control Card */}
                  <div className='bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 space-y-4'>
                    <div className="flex justify-between items-center text-left">
                      <div>
                        <p className='text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5'>Active Table PIN</p>
                        <p className='text-2xl font-black text-indigo-700 tracking-widest'>{selectedTable.pin || 'NOT GENERATED'}</p>
                      </div>
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Dine-in security
                      </span>
                    </div>

                    <hr className="border-indigo-100" />

                    {/* Change or Assign PIN input */}
                    <div className="text-left">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        {selectedTable.pinRequestStatus === 'requested' ? 'Assign Table PIN' : 'Change / Override PIN'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength="4"
                          placeholder="e.g. 1234"
                          value={customPin}
                          onChange={(e) => setCustomPin(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-black tracking-widest text-[#ff4d2d] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                        />
                        {selectedTable.pinRequestStatus !== 'requested' && (
                          <button
                            onClick={() => handleApproveRequest(selectedTable.no, customPin)}
                            disabled={!customPin.trim() || customPin === selectedTable.pin}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
            
            {/* Action Buttons Footer */}
            <div className='p-6 border-t border-gray-200 bg-white sticky bottom-0 z-10'>
              <div className='w-full'>
                {selectedTable.status === 'Free' && (
                  <button 
                    onClick={() => handleActivateTable(selectedTable.no)}
                    className='w-full py-4 rounded-xl font-black text-sm bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all uppercase tracking-wider'
                  >
                    Activate Table & Generate PIN
                  </button>
                )}

                {selectedTable.pinRequestStatus === 'requested' && (
                  <div className='grid grid-cols-2 gap-3'>
                    <button 
                      onClick={() => handleApproveRequest(selectedTable.no, customPin)}
                      className='col-span-2 py-4 rounded-xl font-black text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all uppercase tracking-wider'
                    >
                      Approve Seating & Send PIN
                    </button>
                    <button 
                      onClick={() => handleDeactivateTable(selectedTable.no)}
                      className='col-span-2 py-2.5 rounded-xl font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors text-xs'
                    >
                      Reject PIN Request
                    </button>
                  </div>
                )}

                {selectedTable.status === 'Emergency' && (
                  <div className='grid grid-cols-2 gap-3'>
                    <button className='col-span-2 py-4 rounded-xl font-black text-lg bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1'>Resolve Emergency</button>
                  </div>
                )}

                {selectedTable.status !== 'Free' && selectedTable.pinRequestStatus !== 'requested' && selectedTable.status !== 'Reserved' && selectedTable.status !== 'Emergency' && (
                  <div className='grid grid-cols-2 gap-3 w-full'>
                    {selectedTable.pinRequestStatus === 'unpaid' ? (
                      <button 
                        onClick={() => handleDeactivateTable(selectedTable.no)}
                        className='col-span-2 py-4 rounded-xl font-black text-sm bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all uppercase tracking-wider'
                      >
                        💰 Mark Bill as Paid (Clear Table)
                      </button>
                    ) : (
                      <>
                        <button className='py-3.5 rounded-xl font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all'>Process Payment</button>
                        <button 
                          onClick={() => handleDeactivateTable(selectedTable.no)}
                          className='py-3.5 rounded-xl font-bold bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all animate-pulse'
                        >
                          Clear Table / Close PIN
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
