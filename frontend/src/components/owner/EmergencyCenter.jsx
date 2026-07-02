import React from 'react';
import { FaExclamationTriangle, FaBell, FaCheckCircle, FaUserPlus, FaConciergeBell, FaFire } from 'react-icons/fa';

export default function EmergencyCenter() {
  const alerts = [
    { id: 1, table: 4, type: 'Water Refill', pending: 11, waiter: 'Rakesh', severity: 'critical' },
    { id: 2, table: 7, type: 'Spilled Drink', pending: 6, waiter: 'Suresh', severity: 'urgent' },
    { id: 3, table: 2, type: 'Menu Request', pending: 2, waiter: 'Amit', severity: 'normal' },
  ];

  const getSeverityStyle = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-50 border-red-500 text-red-900';
      case 'urgent': return 'bg-orange-50 border-orange-500 text-orange-900';
      case 'normal': return 'bg-blue-50 border-blue-500 text-blue-900';
      default: return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 'critical': return <span className='px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1 animate-pulse'><FaExclamationTriangle /> CRITICAL ALERT</span>;
      case 'urgent': return <span className='px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1'><FaBell /> URGENT</span>;
      case 'normal': return <span className='px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full'>Normal</span>;
    }
  };

  return (
    <div className='animate-fade-in'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Emergency Command Center</h1>
        <p className='text-gray-500 text-sm mt-1'>Monitor and resolve escalated customer requests instantly</p>
      </div>

      {/* Escalation Policy Guide */}
      <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between mb-8'>
        <div>
          <h3 className='text-sm font-bold text-gray-400 uppercase tracking-wide mb-2'>Restaurant Policy</h3>
          <div className='flex gap-6'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-blue-500'></div>
              <span className='text-sm font-medium text-gray-700'>Normal: 3 Mins</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-orange-500'></div>
              <span className='text-sm font-medium text-gray-700'>Urgent: 5 Mins</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full bg-red-600 animate-pulse'></div>
              <span className='text-sm font-medium text-gray-700'>Critical: 10 Mins</span>
            </div>
          </div>
        </div>
        <div className='text-right'>
          <h3 className='text-sm font-bold text-gray-400 uppercase tracking-wide mb-1'>Escalation Logic</h3>
          <p className='text-xs text-gray-500 font-medium'>Customer clicks ➔ Waiter gets notification ➔ Time passes ➔ Escalate to Owner</p>
        </div>
      </div>

      {/* Live Alerts Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {alerts.map(alert => (
          <div key={alert.id} className={`rounded-2xl shadow-md border-l-8 p-6 flex flex-col relative overflow-hidden ${getSeverityStyle(alert.severity)}`}>
            {/* Header */}
            <div className='flex justify-between items-start mb-4'>
              <div>
                <h2 className='text-2xl font-black mb-1'>Table {alert.table}</h2>
                <h3 className='text-lg font-bold opacity-90'>{alert.type}</h3>
              </div>
              {getSeverityBadge(alert.severity)}
            </div>

            {/* Details */}
            <div className='flex gap-4 mb-6 bg-white/40 p-3 rounded-xl border border-white/50'>
              <div className='flex-1'>
                <p className='text-xs font-bold uppercase opacity-60 mb-1'>Pending For</p>
                <p className='text-lg font-bold'>{alert.pending} Minutes</p>
              </div>
              <div className='w-px bg-black/10'></div>
              <div className='flex-1'>
                <p className='text-xs font-bold uppercase opacity-60 mb-1'>Assigned To</p>
                <p className='text-lg font-bold flex items-center gap-2'><FaUserPlus className='opacity-60'/> {alert.waiter}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='mt-auto grid grid-cols-2 gap-2'>
              <button className='py-2 px-3 rounded-lg text-sm font-bold bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 flex justify-center items-center gap-2 shadow-sm'>
                <FaUserPlus /> Re-Assign Waiter
              </button>
              <button className='py-2 px-3 rounded-lg text-sm font-bold bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 flex justify-center items-center gap-2 shadow-sm'>
                <FaBell /> Call Waiter
              </button>
              <button className='py-2 px-3 rounded-lg text-sm font-bold bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 flex justify-center items-center gap-2 shadow-sm'>
                <FaFire /> Notify Kitchen
              </button>
              <button className='py-2 px-3 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 flex justify-center items-center gap-2 shadow-sm'>
                <FaCheckCircle /> Resolve
              </button>
            </div>
            
            {alert.severity === 'critical' && (
              <div className='absolute -top-10 -right-10 text-red-500 opacity-5'>
                <FaExclamationTriangle size={150} />
              </div>
            )}
          </div>
        ))}
        
        {/* Placeholder if no critical alerts */}
        <div className='rounded-2xl shadow-sm border border-dashed border-gray-300 bg-gray-50/50 p-6 flex flex-col items-center justify-center text-center h-full min-h-[250px]'>
          <FaCheckCircle size={40} className='text-green-500 mb-3 opacity-50' />
          <h3 className='text-gray-600 font-bold'>All Clear</h3>
          <p className='text-gray-400 text-sm'>No other requests are currently escalated.</p>
        </div>
      </div>
    </div>
  );
}
