import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { IoIosSearch } from 'react-icons/io';
import {
  FaArrowLeft, FaLeaf, FaStar, FaShoppingCart,
  FaUtensils, FaFilter, FaTimes, FaConciergeBell, FaBell
} from 'react-icons/fa';
import { GiLotusFlower } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { addToCart, setUserData } from '../redux/userSlice';
import axios from 'axios';
import { serverUrl } from '../App';
import { useSocket } from '../context/SocketContext';
import Nav from '../components/Nav';

import logoImg from '../assets/FoodZone.png';
import placeholderImg from '../assets/side-dish-1.png';
import { CUISINE_INTROS, MENU_ITEMS } from '../data/menuData';
import './Menu.css';

/* ─── Cuisine Groups ─────────────────────────────────────── */
const CUISINE_GROUPS = [
  {
    id: 'all',
    label: 'All',
    icon: '🍽',
    color: '#d4af37',
    categories: [
      "Appetizers", "Mocktails", "Salad & Chat", "Crunchy Munchy",
      "Milk Shakes", "Ice Cream", "Hot Beverages"
    ]
  },
  {
    id: 'indian',
    label: 'Indian',
    icon: '🍛',
    color: '#e8a000',
    categories: [
      "Tandoor Ki Aanch Se", "Sizzlers", "Indian Delicacies",
      "Dal", "Roti Ki Tokri", "Basmati Rice", "Khane Ke Saath Saath"
    ]
  },
  {
    id: 'chinese',
    label: 'Chinese',
    icon: '🥡',
    color: '#e8000d',
    categories: [
      "Chinese Soup", "Chinese Starters", "Chinese Main Course", "Noodles & Rice"
    ]
  },
  {
    id: 'thai',
    label: 'Thai',
    icon: '🍜',
    color: '#a855f7',
    categories: [
      "Thai Soups", "Thai Starters", "Thai Main Course", "Thai Rice & Noodles"
    ]
  },
  {
    id: 'mexican',
    label: 'Mexican',
    icon: '🌮',
    color: '#27a96c',
    categories: [
      "Mexican Soups", "Mexican & Italian Starters", "Mexican Main Course",
      "Burritos", "Tacos & Nachos"
    ]
  },
  {
    id: 'italian',
    label: 'Italian',
    icon: '🍝',
    color: '#c0842a',
    categories: [
      "Italian Soups", "Pasta", "Baked Dishes", "Pizza"
    ]
  },
];

const ALL_CATEGORIES_ORDER = [
  "Appetizers", "Mocktails", "Salad & Chat", "Chinese Soup", "Thai Soups",
  "Mexican Soups", "Italian Soups", "Tandoor Ki Aanch Se", "Chinese Starters",
  "Thai Starters", "Mexican & Italian Starters", "Burritos", "Tacos & Nachos",
  "Sizzlers", "Pasta", "Khane Ke Saath Saath", "Baked Dishes", "Indian Delicacies",
  "Dal", "Roti Ki Tokri", "Basmati Rice", "Thai Main Course", "Thai Rice & Noodles",
  "Chinese Main Course", "Noodles & Rice", "Mexican Main Course", "Pizza",
  "Crunchy Munchy", "Milk Shakes", "Ice Cream", "Hot Beverages"
];

const CATEGORY_ICONS = {
  "Appetizers": "🍹", "Mocktails": "🧃", "Salad & Chat": "🥗",
  "Chinese Soup": "🍲", "Thai Soups": "🫕", "Mexican Soups": "🌶",
  "Italian Soups": "🍵", "Tandoor Ki Aanch Se": "🔥", "Chinese Starters": "🥢",
  "Thai Starters": "🌿", "Mexican & Italian Starters": "🫓", "Burritos": "🌯",
  "Tacos & Nachos": "🌮", "Sizzlers": "♨️", "Pasta": "🍝",
  "Khane Ke Saath Saath": "🍱", "Baked Dishes": "🧆", "Indian Delicacies": "🍛",
  "Dal": "🫘", "Roti Ki Tokri": "🫓", "Basmati Rice": "🍚",
  "Thai Main Course": "🥘", "Thai Rice & Noodles": "🍜", "Chinese Main Course": "🥡",
  "Noodles & Rice": "🍜", "Mexican Main Course": "🌮", "Pizza": "🍕",
  "Crunchy Munchy": "🍟", "Milk Shakes": "🥤", "Ice Cream": "🍨",
  "Hot Beverages": "☕"
};

