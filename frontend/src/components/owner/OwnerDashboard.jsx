import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserData } from '../../redux/userSlice';
import { setMyShopData } from '../../redux/ownerSlice';
import axios from 'axios';
import { serverUrl } from '../../App';
import toast from 'react-hot-toast';
import logoImg from '../../assets/FoodZone.png';
import { ClipLoader } from 'react-spinners';
import { FaMapMarkedAlt, FaChartLine, FaUtensils, FaUserTie, FaCalendarAlt, FaBars, FaStar, FaFileInvoiceDollar } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';

import DigitalTwin from './DigitalTwin';
import RevenueCenter from './RevenueCenter';
import KitchenMonitor from './KitchenMonitor';
import ReservationsOverview from './ReservationsOverview';
import StaffSettings from './StaffSettings';
import ReviewsOverview from './ReviewsOverview';
import BillsLedger from './BillsLedger';


export default function OwnerDashboard() {
  const { userData } = useSelector(state => state.user);
  const { myShopData } = useSelector(state => state.owner);
  const socket = useSocket();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showInfo, setShowInfo] = useState(false);
  const [shopLoading, setShopLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('digital-twin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Unread reservation badge counter
  const [newReservationCount, setNewReservationCount] = useState(0);
  // Unread review badge counter
  const [newReviewCount, setNewReviewCount] = useState(0);
  // Incremented on each new-reservation or reservation-updated event to signal ReservationsOverview to refetch
  const [reservationRefreshSignal, setReservationRefreshSignal] = useState(0);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/shop/get-my`, { withCredentials: true });
        dispatch(setMyShopData(res.data));
      } catch (err) {
        console.error("Error fetching shop in OwnerDashboard:", err);
      } finally {
        setShopLoading(false);
      }
    };
    fetchShop();
  }, [dispatch]);

  // Global socket listener for reservation and review events — works from any tab
  useEffect(() => {
    if (!socket) return;

    const handleNewReservation = () => {
      // Only increment badge if NOT currently on the reservations tab
      setNewReservationCount(prev => prev + 1);
      setReservationRefreshSignal(prev => prev + 1);
    };

    const handleReservationUpdated = () => {
      setReservationRefreshSignal(prev => prev + 1);
    };

    const handleNewReview = () => {
      setNewReviewCount(prev => prev + 1);
    };

    socket.on('new-reservation', handleNewReservation);
    socket.on('reservation-updated', handleReservationUpdated);
    socket.on('new-review', handleNewReview);

    return () => {
      socket.off('new-reservation', handleNewReservation);
      socket.off('reservation-updated', handleReservationUpdated);
      socket.off('new-review', handleNewReview);
    };
  }, [socket]);

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

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
    // Clear the red badge when the owner opens the Reservations tab
    if (tabId === 'reservations') {
      setNewReservationCount(0);
    }
    // Clear the red badge when the owner opens the Reviews tab
    if (tabId === 'reviews') {
      setNewReviewCount(0);
    }
  };

  const TABS = [
    { id: 'digital-twin',  label: 'Digital Twin',       icon: <FaMapMarkedAlt /> },
    { id: 'revenue',       label: 'Revenue Analytics',  icon: <FaChartLine /> },
    { id: 'kitchen',       label: 'Kitchen Monitoring', icon: <FaUtensils /> },
    { id: 'reservations',  label: 'Reservations',       icon: <FaCalendarAlt />, badge: newReservationCount },
    { id: 'reviews',       label: 'Reviews',            icon: <FaStar />, badge: newReviewCount },
    { id: 'bills',         label: 'Bills Ledger',       icon: <FaFileInvoiceDollar /> },
    { id: 'staff',         label: 'Staff',              icon: <FaUserTie /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'digital-twin':  return <DigitalTwin />;
      case 'revenue':       return <RevenueCenter />;
      case 'kitchen':       return <KitchenMonitor />;
      case 'reservations':  return <ReservationsOverview refreshSignal={reservationRefreshSignal} />;
      case 'reviews':       return <ReviewsOverview />;
      case 'bills':         return <BillsLedger />;
      case 'staff':         return <StaffSettings />;
      default:              return <DigitalTwin />;
    }
  };

  return (
    <div className='w-full min-h-screen bg-[#F8FAFC] flex flex-col font-sans'>
      {/* Top Navbar */}
      <div className='fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 flex items-center h-[70px] shadow-sm'>
        <button className='md:hidden p-4 text-gray-600' onClick={() => setSidebarOpen(!sidebarOpen)}>
          <FaBars size={24} />
        </button>
        <div className='flex items-center justify-between w-full px-6'>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logoImg} alt="Prime Dine Logo" className="w-8 h-8" />
            <span className="text-xl font-bold text-[#8b0000] font-playfair tracking-wide">Prime Dine</span>
          </div>

          <div className="relative">
            <div
              className="w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[#DC2626] text-white text-[18px] shadow-sm font-semibold cursor-pointer border-2 border-white ring-2 ring-gray-100 hover:scale-105 transition-transform"
              onClick={() => setShowInfo(!showInfo)}
            >
              {userData?.fullName?.slice(0, 1)}
            </div>
            {showInfo && (
              <div className="absolute top-[50px] right-0 w-[200px] bg-white shadow-xl rounded-xl p-[20px] flex flex-col gap-[10px] z-[9999] border border-gray-100">
                <div className="text-[17px] font-bold text-gray-800">{userData?.fullName}</div>
                <div className="text-sm font-medium text-gray-500 mb-2 capitalize">{userData?.role}</div>
                <div className="h-px w-full bg-gray-100 my-1"></div>
                <div className="text-[#DC2626] font-semibold cursor-pointer hover:text-[#b91c1c] transition-colors" onClick={handleLogOut}>Log Out</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='flex flex-1 pt-[70px]'>
        {shopLoading ? (
          <main className='flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#F8FAFC] gap-4'>
            <ClipLoader size={40} color='#DC2626' />
            <p className='text-gray-500 font-bold text-sm tracking-wider uppercase animate-pulse'>Loading Restaurant Data...</p>
          </main>
        ) : !myShopData ? (
          <main className='flex-1 flex items-center justify-center p-4 md:p-8 bg-[#F8FAFC]'>
            <div className='w-full max-w-xl bg-white shadow-2xl rounded-3xl p-8 md:p-12 border border-gray-100 flex flex-col items-center text-center space-y-6 hover:shadow-3xl transition-shadow duration-300'>
              <div className='bg-red-50 w-24 h-24 rounded-3xl flex items-center justify-center border border-red-100 shadow-inner mb-2'>
                <FaUtensils className='text-[#DC2626] text-5xl animate-bounce' />
              </div>
              <div className="space-y-2">
                <h2 className='text-3xl font-black text-gray-900 tracking-tight'>Command Center Setup</h2>
                <p className='text-gray-500 font-medium leading-relaxed max-w-md mx-auto text-sm md:text-base'>
                  Welcome to Prime Dine! To activate your Digital Twin table monitor, live kitchen display, reservations calendar, and staff options, please set up your restaurant first.
                </p>
              </div>
              <button
                className='w-full max-w-sm py-4 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-sm tracking-wider uppercase'
                onClick={() => navigate("/create-edit-shop")}
              >
                Register Your Restaurant
              </button>
            </div>
          </main>
        ) : (
          <>
            {/* Sidebar overlay for mobile */}
            {sidebarOpen && <div className='fixed inset-0 bg-black/50 z-40 md:hidden' onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-[70px] left-0 h-[calc(100vh-70px)] w-64 bg-white border-r border-gray-200 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 flex flex-col shadow-sm`}>
              <div className='p-6 flex-1 overflow-y-auto scrollbar-hide'>
                <div className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-4'>Command Center</div>
                <nav className='flex flex-col gap-2'>
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === tab.id ? 'bg-[#DC2626] text-white shadow-md' : 'text-[#1F2937] hover:bg-gray-50'}`}
                    >
                      <span className={activeTab === tab.id ? 'text-white' : 'text-gray-500'}>{tab.icon}</span>
                      <span className="flex-1 text-left">{tab.label}</span>
                      {/* Red badge showing unread new reservations */}
                      {tab.badge > 0 && (
                        <span className={`min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-xs font-black px-1.5 shadow-sm animate-pulse ${activeTab === tab.id ? 'bg-white text-[#DC2626]' : 'bg-[#DC2626] text-white'}`}>
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className='flex-1 overflow-y-auto p-4 md:p-8 relative'>
              <div className='max-w-7xl mx-auto'>
                {renderContent()}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
