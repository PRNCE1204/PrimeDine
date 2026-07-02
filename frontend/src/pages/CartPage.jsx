import React, { useState, useEffect } from 'react';
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaShoppingBag, FaArrowRight, FaLock, FaUtensils, FaClock } from "react-icons/fa";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CartItemCard from '../components/CartItemCard';
import axios from 'axios';
import { serverUrl } from '../App';
import { addMyOrder, clearCart } from '../redux/userSlice';
import { ClipLoader } from 'react-spinners';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

function CartPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const socket = useSocket();
    const { cartItems, totalAmount } = useSelector(state => state.user);
    const [loading, setLoading] = useState(false);
    const [tableNumber, setTableNumber] = useState("");
    const [tablePin, setTablePin] = useState("");
    const [sessionStatus, setSessionStatus] = useState("none"); // Track table seating check-in status

    useEffect(() => {
        const fetchTableSession = async () => {
            try {
                const res = await axios.get(`${serverUrl}/api/order/table-session/my-session`, { withCredentials: true });
                if (res.data) {
                    setSessionStatus(res.data.pinRequestStatus || 'none');
                    if (res.data.pinRequestStatus === 'approved') {
                        setTableNumber(res.data.tableNumber);
                        setTablePin(res.data.verificationPin);
                    }
                } else {
                    setSessionStatus('none');
                }
            } catch (error) {
                console.error("Failed to load table session on cart:", error);
                setSessionStatus('none');
            }
        };
        fetchTableSession();

        if (socket) {
            const handleSessionApproved = (data) => {
                toast.success(`Dine-in Approved! Table ${data.tableNumber} PIN is ready 🔑`);
                setSessionStatus('approved');
                setTableNumber(data.tableNumber);
                setTablePin(data.pin);
            };

            const handleSessionDeactivated = () => {
                setSessionStatus('none');
                setTableNumber('');
                setTablePin('');
            };

            socket.on('table-session-approved', handleSessionApproved);
            socket.on('table-session-deactivated', handleSessionDeactivated);
            socket.on('table-session-updated', fetchTableSession);

            return () => {
                socket.off('table-session-approved', handleSessionApproved);
                socket.off('table-session-deactivated', handleSessionDeactivated);
                socket.off('table-session-updated', fetchTableSession);
            };
        }
    }, [socket]);
    
    // Bill Calculations
    const taxes = totalAmount * 0.05; // 5% GST mock
    const deliveryFee = 0; // Flat ₹0 delivery for dine-in restaurant
    const grandTotal = totalAmount + taxes + deliveryFee;

    const handleSendToKitchen = async () => {
        if (!tableNumber.trim()) {
            toast.error("Please enter a valid Table Number.");
            return;
        }
        if (!tablePin.trim()) {
            toast.error("Please enter the 4-digit Table PIN (Ask waiter for PIN).");
            return;
        }

        try {
            setLoading(true);
            const result = await axios.post(`${serverUrl}/api/order/place-order`, {
                paymentMethod: "cod", // Defer payment until the end
                tableNumber: tableNumber.trim(),
                tablePin: tablePin.trim(),
                totalAmount: totalAmount,
                cartItems
            }, { withCredentials: true });

            dispatch(addMyOrder(result.data));
            dispatch(clearCart());
            toast.success("Order sent to kitchen! 🍳");
            navigate("/menu");
        } catch (error) {
            console.log(error);
            const errorMessage = error.response?.data?.message || "Failed to place order. Please try again.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen bg-[#F8FAFC] pb-12 font-sans'>
            
            {/* Minimalist Premium Header */}
            <header className='bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[70px] flex items-center justify-between'>
                    <button 
                        onClick={() => navigate("/")}
                        className='flex items-center gap-2 text-gray-600 hover:text-[#ff4d2d] transition-colors font-bold'
                    >
                        <IoIosArrowRoundBack size={28} /> Back to Menu
                    </button>
                    <h1 className='text-xl font-black text-gray-900 tracking-tight flex items-center gap-2'>
                        <FaShoppingBag className="text-[#ff4d2d]" /> Your Cart
                    </h1>
                    <div className='w-[100px]'></div> {/* Spacer for flex balance */}
                </div>
            </header>

            <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8'>
                {cartItems?.length === 0 ? (
                    
                    /* ── Empty State ── */
                    <div className='flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in'>
                        <div className='w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mb-6 shadow-inner'>
                            <FaUtensils className='text-5xl text-[#ff4d2d] opacity-50' />
                        </div>
                        <h2 className='text-3xl font-black text-gray-900 mb-2'>Your cart is empty</h2>
                        <p className='text-gray-500 font-medium max-w-md mb-8'>Looks like you haven't added anything to your cart yet. Explore our top-tier menu and discover your next favorite meal.</p>
                        <button 
                            onClick={() => navigate("/")}
                            className='bg-[#ff4d2d] text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-[#e03c20] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                        >
                            Browse Menu
                        </button>
                    </div>

                ) : (

                    /* ── Active Cart Layout ── */
                    <div className='flex flex-col lg:flex-row gap-8 items-start animate-fade-in'>
                        
                        {/* Left Column: Items */}
                        <div className='w-full lg:w-2/3 space-y-6'>
                            <div className='bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100'>
                                <div className='flex justify-between items-end mb-6 border-b border-gray-100 pb-4'>
                                    <div>
                                        <h2 className='text-2xl font-black text-gray-900'>Order Items</h2>
                                        <p className='text-sm font-bold text-gray-500 mt-1'>{cartItems.reduce((acc, item) => acc + item.quantity, 0)} items in your cart</p>
                                    </div>
                                </div>

                                <div className='space-y-5'>
                                    {cartItems?.map((item, index) => (
                                        <CartItemCard data={item} key={item.id} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Bill Summary */}
                        <div className='w-full lg:w-1/3 space-y-6 sticky top-[100px]'>
                            
                            {/* Bill Details Card */}
                            <div className='bg-white rounded-3xl p-6 shadow-sm border border-gray-100'>
                                <h3 className='text-lg font-black text-gray-900 mb-6'>Bill Details</h3>
                                
                                <div className='space-y-4 text-sm font-bold text-gray-600 border-b border-gray-100 pb-6 mb-6'>
                                    <div className='flex justify-between'>
                                        <span>Item Total</span>
                                        <span className='text-gray-900'>₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span>Taxes (GST 5%)</span>
                                        <span className='text-gray-900'>₹{taxes.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className='mb-6 grid grid-cols-2 gap-4 text-left'>
                                    <div>
                                        <label className='block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider'>
                                            Table Number
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Not Set"
                                            value={tableNumber ? `Table ${tableNumber}` : ""}
                                            readOnly
                                            disabled
                                            className='w-full border border-gray-200 rounded-xl px-4 py-3 outline-none font-bold text-gray-500 bg-gray-50 cursor-not-allowed text-sm'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider'>
                                            Table PIN
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Locked"
                                            value={tablePin}
                                            readOnly
                                            disabled
                                            className='w-full border border-gray-200 rounded-xl px-4 py-3 outline-none font-bold text-gray-500 bg-gray-50 cursor-not-allowed text-sm tracking-widest'
                                        />
                                    </div>

                                    {/* Table check-in pending / locked alerts */}
                                    {sessionStatus === 'none' && (
                                        <div className="col-span-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 text-xs font-bold flex flex-col gap-1.5 leading-normal">
                                            <span className="flex items-center gap-1.5"><FaLock /> Dine-In Order Locked</span>
                                            <span className="font-semibold text-gray-500">Please request a Table PIN using the floating <strong className="text-red-700">Dine-In Check-In</strong> widget at the bottom-right corner of your screen first.</span>
                                        </div>
                                    )}

                                    {sessionStatus === 'requested' && (
                                        <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs font-bold flex flex-col gap-1.5 leading-normal">
                                            <span className="flex items-center gap-1.5"><FaClock className="animate-pulse" /> Seating Verification Pending</span>
                                            <span className="font-semibold text-gray-500">Your seating request is waiting for owner approval. Once approved, your Table PIN will automatically load here.</span>
                                        </div>
                                    )}

                                    {sessionStatus === 'approved' && (
                                        <p className='col-span-2 text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1 uppercase tracking-wider'>
                                            ✔ Table Seating Verified & Active
                                        </p>
                                    )}
                                </div>

                                <div className='flex justify-between items-center mb-8 border-t border-gray-100 pt-6'>
                                    <div>
                                        <span className='block text-sm font-bold text-gray-500 uppercase tracking-wider mb-1'>To Pay Later</span>
                                        <span className='text-3xl font-black text-gray-900'>₹{grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button 
                                    className='w-full bg-[#ff4d2d] hover:bg-[#e03c20] text-white py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed'
                                    onClick={handleSendToKitchen}
                                    disabled={loading || sessionStatus !== 'approved' || !tableNumber.toString().trim() || !tablePin.toString().trim()}
                                >
                                    {loading ? (
                                        <ClipLoader size={24} color="#ffffff" />
                                    ) : (
                                        <>
                                            <span>Send to Kitchen</span>
                                            <FaUtensils />
                                        </>
                                    )}
                                </button>
                                
                                <div className='flex flex-col items-center justify-center gap-1 mt-4'>
                                    <div className='flex items-center gap-2 text-xs font-bold text-green-600 uppercase tracking-wider'>
                                        <FaLock /> Pay at the end of your meal
                                    </div>
                                    <p className='text-xs text-gray-400 font-medium text-center'>You can keep adding more items to your order!</p>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default CartPage;
