import React from 'react';
import { FaBoxOpen, FaExclamationTriangle, FaCheckCircle, FaShoppingCart } from 'react-icons/fa';

export default function InventoryMonitor() {
  const inventory = [
    { item: 'Paneer', remaining: '4 KG', threshold: '5 KG', status: 'Low Stock', severity: 'warning' },
    { item: 'Milk', remaining: '3 Liters', threshold: '10 Liters', status: 'Critical', severity: 'critical' },
    { item: 'Chicken', remaining: '12 KG', threshold: '10 KG', status: 'In Stock', severity: 'good' },
    { item: 'Tomatoes', remaining: '2 KG', threshold: '8 KG', status: 'Critical', severity: 'critical' },
    { item: 'Rice (Basmati)', remaining: '45 KG', threshold: '20 KG', status: 'In Stock', severity: 'good' },
    { item: 'Onions', remaining: '8 KG', threshold: '15 KG', status: 'Low Stock', severity: 'warning' },
  ];

  const getSeverityStyle = (severity) => {
    switch(severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'good': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = (severity) => {
    switch(severity) {
      case 'critical': return <FaExclamationTriangle className="text-red-500" />;
      case 'warning': return <FaExclamationTriangle className="text-orange-500" />;
      case 'good': return <FaCheckCircle className="text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className='animate-fade-in'>
      <div className='flex justify-between items-end mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Inventory & Stock Warning</h1>
          <p className='text-gray-500 text-sm mt-1'>Keep track of essential ingredients to avoid menu outages</p>
        </div>
        <button className='flex items-center gap-2 bg-[#1F2937] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm'>
          <FaShoppingCart /> Generate Purchase Order
        </button>
      </div>

      {/* Critical Alerts Summary */}
      <div className='bg-red-50 border border-red-200 p-6 rounded-2xl mb-8 flex items-start gap-4'>
        <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl flex-shrink-0'>
          <FaExclamationTriangle />
        </div>
        <div>
          <h2 className='text-lg font-bold text-red-800 mb-1'>Critical Shortages Detected</h2>
          <p className='text-red-700 text-sm mb-3'>You have 2 items that are critically low and may affect today's menu availability.</p>
          <div className='flex gap-2'>
            <span className='px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md'>Milk</span>
            <span className='px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md'>Tomatoes</span>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {inventory.map((item, i) => (
          <div key={i} className={`p-6 rounded-2xl border flex flex-col ${getSeverityStyle(item.severity)}`}>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-xl font-bold text-gray-900'>{item.item}</h3>
              {getStatusIcon(item.severity)}
            </div>
            
            <div className='grid grid-cols-2 gap-4 mb-6 bg-white/60 p-4 rounded-xl border border-white'>
              <div>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wider mb-1'>Remaining</p>
                <p className={`text-xl font-black ${item.severity === 'critical' ? 'text-red-600' : item.severity === 'warning' ? 'text-orange-600' : 'text-gray-800'}`}>
                  {item.remaining}
                </p>
              </div>
              <div>
                <p className='text-xs font-bold text-gray-500 uppercase tracking-wider mb-1'>Threshold</p>
                <p className='text-lg font-bold text-gray-500'>
                  {item.threshold}
                </p>
              </div>
            </div>

            <div className='mt-auto flex justify-between items-center'>
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                item.severity === 'critical' ? 'bg-red-200 text-red-800' : 
                item.severity === 'warning' ? 'bg-orange-200 text-orange-800' : 
                'bg-green-200 text-green-800'
              }`}>
                {item.status}
              </span>
              
              {item.severity !== 'good' && (
                <button className='text-sm font-bold text-blue-600 hover:text-blue-800 underline'>Order Refill</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