function Menu() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showInfo, setShowInfo] = useState(false);

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
      dispatch(setUserData(null));
      toast.success("You've been logged out. See you soon! 👋");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const { userData, cartItems, totalAmount } = useSelector(state => state.user);

  const socket = useSocket();
  const [session, setSession] = useState(null);
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
    const tableNumber = tNum || session?.tableNumber;
    if (!tableNumber) return;
    try {
      const res = await axios.get(`${serverUrl}/api/service/active`, { withCredentials: true });
      const filtered = res.data.filter(r => String(r.tableNumber) === String(tableNumber));
      setServiceRequests(filtered);
    } catch (err) {
      console.error("Error fetching active requests:", err);
    }
  };

  const handleRequestService = async (requestType) => {
    const tableNumber = session?.tableNumber;
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

  useEffect(() => {
    const fetchTableSession = async () => {
      if (!userData || userData.role !== 'customer') return;
      try {
        const res = await axios.get(`${serverUrl}/api/order/table-session/my-session`, { withCredentials: true });
        setSession(res.data);
        if (res.data && res.data.pinRequestStatus === 'approved') {
          fetchActiveServiceRequests(res.data.tableNumber);
        }
      } catch (error) {
        console.error("Failed to load table session on menu:", error);
      }
    };
    fetchTableSession();

    if (socket) {
      const handleSessionApproved = (data) => {
        if (userData?._id && String(data.userId) === String(userData._id)) {
          fetchTableSession();
        }
      };

      const handleSessionDeactivated = (data) => {
        if (session && String(session.tableNumber) === String(data.tableNumber)) {
          setSession(null);
          setServiceRequests([]);
        } else if (!session) {
          setSession(null);
          setServiceRequests([]);
        }
      };

      const handleServiceCompleted = ({ requestId }) => {
        setServiceRequests(prev => prev.filter(r => r._id !== requestId));
      };

      socket.on('table-session-approved', handleSessionApproved);
      socket.on('table-session-deactivated', handleSessionDeactivated);
      socket.on('table-session-updated', fetchTableSession);
      socket.on('service-request-completed', handleServiceCompleted);

      return () => {
        socket.off('table-session-approved', handleSessionApproved);
        socket.off('table-session-deactivated', handleSessionDeactivated);
        socket.off('table-session-updated', fetchTableSession);
        socket.off('service-request-completed', handleServiceCompleted);
      };
    }
  }, [userData?._id, socket, session]);

  const [activeCuisine, setActiveCuisine] = useState('all');
  const [activeCategory, setActiveCategory] = useState("Appetizers");
  const [searchQuery, setSearchQuery] = useState("");
  const [jainOnly, setJainOnly] = useState(false);
  const [cartAnimId, setCartAnimId] = useState(null);

  const sidebarRef = useRef(null);
  const mainRef = useRef(null);

  /* ── Categories visible for current cuisine group ── */
  const visibleCategories = useMemo(() => {
    const group = CUISINE_GROUPS.find(g => g.id === activeCuisine);
    return group ? group.categories : ALL_CATEGORIES_ORDER;
  }, [activeCuisine]);

  /* ── Switch cuisine → reset category ── */
  const handleCuisineChange = (id) => {
    setActiveCuisine(id);
    const group = CUISINE_GROUPS.find(g => g.id === id);
    if (group) setActiveCategory(group.categories[0]);
    setSearchQuery("");
  };

  /* ── Filtered items ── */
  const filteredItems = useMemo(() => {
    let items = MENU_ITEMS;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    } else {
      items = items.filter(i => i.category === activeCategory);
    }

    if (jainOnly) items = items.filter(i => i.isJain);
    return items;
  }, [activeCategory, searchQuery, jainOnly]);

  /* ── Cart handler ── */
  const handleAddToCart = (item) => {
    if (!userData) {
      toast.error("Please Sign In first to order delicious food! 🔑");
      navigate('/signin');
      return;
    }
    if (userData.role !== 'customer') {
      toast.error("Only customers can add items to cart!");
      return;
    }
    if (!session || session.pinRequestStatus !== 'approved') {
      toast.error("Table check-in required! Please check in at your table first and wait for waiter approval. 🛎️");
      return;
    }
    dispatch(addToCart({
      id: item.id, name: item.name, price: item.price,
      image: item.image || placeholderImg,
      shop: "prime_dine_restaurant",
      quantity: 1, foodType: item.isJain ? "jain" : "veg"
    }));
    setCartAnimId(item.id);
    setTimeout(() => setCartAnimId(null), 700);
    toast.success(`${item.name} added to cart! 🛒`);
  };

  /* ── Cuisine color for active state ── */
  const activeCuisineColor = CUISINE_GROUPS.find(g => g.id === activeCuisine)?.color || '#d4af37';

  /* ── Cuisine intro text ── */
  const getCuisineIntro = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes("indian") || c === "dal" || c === "roti ki tokri" || c === "basmati rice" || c === "khane ke saath saath" || c === "sizzlers") return CUISINE_INTROS.indian;
    if (c.includes("chinese") || c === "noodles & rice") return CUISINE_INTROS.chinese;
    if (c.includes("mexican") || c === "burritos" || c === "tacos & nachos") return CUISINE_INTROS.mexican;
    if (c.includes("italian") || c === "pasta" || c === "baked dishes" || c === "pizza") return CUISINE_INTROS.italian;
    if (c.includes("thai")) return CUISINE_INTROS.thai;
    return null;
  };

  return (
    <div className="mp-root">
      {/* ── Ambient background glows ── */}
      <div className="mp-glow mp-glow-1" style={{ background: `radial-gradient(circle, ${activeCuisineColor}18 0%, transparent 70%)` }} />
      <div className="mp-glow mp-glow-2" />

      {/* ══════════════════════════════════════════════
          NAV BAR
      ══════════════════════════════════════════════ */}
      <nav className="landing-nav">
        <div className="landing-logo" onClick={() => navigate('/')}>
          <img src={logoImg} alt="Prime Dine Logo" />
          <span>Prime Dine</span>
        </div>
        <ul className="landing-links">
          <li><a onClick={() => navigate('/')}>Home</a></li>
          <li><a className="active">Menu</a></li>
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
                        : (session)?.pinRequestStatus === 'approved'
                        ? "text-white hover:text-[#ff4d2d] hover:bg-white/10"
                        : "text-gray-500 cursor-not-allowed opacity-50"
                    }`}
                    title={
                      (session)?.pinRequestStatus === 'approved'
                        ? "Request Service (Waiter, Water, Bill...)"
                        : "Service requests are locked until table check-in is approved"
                    }
                    disabled={!((session)?.pinRequestStatus === 'approved')}
                  >
                    <FaConciergeBell size={20} className={((session)?.pinRequestStatus === 'approved') ? "animate-pulse" : ""} />
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
                        <span className="text-[10px] text-green-400 font-bold">Table {session?.tableNumber} Active</span>
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
                <div className="relative cursor-pointer mr-2" onClick={() => navigate("/cart")} style={{ color: 'white' }}>
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

      {/* ══════════════════════════════════════════════
          CINEMATIC HERO HEADER
      ══════════════════════════════════════════════ */}
      <header className="mp-hero">
        <div className="mp-hero-bg" />
        <div className="mp-hero-overlay" />

        <div className="mp-hero-content">


          {/* Ornamental cutlery divider */}
          <div className="mp-hero-ornament">
            <span className="mp-orn-line" />
            <span className="mp-orn-icon">✦</span>
            <span className="mp-orn-label">PRIME DINE RESTAURANT</span>
            <span className="mp-orn-icon">✦</span>
            <span className="mp-orn-line" />
          </div>

          <h1 className="mp-hero-title">
            ✨ Our <span>Signature</span> Menu
          </h1>
          <p className="mp-hero-sub">
            A curated collection of world-class cuisines — each dish a story of flavour, heritage, and passion.
          </p>

          {/* ── Search + Jain Filter Bar ── */}
          <div className="mp-controls-row">
            <div className="mp-search-box">
              <IoIosSearch className="mp-search-icon" />
              <input
                type="text"
                placeholder="Search dishes, categories…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="mp-search-input"
              />
              {searchQuery && (
                <button className="mp-search-clear" onClick={() => setSearchQuery("")}>
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Jain Filter Toggle */}
            <button
              className={`mp-jain-toggle ${jainOnly ? 'active' : ''}`}
              onClick={() => setJainOnly(v => !v)}
              title={jainOnly ? "Show all items" : "Show Jain items only"}
            >
              <GiLotusFlower className="mp-jain-icon" />
              <span>Jain</span>
              {jainOnly && <span className="mp-jain-badge">ON</span>}
            </button>
          </div>
        </div>

        {/* Hero decorative plates */}
        <div className="mp-hero-deco">
          <div className="mp-hero-plate mp-plate-1">🍛</div>
          <div className="mp-hero-plate mp-plate-2">🍝</div>
          <div className="mp-hero-plate mp-plate-3">🌮</div>
          <div className="mp-hero-plate mp-plate-4">🍕</div>
          <div className="mp-hero-plate mp-plate-5">🍔</div>
          <div className="mp-hero-plate mp-plate-6">🍣</div>
          <div className="mp-hero-plate mp-plate-7">🍰</div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          PARCHMENT CONTENT AREA (Cuisine Tabs + Cards)
      ══════════════════════════════════════════════ */}
      <div className="mp-parchment-area">

        {/* ══════════════════════════════════════════════
          CUISINE TABS (Horizontal scrollable)
      ══════════════════════════════════════════════ */}
        {!searchQuery && (
          <div className="mp-cuisine-bar">
            <div className="mp-cuisine-scroll">
              {CUISINE_GROUPS.map(g => (
                <button
                  key={g.id}
                  className={`mp-cuisine-tab ${activeCuisine === g.id ? 'active' : ''}`}
                  style={{ '--ct-color': g.color }}
                  onClick={() => handleCuisineChange(g.id)}
                >
                  <span className="mp-ct-icon">{g.icon}</span>
                  <span className="mp-ct-label">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
          MAIN CONTENT: Sidebar + Items
      ══════════════════════════════════════════════ */}
        <main className="mp-layout" ref={mainRef}>

          {/* ── LEFT SIDEBAR (desktop only) ── */}
          {!searchQuery && (
            <aside className="mp-sidebar" ref={sidebarRef}>
              <div className="mp-sidebar-card">
                <div className="mp-sidebar-header">
                  <FaUtensils className="mp-sidebar-hdr-icon" />
                  <span>Categories</span>
                </div>

                {/* Jain filter in sidebar too */}
                <button
                  className={`mp-sidebar-jain-btn ${jainOnly ? 'active' : ''}`}
                  onClick={() => setJainOnly(v => !v)}
                >
                  <GiLotusFlower />
                  <span>{jainOnly ? 'All Items' : 'Jain Only'}</span>
                </button>

                <ul className="mp-sidebar-list">
                  {visibleCategories.map(cat => {
                    const count = MENU_ITEMS.filter(i =>
                      i.category === cat && (!jainOnly || i.isJain)
                    ).length;
                    return (
                      <li key={cat}>
                        <button
                          className={`mp-sidebar-btn ${activeCategory === cat ? 'active' : ''}`}
                          onClick={() => setActiveCategory(cat)}
                          style={{ '--sb-color': activeCuisineColor }}
                        >
                          <span className="mp-sb-icon">{CATEGORY_ICONS[cat] || '🍴'}</span>
                          <span className="mp-sb-label">{cat}</span>
                          <span className="mp-sb-count">{count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          )}

          {/* ── RIGHT CONTENT AREA ── */}
          <section
            className="mp-content"
            style={searchQuery ? { gridColumn: '1 / -1' } : {}}
          >
            {/* ── Section header ── */}
            {searchQuery ? (
              <div className="mp-section-hdr">
                <div className="mp-section-title-wrap">
                  <h2>Results for <em>"{searchQuery}"</em></h2>
                </div>
                <span className="mp-section-pill">{filteredItems.length} found</span>
              </div>
            ) : (
              <div className="mp-section-hdr">
                <div className="mp-section-title-wrap">
                  <span className="mp-section-cat-icon">{CATEGORY_ICONS[activeCategory]}</span>
                  <h2>{activeCategory}</h2>
                  {jainOnly && <span className="mp-jain-chip"><GiLotusFlower /> Jain</span>}
                </div>
                <span className="mp-section-pill">{filteredItems.length} dishes</span>
              </div>
            )}

            {/* ── Cuisine intro quote ── */}
            {!searchQuery && getCuisineIntro(activeCategory) && (
              <div className="mp-cuisine-intro" style={{ '--ci-color': activeCuisineColor }}>
                <span className="mp-ci-quote">"</span>
                <p>{getCuisineIntro(activeCategory)}</p>
                <span className="mp-ci-quote mp-ci-quote-end">"</span>
              </div>
            )}

            {/* ── Mobile category scrollbar ── */}
            {!searchQuery && (
              <div className="mp-mobile-cats">
                {visibleCategories.map(cat => (
                  <button
                    key={cat}
                    className={`mp-mobile-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                    style={{ '--mc-color': activeCuisineColor }}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            )}

            {/* ── DISHES GRID ── */}
            {filteredItems.length > 0 ? (
              <div className="mp-dishes-grid">
                {filteredItems.map((item, idx) => (
                  <article
                    key={item.id}
                    className={`mp-dish-card ${cartAnimId === item.id ? 'cart-bounce' : ''}`}
                    style={{ animationDelay: `${(idx % 9) * 0.05}s` }}
                  >
                    {/* Image area */}
                    <div className="mp-card-img-wrap">
                      <img src={item.image || placeholderImg} alt={item.name} className="mp-card-img" />
                      <div className="mp-card-img-overlay" />

                      {/* Badges */}
                      <div className="mp-card-badges">
                        <span className="mp-badge mp-badge-veg">
                          <FaLeaf /> VEG
                        </span>
                        {item.isJain && (
                          <span className="mp-badge mp-badge-jain">
                            <GiLotusFlower /> JAIN
                          </span>
                        )}
                      </div>

                      {/* Size tag */}
                      {item.size && (
                        <span className="mp-card-size">{item.size}</span>
                      )}


                    </div>

                    {/* Info */}
                    <div className="mp-card-body">
                      <div className="mp-card-title-row">
                        <h3 className="mp-card-title">{item.name}</h3>
                        <span className="mp-card-price">₹{item.price}</span>
                      </div>
                      <p className="mp-card-desc">{item.description}</p>

                      <div className="mp-card-footer">
                        <div className="mp-card-stars">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < 4 ? 'star-fill' : 'star-empty'} />
                          ))}
                        </div>
                        <button
                          className="mp-add-btn"
                          onClick={() => handleAddToCart(item)}
                          style={{ '--ab-color': activeCuisineColor }}
                        >
                          ADD TO CART
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mp-empty">
                <div className="mp-empty-icon">🍽</div>
                <h3>{jainOnly ? 'No Jain Dishes in this Category' : 'No Dishes Found'}</h3>
                <p>
                  {jainOnly
                    ? 'Try another category or turn off the Jain filter to see all items.'
                    : `We couldn't find dishes matching "${searchQuery}".`}
                </p>
                {jainOnly && (
                  <button className="mp-empty-btn" onClick={() => setJainOnly(false)}>
                    Show All Items
                  </button>
                )}
              </div>
            )}
          </section>
        </main>

      </div>{/* end mp-parchment-area */}

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
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
              <li><a className="active">Menu</a></li>
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
            <h4>Contact Info</h4>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '8px' }}>
              1st Floor, Sachet-4, Opp. Balaji Garden, Ahmedabad
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '8px' }}>
              Email: primedinerestaurant@gmail.com
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              Call: 079 26922535, +91 85117 27429
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Prime Dine. All rights reserved.</p>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════
          FLOATING CART WIDGET
      ══════════════════════════════════════════════ */}
      {cartItems && cartItems.length > 0 && (
        <div className="fixed bottom-8 right-8 z-[9999] animate-fade-in">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-4 bg-[#ff4d2d] hover:bg-[#e03c20] text-white px-6 py-4 rounded-full shadow-2xl transition-transform transform hover:scale-105"
          >
            <div className="relative">
              <FaShoppingCart size={24} />
              <span className="absolute -top-3 -right-3 bg-white text-[#ff4d2d] text-xs font-black w-6 h-6 flex items-center justify-center rounded-full shadow-md border-2 border-[#ff4d2d]">
                {cartItems.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </div>
            <div className="text-left border-l border-white/30 pl-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80">View Cart</p>
              <p className="text-lg font-bold">₹{totalAmount}</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default Menu;
