import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { FaUtensils, FaCalendarAlt, FaClock, FaUserFriends, FaTimes, FaSearch, FaFilter, FaPrint, FaFileInvoiceDollar } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function BillsLedger() {
  const [activeSubTab, setActiveSubTab] = useState('dining'); // 'dining' or 'events'
  const [diningBills, setDiningBills] = useState([]);
  const [eventBills, setEventBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedDiningInvoice, setSelectedDiningInvoice] = useState(null);
  const [selectedEventInvoice, setSelectedEventInvoice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch table session bills
      const resSessions = await axios.get(`${serverUrl}/api/order/table-session/owner-history`, { withCredentials: true });
      setDiningBills(resSessions.data);

      // 2. Fetch reservations and filter those with bills set
      const resEvents = await axios.get(`${serverUrl}/api/reservation/get-all`, { withCredentials: true });
      const filteredEvents = resEvents.data.filter(r => (r.bill || 0) > 0 || r.status === 'Completed');
      setEventBills(filteredEvents);
    } catch (error) {
      console.error("Error fetching bills ledger data:", error);
      toast.error("Failed to load bills ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Filter dining bills based on search (table number, customer name, date)
  const filteredDining = diningBills.filter(bill => {
    const tableStr = `table ${bill.tableNumber}`.toLowerCase();
    const customer = (bill.user?.fullName || 'Anonymous').toLowerCase();
    const pin = (bill.verificationPin || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return tableStr.includes(term) || customer.includes(term) || pin.includes(term);
  });

  // Filter event bills based on search (client name, package title, type)
  const filteredEvents = eventBills.filter(evt => {
    const name = (evt.fullName || '').toLowerCase();
    const type = (evt.eventType || '').toLowerCase();
    const pkg = (evt.packageTitle || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || type.includes(term) || pkg.includes(term);
  });

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <div className='text-left'>
          <h1 className='text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2'>
            <FaFileInvoiceDollar className='text-[#DC2626]' /> Bills & Invoices Ledger
          </h1>
          <p className='text-xs text-gray-500 font-bold mt-1'>
            View, audit, print, and download PDF receipts for dining table sessions and event reservations.
          </p>
        </div>
        <button
          onClick={fetchData}
          className='px-4 py-2 border border-gray-250 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-xs transition-colors'
        >
          🔄 Refresh Ledger
        </button>
      </div>

      {/* Navigation Tabs and Search */}
      <div className='flex justify-between items-center flex-wrap gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm'>
        <div className='flex gap-2'>
          <button
            onClick={() => { setActiveSubTab('dining'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'dining' ? 'bg-[#DC2626] text-white shadow-sm' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
          >
            🍕 Dining Session Bills ({diningBills.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('events'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'events' ? 'bg-[#DC2626] text-white shadow-sm' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
          >
            🎉 Event Invoices ({eventBills.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className='relative w-full sm:w-64'>
          <FaSearch className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
          <input
            type='text'
            placeholder={activeSubTab === 'dining' ? 'Search Table, Client or PIN...' : 'Search Client, Type or Package...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full pl-9 pr-4 py-2 border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#DC2626] bg-gray-50'
          />
        </div>
      </div>

      {/* Main Ledger Table */}
      {loading ? (
        <div className='bg-white p-12 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3'>
          <div className='w-8 h-8 border-4 border-gray-250 border-t-[#DC2626] rounded-full animate-spin'></div>
          <span className='text-xs font-bold text-gray-400 uppercase tracking-wider animate-pulse'>Loading Transactions...</span>
        </div>
      ) : (
        <div className='bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden'>
          {activeSubTab === 'dining' ? (
            <div className='overflow-x-auto text-left'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-gray-50 text-[10px] font-black text-gray-400 border-b border-gray-150 uppercase tracking-wider'>
                    <th className='py-4 px-6'>Session ID</th>
                    <th className='py-4 px-6'>Table</th>
                    <th className='py-4 px-6'>Client</th>
                    <th className='py-4 px-6'>Session PIN</th>
                    <th className='py-4 px-6'>Checkout Time</th>
                    <th className='py-4 px-6'>Bill Amount</th>
                    <th className='py-4 px-6 text-right'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDining.length === 0 ? (
                    <tr>
                      <td colSpan='7' className='py-12 px-6 text-center text-gray-400 font-medium italic'>
                        {searchTerm ? 'No matches found for search term.' : 'No dining session history logged yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDining.map((bill) => (
                      <tr key={bill._id} className='border-b border-gray-100 hover:bg-gray-50/50 transition-colors font-bold text-sm text-gray-700'>
                        <td className='py-4 px-6 font-mono text-xs text-gray-400'>#{bill._id.slice(-6).toUpperCase()}</td>
                        <td className='py-4 px-6 text-gray-900 font-extrabold'>Table {bill.tableNumber}</td>
                        <td className='py-4 px-6 text-xs text-gray-500'>
                          {bill.user ? (
                            <div>
                              <p className='font-bold text-gray-800'>{bill.user.fullName}</p>
                              <p className='text-[10px] text-gray-400'>{bill.user.mobile || 'No phone'}</p>
                            </div>
                          ) : (
                            <span className='italic font-medium text-gray-400'>Anonymous Guest</span>
                          )}
                        </td>
                        <td className='py-4 px-6 font-mono text-xs text-gray-700 tracking-wider'>{bill.verificationPin || '—'}</td>
                        <td className='py-4 px-6 text-xs text-gray-400 font-semibold'>
                          {new Date(bill.createdAt).toLocaleDateString()} · {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className='py-4 px-6 text-gray-900 font-extrabold'>₹{(bill.billAmount || 0).toLocaleString('en-IN')}</td>
                        <td className='py-4 px-6 text-right'>
                          <button
                            onClick={() => setSelectedDiningInvoice(bill)}
                            className='px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs transition-colors cursor-pointer font-bold'
                          >
                            View & Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='overflow-x-auto text-left'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-gray-50 text-[10px] font-black text-gray-400 border-b border-gray-150 uppercase tracking-wider'>
                    <th className='py-4 px-6'>Booking ID</th>
                    <th className='py-4 px-6'>Client</th>
                    <th className='py-4 px-6'>Event / Package</th>
                    <th className='py-4 px-6'>Guests</th>
                    <th className='py-4 px-6'>Bill Amount</th>
                    <th className='py-4 px-6'>Paid Amount</th>
                    <th className='py-4 px-6'>Status</th>
                    <th className='py-4 px-6 text-right'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan='8' className='py-12 px-6 text-center text-gray-400 font-medium italic'>
                        {searchTerm ? 'No matches found for search term.' : 'No event reservation billing records.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr key={evt._id} className='border-b border-gray-100 hover:bg-gray-50/50 transition-colors font-bold text-sm text-gray-700'>
                        <td className='py-4 px-6 font-mono text-xs text-gray-400'>#{evt._id.slice(-6).toUpperCase()}</td>
                        <td className='py-4 px-6'>
                          <p className='text-gray-900 font-extrabold'>{evt.fullName}</p>
                          <p className='text-[10px] text-gray-400'>{evt.phone}</p>
                        </td>
                        <td className='py-4 px-6 text-xs'>
                          <span className='px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-md font-bold mr-1.5'>{evt.eventType}</span>
                          <span className='text-gray-500 font-semibold'>{evt.packageTitle || 'Custom'}</span>
                        </td>
                        <td className='py-4 px-6 text-xs text-gray-400 font-semibold'>{evt.guests} Guests</td>
                        <td className='py-4 px-6 text-gray-900 font-extrabold'>₹{(evt.bill || 0).toLocaleString('en-IN')}</td>
                        <td className='py-4 px-6 text-green-700 font-extrabold'>₹{(evt.paidAmount || 0).toLocaleString('en-IN')}</td>
                        <td className='py-4 px-6 text-xs'>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            (evt.paymentStatus || 'Unpaid') === 'Paid'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-650 border border-red-200'
                          }`}>
                            {evt.paymentStatus || 'Unpaid'}
                          </span>
                        </td>
                        <td className='py-4 px-6 text-right'>
                          <button
                            onClick={() => setSelectedEventInvoice(evt)}
                            className='px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs transition-colors cursor-pointer font-bold'
                          >
                            View & Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dynamic PDF Invoice Modal - Dining */}
      {selectedDiningInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">Dining Session Receipt</h3>
              <button 
                onClick={() => setSelectedDiningInvoice(null)}
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
                    <p className="text-xs text-gray-400 font-bold mt-2">PIN: {selectedDiningInvoice.verificationPin}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="grid grid-cols-2 gap-6 border-b border-gray-150 pb-6 mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invoice Details</p>
                  <p className="text-sm font-black text-gray-800">No: #SESS-{selectedDiningInvoice._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs font-bold text-gray-500">Date: {new Date(selectedDiningInvoice.createdAt).toLocaleDateString('en-IN')}</p>
                  <p className="text-xs font-bold text-gray-500">Time: {new Date(selectedDiningInvoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dine-in Info</p>
                  <p className="text-sm font-black text-gray-800">Table {selectedDiningInvoice.tableNumber}</p>
                  <p className="text-xs font-bold text-gray-500">Party Size: {selectedDiningInvoice.partySize || 1} Guests</p>
                  <p className="text-xs font-bold text-gray-500">Customer: {selectedDiningInvoice.user?.fullName || 'Walk-in Guest'}</p>
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
                      {selectedDiningInvoice.items && selectedDiningInvoice.items.length > 0 ? (
                        selectedDiningInvoice.items.map((item, idx) => (
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
              <div className="flex flex-col items-end gap-2 bg-gray-50 p-6 rounded-2xl border border-gray-100 font-bold font-sans">
                <div className="flex justify-between w-64 text-sm text-gray-500 font-medium">
                  <span>Subtotal:</span>
                  <span>₹{(selectedDiningInvoice.billAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-xs text-gray-400 font-medium">
                  <span>CGST (2.5%):</span>
                  <span>₹{Math.round((selectedDiningInvoice.billAmount || 0) * 0.025).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-64 text-xs text-gray-400 font-medium">
                  <span>SGST (2.5%):</span>
                  <span>₹{Math.round((selectedDiningInvoice.billAmount || 0) * 0.025).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-gray-200 w-64 my-1"></div>
                <div className="flex justify-between w-64 text-base text-gray-900 font-black">
                  <span>Grand Total:</span>
                  <span>₹{Math.round((selectedDiningInvoice.billAmount || 0) * 1.05).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Invoice Footer */}
              <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-150 text-center">
                <p className="text-sm font-black text-gray-700">Thank you for dining with us! ❤️</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">Prime Dine Command Center · Digital Receipt</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 no-print-element font-bold">
              <button 
                onClick={() => setSelectedDiningInvoice(null)}
                className="flex-1 py-3 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaPrint /> Download PDF / Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Event PDF Invoice Modal - Events */}
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
              <div className="flex flex-col items-end gap-2 bg-gray-50 p-6 rounded-2xl border border-gray-100 font-bold font-sans">
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
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 no-print-element font-bold">
              <button 
                onClick={() => setSelectedEventInvoice(null)}
                className="flex-1 py-3 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 py-3 bg-[#ff4d2d] hover:bg-[#e03c20] text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaPrint /> Download PDF / Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
