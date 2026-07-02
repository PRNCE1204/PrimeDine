import axios from 'axios';
import React from 'react'
import { MdPhone } from "react-icons/md";
import { serverUrl } from '../../App';
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../../redux/userSlice';
import { useState } from 'react';
import { useEffect } from 'react';
function OwnerOrderCard({ data }) {
    const [availableBoys,setAvailableBoys]=useState([])
const dispatch=useDispatch()
    const handleUpdateStatus=async (orderId,shopId,status) => {
        let prepTime = 15;
        if (status === 'preparing') {
            const timeInput = prompt("Enter estimated preparation time in minutes:", "15");
            if (timeInput === null) return; // cancel
            const parsedTime = parseInt(timeInput);
            if (!isNaN(parsedTime) && parsedTime > 0) {
                prepTime = parsedTime;
            }
        }
        try {
            const result=await axios.post(`${serverUrl}/api/order/update-status/${orderId}/${shopId}`,{status, estimatedPrepTime: prepTime},{withCredentials:true})
             dispatch(updateOrderStatus({orderId,shopId,status}))
             setAvailableBoys(result.data.availableBoys)
             console.log(result.data)
        } catch (error) {
            console.log(error)
        }
    }


  
    return (
        <div className='bg-white rounded-lg shadow p-4 space-y-4'>
            <div>
                <h2 className='text-lg font-semibold text-gray-800'>{data.user.fullName}</h2>
                <p className='text-sm text-gray-500'>{data.user.email}</p>
                <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'><MdPhone /><span>{data.user.mobile}</span></p>
                {data.paymentMethod=="online"?<p className='gap-2 text-sm text-gray-600'>payment: {data.payment?"true":"false"}</p>:<p className='gap-2 text-sm text-gray-600'>Payment Method: {data.paymentMethod}</p>}
                
            </div>

            <div className='flex space-x-4 overflow-x-auto pb-2 mt-4'>
                {data.shopOrders.shopOrderItems.map((item, index) => (
                    <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white"'>
                        <img src={item.item.image} alt="" className='w-full h-24 object-cover rounded' />
                        <p className='text-sm font-semibold mt-1'>{item.name}</p>
                        <p className='text-xs text-gray-500'>Qty: {item.quantity} x ₹{item.price}</p>
                    </div>
                ))}
            </div>

<div className='flex justify-between items-center mt-auto pt-3 border-t border-gray-100'>
<span className='text-sm'>status: <span className='font-semibold capitalize text-[#ff4d2d]'>{data.shopOrders.status}</span>
</span>

<select  className='rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-[#ff4d2d] text-[#ff4d2d]' onChange={(e)=>handleUpdateStatus(data._id,data.shopOrders.shop._id,e.target.value)}>
    <option value="">Change</option>
<option value="pending">Pending</option>
<option value="preparing">Preparing</option>
<option value="ready to pickup">Ready To Pickup</option>
<option value="completed">Completed</option>
</select>

</div>

<div className='text-right font-bold text-gray-800 text-sm'>
 Total: ₹{data.shopOrders.subtotal}
</div>
        </div>
    )
}

export default OwnerOrderCard
