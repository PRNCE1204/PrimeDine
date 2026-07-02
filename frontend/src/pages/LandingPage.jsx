import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import axios from 'axios';
import { serverUrl } from '../App';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { FaKey, FaClock, FaShoppingCart, FaConciergeBell, FaBell } from 'react-icons/fa';
import UserDashboard from '../components/user/UserDashboard';
import './LandingPage.css';

import logoImg from '../assets/FoodZone.png';
import img1 from '../assets/spicy-chicken.png';
import img2 from '../assets/smash-burger.png';
import img3 from '../assets/beef-steak.png';
import img4 from '../assets/lamb-curry.png';
import img5 from '../assets/side-dish-1.png';
import img6 from '../assets/side-dish-2.png';
import offerFirstOrder from '../assets/offer_first_order.png';
import offerMocktails from '../assets/offer_mocktails.png';
import offerFamilyCombo from '../assets/offer_family_combo.png';

const slidesData = [
  {
    discount: "30% OFF",
    title: "Spicy Chicken",
    desc: "Crispy fried chicken with our signature spicy glaze, served with fresh herbs and special house sauce.",
    main: img1, sm1: img5, sm2: img6
  },
  {
    discount: "20% OFF",
    title: "Smash Burger",
    desc: "Juicy double beef patty with melted cheddar, fresh lettuce, and our secret caramelized onion jam.",
    main: img2, sm1: img6, sm2: img1
  },
  {
    discount: "25% OFF",
    title: "Beef Steak",
    desc: "Premium cut grilled to perfection, served with roasted veggies and garlic herb butter sauce.",
    main: img3, sm1: img1, sm2: img2
  },
  {
    discount: "15% OFF",
    title: "Lamb Curry",
    desc: "Slow-cooked tender lamb in a rich aromatic curry, served with basmati rice and fresh naan bread.",
    main: img4, sm1: img2, sm2: img3
  }
];

