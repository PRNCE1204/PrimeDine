import React, { useState, useEffect, useCallback } from 'react';
import {
  FaCalendarDay, FaUserFriends, FaPhone, FaGlassCheers, FaBirthdayCake,
  FaStar, FaRegStar, FaCalendarAlt, FaMoneyBillWave, FaQuoteLeft,
  FaHistory, FaListUl, FaTimes, FaEdit, FaConciergeBell, FaPalette,
  FaRupeeSign, FaPlus, FaClock, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { serverUrl } from '../../App';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['Pending', 'Confirmed', 'Decorating', 'Decorated & Ready', 'Completed', 'Cancelled'];

const STATUS_STYLES = {
  'Pending':           { pill: 'bg-orange-100 text-orange-700 border border-orange-200',  strip: 'bg-orange-400' },
  'Confirmed':         { pill: 'bg-green-100 text-green-700 border border-green-200',     strip: 'bg-green-400' },
  'Decorating':        { pill: 'bg-yellow-100 text-yellow-700 border border-yellow-200',  strip: 'bg-yellow-400' },
  'Decorated & Ready': { pill: 'bg-indigo-100 text-indigo-700 border border-indigo-200',  strip: 'bg-indigo-500' },
  'Completed':         { pill: 'bg-gray-100 text-gray-600 border border-gray-200',        strip: 'bg-gray-300' },
  'Cancelled':         { pill: 'bg-red-100 text-red-700 border border-red-200',           strip: 'bg-red-400' },
};

const PAYMENT_STYLES = {
  'Unpaid': 'bg-red-50 text-red-600 border border-red-200',
  'Paid':   'bg-green-50 text-green-700 border border-green-200',
};

export default function ReservationsOverview({ refreshSignal }) {
  const socket = useSocket();
  const [viewMode, setViewMode] = useState('live');

  const getLocalDateString = (d = new Date()) => {
    const date  = new Date(d);
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'unpaid' | 'paid'

  // Walk-in modal
  const [walkinOpen, setWalkinOpen]         = useState(false);
  const [walkinName, setWalkinName]         = useState('');
  const [walkinPhone, setWalkinPhone]       = useState('');
  const [walkinType, setWalkinType]         = useState('Dining');
  const [walkinLocation, setWalkinLocation] = useState('Table 1');
  const [walkinGuests, setWalkinGuests]     = useState(2);
  const [walkinDate, setWalkinDate]         = useState(getLocalDateString());

  // Per-card inline update state: { [id]: { open, saving, status, paymentStatus, bill, paidAmount } }
  const [updateState, setUpdateState] = useState({});

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchReservations = useCallback(async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/reservation/get-all`, { withCredentials: true });
      setReservations(res.data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  useEffect(() => {
    if (refreshSignal > 0) fetchReservations();
  }, [refreshSignal, fetchReservations]);

  useEffect(() => {
    const t = setInterval(fetchReservations, 30000);
    return () => clearInterval(t);
  }, [fetchReservations]);

  useEffect(() => {
    const t = setInterval(() => {
      const todayStr   = getLocalDateString();
      const prevMinStr = getLocalDateString(new Date(Date.now() - 60000));
      if (selectedDate === prevMinStr && prevMinStr !== todayStr) {
        setSelectedDate(todayStr);
        fetchReservations();
      }
    }, 20000);
    return () => clearInterval(t);
  }, [selectedDate, fetchReservations]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => fetchReservations();
    const onNew = (data) => {
      toast.success(`🎉 New Booking: ${data.packageTitle || data.eventType} for ${data.fullName}!`, { duration: 5000 });
      fetchReservations();
    };
    const onResUpdated = (data) => {
      toast.success(`✅ ${data.fullName}'s reservation → ${data.status}`, { duration: 4000 });
      fetchReservations();
    };
    socket.on('dashboard-updated',   onUpdate);
    socket.on('new-reservation',     onNew);
    socket.on('reservation-updated', onResUpdated);
    return () => {
      socket.off('dashboard-updated',   onUpdate);
      socket.off('new-reservation',     onNew);
      socket.off('reservation-updated', onResUpdated);
    };
  }, [socket, fetchReservations]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const liveEvents = reservations.filter(
    r => r.status !== 'Completed' && r.status !== 'Cancelled'
  );
  const historyEvents = reservations.filter(r => {
    const isDone = r.status === 'Completed' || r.status === 'Cancelled';
    if (!isDone) return false;
    if (selectedDate && getLocalDateString(r.eventDate) !== selectedDate) return false;
    if (paymentFilter === 'unpaid') return (r.paymentStatus || 'Unpaid') === 'Unpaid';
    if (paymentFilter === 'paid')   return r.paymentStatus === 'Paid';
    return true;
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const renderStars = (rating) =>
    [...Array(5)].map((_, i) =>
      i < rating
        ? <FaStar key={i} className="text-yellow-400" />
        : <FaRegStar key={i} className="text-gray-300" />
    );

  const getEventIcon = (type) => {
    if (!type) return <FaConciergeBell className="text-blue-500" />;
    if (type.toLowerCase().includes('birthday'))    return <FaBirthdayCake className="text-pink-500" />;
    if (type.toLowerCase().includes('anniversary')) return <FaGlassCheers className="text-purple-500" />;
    return <FaConciergeBell className="text-blue-500" />;
  };

  const formatDateTime = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // ── Per-card update helpers (using functional state updates to avoid stale closures) ─────
  const initUpdate = (evt) => {
    setUpdateState(prev => ({
      ...prev,
      [evt._id]: {
        open:          true,
        saving:        false,
        status:        evt.status,
        paymentStatus: evt.paymentStatus || 'Unpaid',
        bill:          evt.bill || 0,
        paidAmount:    evt.paidAmount || 0,
      }
    }));
  };

  const closeUpdate = (id) => {
    setUpdateState(prev => ({ ...prev, [id]: { ...prev[id], open: false } }));
  };

  const setField = (id, field, value) => {
    setUpdateState(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSaveUpdate = async (evt) => {
    const upd = updateState[evt._id];
    if (!upd) return;
    setUpdateState(prev => ({ ...prev, [evt._id]: { ...upd, saving: true } }));
    try {
      await axios.post(
        `${serverUrl}/api/reservation/update-status/${evt._id}`,
        {
          status:        upd.status,
          bill:          parseFloat(upd.bill || 0),
          paymentStatus: upd.paymentStatus,
          paidAmount:    upd.paymentStatus === 'Paid' ? parseFloat(upd.paidAmount || 0) : 0,
        },
        { withCredentials: true }
      );
      toast.success(`✅ Reservation updated — Status: ${upd.status} | Payment: ${upd.paymentStatus}`);
      closeUpdate(evt._id);
      fetchReservations();
    } catch {
      toast.error('Failed to update reservation.');
      setUpdateState(prev => ({ ...prev, [evt._id]: { ...upd, saving: false } }));
    }
  };

  // ── Walk-in ────────────────────────────────────────────────────────────────
  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${serverUrl}/api/reservation/create`, {
        fullName: walkinName, phone: walkinPhone,
        eventType: walkinType, eventDate: walkinDate,
        guests: parseInt(walkinGuests),
        packageTitle: `Walk-in (${walkinLocation})`,
        requirements: `Table allocated: ${walkinLocation}`
      }, { withCredentials: true });
      toast.success('Walk-in booking created!');
      setWalkinOpen(false);
      setWalkinName(''); setWalkinPhone(''); setWalkinLocation('Table 1'); setWalkinGuests(2);
      fetchReservations();
    } catch {
      toast.error('Failed to create walk-in booking.');
    }
  };

  // ── Render card inline (NOT as nested component — avoids scroll-to-top bug) ──
  const renderCard = (evt) => {
    const styles  = STATUS_STYLES[evt.status] || STATUS_STYLES['Pending'];
    const upd     = updateState[evt._id];
    const isOpen  = upd?.open;
    const pymt    = evt.paymentStatus || 'Unpaid';

    return (
      <div key={evt._id} className="relative rounded-2xl border-2 border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden bg-white">
        {/* Status strip */}
        <div className={`h-1.5 w-full ${styles.strip}`} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-xl border border-gray-200 shadow-sm flex-shrink-0">
                {getEventIcon(evt.eventType)}
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 leading-tight">{evt.fullName}</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                  <FaClock className="text-gray-300" /> {formatDateTime(evt.eventDate)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${styles.pill}`}>
                {evt.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${PAYMENT_STYLES[pymt]}`}>
                {pymt === 'Paid' ? <FaCheckCircle /> : <FaTimesCircle />} {pymt}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Package</p>
              <p className="text-xs font-bold text-gray-800 truncate">{evt.packageTitle || evt.eventType || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Guests</p>
              <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <FaUserFriends className="text-gray-400" /> {evt.guests} people
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone</p>
              <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <FaPhone className="text-gray-400" /> {evt.phone}
              </p>
            </div>
            {evt.paymentStatus === 'Paid' && evt.paidAmount > 0 ? (
              <div className="bg-green-50 rounded-xl p-2.5 border border-green-200">
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-0.5">Paid Amount</p>
                <p className="text-xs font-black text-green-700 flex items-center gap-1">
                  <FaRupeeSign /> {evt.paidAmount}
                </p>
              </div>
            ) : evt.bill > 0 ? (
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Est. Bill</p>
                <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                  <FaRupeeSign className="text-gray-400" /> {evt.bill}
                </p>
              </div>
            ) : null}
          </div>

          {/* Requirements */}
          {evt.requirements && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 mb-3 text-xs text-gray-500 font-medium italic">
              📝 {evt.requirements}
            </div>
          )}

          {/* Inline update panel */}
          {isOpen ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 mt-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Update Reservation</p>

              {/* Event status */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Event Status</label>
                <select
                  value={upd.status}
                  onChange={e => setField(evt._id, 'status', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#DC2626] bg-white"
                >
                  {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Bill Amount */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Bill Amount (₹)</label>
                <input
                  type="number" min="0"
                  value={upd.bill}
                  onChange={e => setField(evt._id, 'bill', e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#DC2626] bg-white"
                />
              </div>

              {/* Payment status */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payment Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setField(evt._id, 'paymentStatus', 'Unpaid')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black border-2 transition-all flex items-center justify-center gap-1.5 ${upd.paymentStatus === 'Unpaid' ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                  >
                    <FaTimesCircle /> Unpaid
                  </button>
                  <button
                    type="button"
                    onClick={() => setField(evt._id, 'paymentStatus', 'Paid')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black border-2 transition-all flex items-center justify-center gap-1.5 ${upd.paymentStatus === 'Paid' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                  >
                    <FaCheckCircle /> Paid
                  </button>
                </div>
              </div>

              {/* Paid amount input — only when Paid selected */}
              {upd.paymentStatus === 'Paid' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Amount Received (₹)</label>
                  <input
                    type="number" min="0"
                    value={upd.paidAmount}
                    onChange={e => setField(evt._id, 'paidAmount', e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full border border-green-300 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-green-500 bg-white"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => closeUpdate(evt._id)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveUpdate(evt)}
                  disabled={upd.saving}
                  className="flex-1 py-2.5 bg-[#DC2626] hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  {upd.saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => initUpdate(evt)}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-1 rounded-xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-500 hover:border-[#DC2626] hover:text-[#DC2626] hover:bg-red-50/40 transition-all duration-200"
            >
              <FaEdit /> Update Status & Payment
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reservations & Events</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            {viewMode === 'live'
              ? `Manage active bookings — ${liveEvents.length} active`
              : 'Review past events, payments, and customer feedback'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('live')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'live' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FaListUl /> Live Schedule
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'history' ? 'bg-[#DC2626] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FaHistory /> Event History
            </button>
          </div>

          {/* Add walk-in */}
          <button
            onClick={() => setWalkinOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
          >
            <FaPlus /> Add Walk-in
          </button>

          {/* Date filter */}
          {viewMode === 'history' && (
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200">
              <FaCalendarAlt className="text-red-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="outline-none bg-transparent text-sm font-bold text-gray-800 cursor-pointer"
              />
              {selectedDate && (
                <button onClick={() => setSelectedDate('')} className="text-gray-400 hover:text-gray-600 ml-1">
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* LIVE view */}
      {viewMode === 'live' && (
        loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-semibold text-sm">Loading reservations…</p>
            </div>
          </div>
        ) : liveEvents.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
            <FaCalendarAlt className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg">No active reservations</p>
            <p className="text-gray-400 text-sm mt-1">New bookings will appear here in real time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in">
            {liveEvents.map(evt => renderCard(evt))}
          </div>
        )
      )}

      {/* HISTORY view */}
      {viewMode === 'history' && (
        <div className="animate-fade-in space-y-5">

          {/* Payment filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Payment:</span>
            {[
              { key: 'all',    label: 'All',    color: paymentFilter === 'all'    ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50' },
              { key: 'unpaid', label: '🔴 Unpaid', color: paymentFilter === 'unpaid' ? 'bg-red-600 text-white' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50' },
              { key: 'paid',   label: '🟢 Paid',   color: paymentFilter === 'paid'   ? 'bg-green-600 text-white' : 'bg-white border border-green-200 text-green-700 hover:bg-green-50' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setPaymentFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all shadow-sm ${f.color}`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400 font-medium">{historyEvents.length} result{historyEvents.length !== 1 ? 's' : ''}</span>
          </div>

          {historyEvents.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
              <FaHistory className="text-5xl text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-bold text-lg">No history for this filter</p>
            </div>
          ) : (
            historyEvents.map(evt => {
              const styles = STATUS_STYLES[evt.status] || STATUS_STYLES['Completed'];
              const pymt   = evt.paymentStatus || 'Unpaid';
              return (
                <div key={evt._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow">
                  {/* Event info */}
                  <div className="flex-1 lg:border-r border-gray-100 lg:pr-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xl flex-shrink-0">
                          {getEventIcon(evt.eventType)}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900">{evt.fullName}</h3>
                          <p className="text-xs text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                            <FaCalendarAlt className="text-[#DC2626]" /> {formatDateTime(evt.eventDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${styles.pill}`}>
                          {evt.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${PAYMENT_STYLES[pymt]}`}>
                          {pymt === 'Paid' ? <FaCheckCircle /> : <FaTimesCircle />} {pymt}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-700">
                        <FaUserFriends className="text-gray-400" /> {evt.guests} Guests
                      </div>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-700">
                        <FaConciergeBell className="text-gray-400" /> {evt.packageTitle || evt.eventType}
                      </div>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-700">
                        <FaPhone className="text-gray-400" /> {evt.phone}
                      </div>
                      {evt.status === 'Completed' && evt.bill > 0 && (
                        <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 flex items-center gap-2 text-xs font-black text-blue-700">
                          <FaMoneyBillWave className="text-blue-500" /> Bill: ₹{evt.bill}
                        </div>
                      )}
                      {evt.paymentStatus === 'Paid' && evt.paidAmount > 0 && (
                        <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200 flex items-center gap-2 text-xs font-black text-green-700">
                          <FaCheckCircle className="text-green-500" /> Paid: ₹{evt.paidAmount}
                        </div>
                      )}
                    </div>

                    {/* Inline update or edit button for history reservation */}
                    {updateState[evt._id]?.open ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 mt-3 max-w-md">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Update Payment & Status</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Event Status</label>
                            <select
                              value={updateState[evt._id].status}
                              onChange={e => setField(evt._id, 'status', e.target.value)}
                              className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none bg-white"
                            >
                              {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Final Bill (₹)</label>
                            <input
                              type="number" min="0"
                              value={updateState[evt._id].bill}
                              onChange={e => setField(evt._id, 'bill', e.target.value)}
                              className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payment Status</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setField(evt._id, 'paymentStatus', 'Unpaid')}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${updateState[evt._id].paymentStatus === 'Unpaid' ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-500'}`}
                            >
                              Unpaid
                            </button>
                            <button
                              type="button"
                              onClick={() => setField(evt._id, 'paymentStatus', 'Paid')}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${updateState[evt._id].paymentStatus === 'Paid' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500'}`}
                            >
                              Paid
                            </button>
                          </div>
                        </div>

                        {updateState[evt._id].paymentStatus === 'Paid' && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Amount Received (₹)</label>
                            <input
                              type="number" min="0"
                              value={updateState[evt._id].paidAmount}
                              onChange={e => setField(evt._id, 'paidAmount', e.target.value)}
                              placeholder="e.g. 5000"
                              className="w-full border border-green-300 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-green-500 bg-white"
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => closeUpdate(evt._id)}
                            className="flex-1 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveUpdate(evt)}
                            disabled={updateState[evt._id].saving}
                            className="flex-1 py-1.5 bg-[#DC2626] hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm"
                          >
                            {updateState[evt._id].saving ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => initUpdate(evt)}
                        className="mt-3 flex items-center gap-1 text-xs font-bold text-[#DC2626] hover:text-red-700 bg-red-50 hover:bg-red-100/50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors w-fit"
                      >
                        <FaEdit /> Update Payment & Status
                      </button>
                    )}
                  </div>

                  {/* Review */}
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Feedback</p>
                    <div className="flex items-center gap-1 text-lg mb-3">
                      {evt.rating
                        ? renderStars(evt.rating)
                        : <span className="text-gray-400 text-sm font-medium">No review yet</span>
                      }
                    </div>
                    {evt.review && (
                      <div className="relative bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <FaQuoteLeft className="absolute top-2 left-2 text-gray-200 text-3xl" />
                        <p className="relative z-10 text-gray-700 font-medium italic pl-8 text-sm leading-relaxed">
                          "{evt.review}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Walk-in modal */}
      {walkinOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-fade-in border border-gray-100">
            <button onClick={() => setWalkinOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <FaTimes size={20} />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <FaCalendarDay className="text-[#DC2626]" /> Add Walk-in Booking
            </h2>
            <form onSubmit={handleCreateWalkin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Customer Name</label>
                  <input type="text" value={walkinName} onChange={e => setWalkinName(e.target.value)} required placeholder="Rajesh Sharma" className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#DC2626]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                  <input type="tel" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} required placeholder="9876543210" className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#DC2626]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Event Type</label>
                  <select value={walkinType} onChange={e => setWalkinType(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#DC2626]">
                    <option>Dining</option><option>Birthday</option><option>Anniversary</option><option>Custom Vibe</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                  <input type="text" value={walkinLocation} onChange={e => setWalkinLocation(e.target.value)} required placeholder="Table 4" className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#DC2626]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Guests</label>
                  <input type="number" min="1" value={walkinGuests} onChange={e => setWalkinGuests(e.target.value)} required className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#DC2626]" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Date & Time</label>
                <input type="datetime-local" value={walkinDate} onChange={e => setWalkinDate(e.target.value)} required className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#DC2626]" />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setWalkinOpen(false)} className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#DC2626] hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-md">Confirm Walk-in</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