function LandingPage() {
  const [current, setCurrent] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const total = slidesData.length;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData, cartItems } = useSelector(state => state.user);

  const socket = useSocket();
  const [tableSession, setTableSession] = useState(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceRequests, setServiceRequests] = useState([]);
  const SERVICES = [
    "Call Waiter 🤵",
    "Extra Salad 🥗",
    "Extra Lemon 🍋",
    "Spoons & Plates 🍽️",
    "Water Bottle 💧",
    "Clean Table 🧹"
  ];

  const fetchActiveServiceRequests = async (tNum) => {
    const tableNumber = tNum || tableSession?.tableNumber;
    if (!tableNumber) return;
    try {
      const res = await axios.get(`${serverUrl}/api/service/active`, { withCredentials: true });
      const filtered = res.data.filter(r => String(r.tableNumber) === String(tableNumber));
      setServiceRequests(filtered);
    } catch (err) {
      console.error("Error fetching active requests:", err);
    }
  };

  const fetchMySession = async () => {
    if (!userData || userData.role !== 'customer') return;
    try {
      const res = await axios.get(`${serverUrl}/api/order/table-session/my-session`, { withCredentials: true });
      setTableSession(res.data);
      if (res.data && res.data.pinRequestStatus === 'approved') {
        fetchActiveServiceRequests(res.data.tableNumber);
      }
    } catch (error) {
      console.error("Error fetching table session:", error);
    }
  };

  const handleRequestService = async (requestType) => {
    const tableNumber = tableSession?.tableNumber;
    if (!tableNumber) return;
    try {
      const res = await axios.post(`${serverUrl}/api/service/request`, {
        tableNumber: tableNumber.toString(),
        requestType
      }, { withCredentials: true });
      toast.success(`${requestType} requested! 🔔`);
      setServiceRequests(prev => [res.data, ...prev]);
    } catch (err) {
      toast.error("Failed to request service.");
    }
  };

  const handleReleaseTable = async () => {
    if (!tableSession) return;
    try {
      await axios.post(`${serverUrl}/api/order/table-session/release`, {
        tableNumber: tableSession.tableNumber
      }, { withCredentials: true });
      setTableSession(null);
      setServiceRequests([]);
      toast.success("Dine-in session ended. Awaiting payment clearance from owner.");
    } catch (error) {
      toast.error("Failed to release table.");
    }
  };

  useEffect(() => {
    fetchMySession();
  }, [userData]);

  useEffect(() => {
    if (!socket || !userData?._id) return;

    const handleSessionApproved = (data) => {
      if (String(data.userId) === String(userData._id)) {
        fetchMySession();
      }
    };

    const handleSessionDeactivated = (data) => {
      if (tableSession && String(tableSession.tableNumber) === String(data.tableNumber)) {
        setTableSession(null);
        setServiceRequests([]);
      }
    };

    const handleServiceCompleted = ({ requestId }) => {
      setServiceRequests(prev => prev.filter(r => r._id !== requestId));
    };

    socket.on('table-session-approved', handleSessionApproved);
    socket.on('table-session-deactivated', handleSessionDeactivated);
    socket.on('table-session-updated', fetchMySession);
    socket.on('service-request-completed', handleServiceCompleted);

    return () => {
      socket.off('table-session-approved', handleSessionApproved);
      socket.off('table-session-deactivated', handleSessionDeactivated);
      socket.off('table-session-updated', fetchMySession);
      socket.off('service-request-completed', handleServiceCompleted);
    };
  }, [socket, userData?._id, tableSession]);

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
      dispatch(setUserData(null));
      toast.success("You've been logged out. See you soon! 👋");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    if (userData && userData.role !== 'customer') {
      navigate('/dashboard');
    }
  }, [userData, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [current, total]);

  const goTo = (n) => {
    setCurrent((n + total) % total);
  };

  return (
    <div className="landing-container">
      {/* INTRO SPLASH */}
      <div className="landing-intro">
        <div className="logo-wrap">
          <img src={logoImg} alt="Food Zone Logo" className="intro-logo-img" />
          <div className="logo-text">FOOD ZONE</div>
        </div>
      </div>

      {/* Main UI */}
      <div className="landing-page-content">

        {/* Nav */}
        <nav className="landing-nav">
          <div className="landing-logo" onClick={() => navigate('/')}>
            <img src={logoImg} alt="Food Farm Logo" />
            <span>Prime Dine</span>
          </div>
          <ul className="landing-links">
            <li><a className="active">Home</a></li>
            <li><a onClick={() => navigate('/menu')}>Menu</a></li>
            <li><a onClick={() => navigate('/reservations')}>Reservations</a></li>
            <li><a onClick={() => navigate('/about')}>About Us</a></li>
          </ul>
          <div className="landing-nav-auth">
            {userData ? (
              userData.role === "customer" ? (
                <div className="flex items-center gap-4">
                  {/* Service Request Bell Icon */}
                  <div className="relative mr-2 animate-fade-in">
                    <button
                      onClick={() => {
                        setShowServiceDropdown(!showServiceDropdown);
                        if (!showServiceDropdown) {
                          fetchActiveServiceRequests();
                        }
                      }}
                      className={`relative cursor-pointer flex items-center justify-center p-2 rounded-xl transition-all ${
                        showServiceDropdown
                          ? "bg-[#ff4d2d]/25 text-[#ff4d2d]"
                          : (tableSession)?.pinRequestStatus === 'approved'
                          ? "text-white hover:text-[#ff4d2d] hover:bg-white/10"
                          : "text-gray-500 cursor-not-allowed opacity-50"
                      }`}
                      title={
                        (tableSession)?.pinRequestStatus === 'approved'
                          ? "Request Service (Waiter, Water, Bill...)"
                          : "Service requests are locked until table check-in is approved"
                      }
                      disabled={!((tableSession)?.pinRequestStatus === 'approved')}
                    >
                      <FaConciergeBell size={20} className={((tableSession)?.pinRequestStatus === 'approved') ? "animate-pulse" : ""} />
                      {serviceRequests && serviceRequests.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#ff4d2d] text-white text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-lg animate-bounce">
                          {serviceRequests.length}
                        </span>
                      )}
                    </button>

                    {showServiceDropdown && (
                      <div className="absolute top-[50px] right-0 w-[240px] bg-[#18181f] border border-gray-800 shadow-2xl rounded-2xl p-4 z-[99999] text-left animate-fade-in text-white">
                        <div className="border-b border-gray-800 pb-2 mb-3">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Request Table Service</h4>
                          <span className="text-[10px] text-green-400 font-bold">Table {tableSession?.tableNumber} Active</span>
                        </div>
                        
                        <div className="space-y-2">
                          {SERVICES.map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                handleRequestService(s.substring(0, s.length - 2).trim());
                                setShowServiceDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 bg-[#202028] hover:bg-[#ff4d2d] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-between"
                            >
                              <span>{s}</span>
                            </button>
                          ))}
                        </div>

                        {serviceRequests && serviceRequests.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-800">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Active Requests</span>
                            <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
                              {serviceRequests.map((req) => (
                                <div key={req._id} className="flex items-center justify-between bg-black/40 border border-gray-800 rounded-lg px-2.5 py-1.5 text-[10px]">
                                  <span className="font-bold text-gray-300">🔔 {req.requestType}</span>
                                  <span className="text-amber-400 font-extrabold uppercase text-[8px] animate-pulse">Pending</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cart Icon in Navbar */}
                  <div className="relative cursor-pointer mr-2 animate-fade-in" onClick={() => navigate("/cart")} style={{ color: 'white' }}>
                    <FaShoppingCart size={22} className="hover:text-[#ff4d2d] transition-colors" />
                    {cartItems && cartItems.length > 0 && (
                      <span className="absolute -top-2 -right-2.5 bg-[#ff4d2d] text-white text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm">
                        {cartItems.reduce((total, item) => total + item.quantity, 0)}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <div
                      className="w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[#ff4d2d] text-white text-[18px] shadow-xl font-semibold cursor-pointer"
                      onClick={() => setShowInfo(!showInfo)}
                    >
                      {userData?.fullName.slice(0, 1)}
                    </div>
                    {showInfo && (
                      <div className="absolute top-[50px] right-0 w-[180px] bg-white shadow-2xl rounded-xl p-[20px] flex flex-col gap-[10px] z-[9999]" style={{ textAlign: 'left' }}>
                        <div className="text-[17px] font-semibold text-gray-800">{userData.fullName}</div>
                        <div className="text-[#ff4d2d] font-semibold cursor-pointer hover:text-[#e03c20]" onClick={() => navigate('/my-orders')}>My Orders</div>
                        <div className="text-[#ff4d2d] font-semibold cursor-pointer hover:text-[#e03c20]" onClick={handleLogOut}>Log Out</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button className="btn-signin" onClick={() => navigate('/dashboard')}>Dashboard</button>
              )
            ) : (
              <>
                <button className="btn-signin" onClick={() => navigate('/signin')}>Sign In</button>
                <button className="btn-signup" onClick={() => navigate('/signup')}>Sign Up</button>
              </>
            )}
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="hero-section">
          {/* Backgrounds */}
          <div className="landing-bg">
            {slidesData.map((slide, i) => (
              <div key={i} className={`bg-slide ${current === i ? 'active' : ''}`}></div>
            ))}
            <div className="bg-overlay"></div>
          </div>


          {/* HERO CONTENT: Two Column Layout */}
          <div className="hero-content-wrapper">

            {/* TEXT COLUMN (left) */}
            <div className="landing-text-column">
              <div className="landing-headline">
                <div className="eyebrow-text">🍽 PREMIUM GOURMET EXPERIENCE</div>
                <h1>Order <span className="accent">Delicious Food</span><br />From The Comfort<br />Of Your Home!</h1>
                <p className="headline-subtext">Experience the best gourmet meals delivered straight to your door. Fast, fresh, and irresistibly tasty.</p>
                <div className="cta-group">
                  <button className="btn-main-cta" onClick={() => navigate(userData ? '/menu' : '/signin')}>ORDER NOW</button>
                  <button className="btn-secondary-cta" onClick={() => navigate('/menu')}>VIEW MENU</button>
                </div>

                {tableSession && tableSession.pinRequestStatus === 'approved' && (
                  <div className="mt-6 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-2xl max-w-sm animate-fade-in text-left">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-wider">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        Checked In: Table {tableSession.tableNumber}
                      </div>
                      <button
                        onClick={handleReleaseTable}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase transition-colors cursor-pointer"
                      >
                        Release Table
                      </button>
                    </div>
                    <div className="text-gray-300 text-xs mb-2">Your Verification PIN for ordering:</div>
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(tableSession.verificationPin);
                        toast.success("PIN copied to clipboard! 📋");
                      }}
                      className="bg-black/45 border border-white/10 rounded-xl py-3 px-4 flex items-center justify-between cursor-pointer hover:bg-black/60 transition-colors"
                      title="Click to copy PIN"
                    >
                      <div className="flex items-center gap-2">
                        <FaKey className="text-amber-400" />
                        <span className="text-2xl font-black text-white tracking-widest">{tableSession.verificationPin}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Copy</span>
                    </div>
                  </div>
                )}

                {tableSession && tableSession.pinRequestStatus === 'requested' && (
                  <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 backdrop-blur-md border border-amber-500/20 shadow-xl max-w-sm animate-pulse text-left">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                      Table {tableSession.tableNumber} Request Pending
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      Waiting for the waiter/owner to verify and approve your physical table seating. Your PIN will appear here once approved.
                    </p>
                  </div>
                )}

                {!tableSession && userData?.role === 'customer' && (
                  <div className="mt-6 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-2xl max-w-sm text-left animate-fade-in">
                    <div className="text-white font-bold text-sm mb-2">👋 Welcome, {userData.fullName.split(' ')[0]}!</div>
                    <p className="text-gray-300 text-xs mb-4">Please check in to your physical dining table to start ordering food.</p>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-table-pin-widget'));
                      }}
                      className="w-full py-3 bg-[#ff4d2d] hover:bg-[#e03c20] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer text-center"
                    >
                      Check-In to Table
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* HERO IMAGE SECTION (right) */}
            <div className="landing-anim-column">
              <div className="hero-showcase">
                {slidesData.map((slide, i) => (
                  <div key={`showcase-${i}`} className={`showcase-slide ${current === i ? 'active' : ''}`}>
                    <img src={slide.main} alt={slide.title} className="dish-main" />
                    <img src={slide.sm1} alt="Side dish 1" className="dish-sm1 floating-slow" />
                    <img src={slide.sm2} alt="Side dish 2" className="dish-sm2 floating-fast" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* DOTS */}
          <div className="landing-dots">
            {slidesData.map((_, i) => (
              <div key={`dot-${i}`} className={`landing-dot ${current === i ? 'active' : ''}`} onClick={() => goTo(i)}></div>
            ))}
          </div>
        </section>

        {/* SPECIAL OFFERS SECTION */}
        <section className="special-offers-section">
          <div className="section-header">
            <div className="hanging-sign-wrapper">
              <div className="hanging-sign">
                <div className="sign-screw"></div>
                <svg className="sign-strings" viewBox="0 0 100 80">
                  <line x1="50" y1="5" x2="15" y2="80" />
                  <line x1="50" y1="5" x2="85" y2="80" />
                </svg>
                <div className="sign-board">
                  <span className="sign-text">Special Offers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="offers-grid">
            {/* Card 1 */}
            <div className="offer-card">
              <div className="offer-image-container">
                <img src={offerFirstOrder} alt="20% OFF on First Order" className="offer-image" />
                <div className="offer-badge">🔥 HOT DEAL</div>
              </div>
              <div className="offer-content">
                <h3>20% OFF on First Order</h3>
                <p>Taste the premium difference with a massive discount on your very first gourmet meal with us.</p>
                <button className="btn-offer" onClick={() => navigate('/menu')}>Claim Offer</button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="offer-card">
              <div className="offer-image-container">
                <img src={offerMocktails} alt="Buy 2 Mocktails Get 1 Free" className="offer-image" />
                <div className="offer-badge">🍹 HAPPY HOUR</div>
              </div>
              <div className="offer-content">
                <h3>Buy 2 Mocktails Get 1 Free</h3>
                <p>Refresh yourself with our vibrant, hand-crafted tropical mocktails. Perfect for a chill evening.</p>
                <button className="btn-offer" onClick={() => navigate('/menu')}>Claim Offer</button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="offer-card">
              <div className="offer-image-container">
                <img src={offerFamilyCombo} alt="Weekend Family Combo" className="offer-image" />
                <div className="offer-badge">👨‍👩‍👧‍👦 FAMILY</div>
              </div>
              <div className="offer-content">
                <h3>Weekend Family Combo</h3>
                <p>A lavish spread of artisan pizza, crispy sides, and drinks to make your family weekend truly special.</p>
                <button className="btn-offer" onClick={() => navigate('/menu')}>Claim Offer</button>
              </div>
            </div>
          </div>
        </section>

        {userData?.role === 'customer' && (
          <UserDashboard hideNav={true} />
        )}

        {/* WHY CHOOSE US SECTION */}
        <section className="features-section">
          <div className="section-header">
            <h2>Why Choose Prime Dine</h2>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Premium Service</h3>
              <p>Hot, fresh, and perfectly packaged food delivered right to your door in record time.</p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon">👨‍🍳</div>
              <h3>Expert Chefs</h3>
              <p>Our culinary masters craft every dish with precision, passion, and years of experience.</p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon">🥗</div>
              <h3>Fresh Ingredients</h3>
              <p>We source only the finest, farm-fresh ingredients to ensure every bite is perfection.</p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Premium Quality</h3>
              <p>Uncompromising standards in taste and presentation for a true 5-star experience.</p>
            </div>
          </div>
        </section>

        {/* FOOTER SECTION */}
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src={logoImg} alt="Prime Dine Logo" />
                <span>Prime Dine</span>
              </div>
              <p>Delivering premium gourmet experiences right to your doorstep. Taste the difference.</p>
            </div>

            <div className="footer-links-group">
              <h4>Quick Links</h4>
              <ul>
                <li><a onClick={() => navigate('/')}>Home</a></li>
                <li><a onClick={() => navigate('/menu')}>Menu</a></li>
                <li><a onClick={() => navigate('/reservations')}>Reservations</a></li>
                <li><a onClick={() => navigate('/about')}>About Us</a></li>
              </ul>
            </div>

            <div className="footer-links-group">
              <h4>Legal</h4>
              <ul>
                <li><a onClick={() => navigate('/terms')}>Terms & Conditions</a></li>
                <li><a onClick={() => navigate('/privacy')}>Privacy Policy</a></li>
                <li><a onClick={() => navigate('/refunds')}>Refund Policy</a></li>
              </ul>
            </div>

            <div className="footer-newsletter">
              <h4>Subscribe to our Newsletter</h4>
              <p>Get the latest offers and gourmet updates.</p>
              <div className="newsletter-input">
                <input type="email" placeholder="Enter your email" />
                <button>Subscribe</button>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Prime Dine. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default LandingPage;
