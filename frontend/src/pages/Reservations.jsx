import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import axios from 'axios';
import { serverUrl } from '../App';
import { FaCheckCircle, FaStar, FaPhoneAlt, FaVideo, FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';
import { GiBigDiamondRing, GiPartyPopper } from 'react-icons/gi';
import toast from 'react-hot-toast';

import logoImg from '../assets/FoodZone.png';

// Import all reservation images
import bday1 from '../assets/reservation/Birthday/1.jpg';
import bday2 from '../assets/reservation/Birthday/2.jpg';
import bday3 from '../assets/reservation/Birthday/3.jpg';
import bday4 from '../assets/reservation/Birthday/4.jpg';
import bday5 from '../assets/reservation/Birthday/5.jpg';
import bday6 from '../assets/reservation/Birthday/6.jpg';
import bday7 from '../assets/reservation/Birthday/7.jpg';
import bday8 from '../assets/reservation/Birthday/8.jpg';
import bday9 from '../assets/reservation/Birthday/9.jpg';
import bday10 from '../assets/reservation/Birthday/10.jpg';

import anni1 from '../assets/reservation/anniversary/1.jpg';
import anni2 from '../assets/reservation/anniversary/2.jpg';
import anni3 from '../assets/reservation/anniversary/3.jpg';
import anni4 from '../assets/reservation/anniversary/4.jpg';
import anni5 from '../assets/reservation/anniversary/5.jpg';
import anni6 from '../assets/reservation/anniversary/6.jpg';
import anni7 from '../assets/reservation/anniversary/7.jpg';
import anni8 from '../assets/reservation/anniversary/8.jpg';
import anni9 from '../assets/reservation/anniversary/9.jpg';
import anni10 from '../assets/reservation/anniversary/10.jpg';

import baby1 from '../assets/reservation/Babyshower/1.jpg';
import baby2 from '../assets/reservation/Babyshower/2.jpg';
import baby3 from '../assets/reservation/Babyshower/3.jpg';
import themeKids from '../assets/Card/kids.png';
import themeTeen from '../assets/Card/teen.png';
import themeAdult from '../assets/Card/adult.png';
import themeAnniRom from '../assets/Card/11.jpg';
import themeAnniRoy from '../assets/Card/22.jpg';
import themeAnniFam from '../assets/Card/33.jpg';

import './Reservations.css';

// --- DATA STRUCTURES ---

const BIRTHDAY_PACKAGES = [
  {
    id: 'bday-silver',
    title: 'Silver Birthday Package',
    idealFor: '10 - 20 Guests',
    price: '₹7,999 onwards',
    img: bday1,
    includes: [
      'Reserved Decoration Area',
      'Balloon Decoration',
      'Birthday Banner',
      'Welcome Drink',
      'Cake Cutting Setup',
      'Photo Corner',
      'Background Music'
    ],
    food: ['2 Starters', '2 Main Course', 'Bread Basket', 'Dessert', 'Mocktail']
  },
  {
    id: 'bday-gold',
    title: 'Gold Birthday Package',
    idealFor: '20 - 50 Guests',
    price: '₹19,999 onwards',
    img: bday2,
    isPopular: true,
    includes: [
      'Everything in Silver +',
      'Premium Theme Decoration',
      'LED Name Board',
      'Dedicated Event Host',
      'Professional Photography',
      'Customized Birthday Cake',
      'Party Props'
    ],
    food: ['4 Starters', '3 Main Courses', 'Dessert Counter', 'Mocktails'],
    special: {
      title: '🎥 Birthday Memory Slideshow',
      desc: 'Customer uploads childhood photos and videos. Restaurant displays them on projector.'
    }
  },
  {
    id: 'bday-platinum',
    title: 'Platinum Birthday Package',
    idealFor: '50 - 100 Guests',
    price: '₹49,999 onwards',
    img: bday3,
    includes: [
      'Everything in Gold +',
      'Premium Hall Booking',
      'Luxury Theme Decoration',
      'Live DJ',
      'Smoke Entry',
      'LED Dance Floor',
      '360° Camera Booth',
      'Professional Videography'
    ],
    food: ['Unlimited Buffet', 'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai'],
    special: {
      title: '🎥 Family Memory Theatre',
      desc: 'Customer uploads childhood photos, family photos, videos, and messages. System automatically creates slideshow. Displayed on big projector screen.'
    }
  }
];

const ANNIVERSARY_PACKAGES = [
  {
    id: 'anni-silver',
    title: 'Silver Anniversary Package',
    idealFor: 'Couples',
    price: '₹4,999',
    img: anni1,
    includes: [
      'Candle Light Dinner',
      'Rose Bouquet',
      'Customized Table Decoration',
      'Couple Photography',
      'Dessert Platter'
    ]
  },
  {
    id: 'anni-gold',
    title: 'Gold Anniversary Package',
    idealFor: 'Couples',
    price: '₹11,999',
    img: anni2,
    isPopular: true,
    includes: [
      'Everything in Silver +',
      'Private Dining Area',
      'Live Music',
      'Personalized Cake',
      'Couple Video Display',
      'Welcome Mocktails'
    ]
  },
  {
    id: 'anni-platinum',
    title: 'Platinum Anniversary Package',
    idealFor: 'Couples + Family Gathering',
    price: '₹29,999',
    img: anni3,
    includes: [
      'Everything in Gold +',
      'Private Hall',
      'Premium Decoration',
      'Family Gathering Setup',
      'Live Singer',
      'Professional Photography',
      'Memory Video Presentation',
      'Couple Entry Setup'
    ]
  }
];

const THEME_OPTIONS = {
  birthday: {
    kids: ['Cocomelon', 'Doraemon', 'Barbie', 'Frozen', 'Superheroes'],
    teen: ['Neon Party', 'Gaming Party', 'Bollywood Theme'],
    adult: ['Luxury Black & Gold', 'Royal Theme', 'Floral Theme']
  },
  anniversary: {
    romantic: ['Rose petals', 'Candles', 'Fairy lights'],
    royal: ['Golden decoration', 'Premium seating', 'Luxury setup'],
    family: ['Large family arrangement', 'Group photography', 'Buffet setup']
  }
};

const TESTIMONIALS = [
  { name: "Anjali Sharma", text: "The Platinum Birthday package was incredible. The memory theatre made everyone cry happy tears. Highly recommended!" },
  { name: "Rahul & Sneha", text: "We celebrated our 10th anniversary here. The private dining and live music created the most romantic atmosphere." },
  { name: "Vikram Mehta", text: "Organized a corporate farewell. The custom event planning was flawless, and the food was praised by all colleagues." },
  { name: "Priya Desai", text: "The kids' themed birthday was a huge hit! The decorators really paid attention to detail. Fantastic experience." },
  { name: "Amit Patel", text: "Best place for a surprise party. The staff went above and beyond to keep it a secret until the right moment!" },
  { name: "Sonia Kapoor", text: "Beautiful ambiance and exquisite food. The Royal Anniversary package made us feel truly special." }
];

const FAQS = [
  {
    question: "Do I need to pay an advance amount to confirm my reservation?",
    answer: "Yes, a 30% advance payment is required to confirm bookings for all premium and custom event packages."
  },
  {
    question: "Can we bring our own birthday/anniversary cake?",
    answer: "Yes, you can bring your own cake for Silver packages. For Gold and Platinum packages, a customized premium cake is included."
  },
  {
    question: "Is there a cancellation policy?",
    answer: "Cancellations made 48 hours prior to the event are fully refundable. Cancellations within 48 hours will incur a 15% deduction."
  },
  {
    question: "Can we customize the food menu in the packages?",
    answer: "Absolutely! We provide a base menu, but you can swap items from our extensive Indian, Chinese, Italian, Mexican, and Thai options."
  }
];

export default function Reservations() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);
  
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
  
  const [activeTab, setActiveTab] = useState('birthday');
  const [openFaq, setOpenFaq] = useState(null);
  
  const [calcGuests, setCalcGuests] = useState(50);
  const [calcFood, setCalcFood] = useState('Premium Buffet');
  const [calcDeco, setCalcDeco] = useState('Gold');
  const [calcPhoto, setCalcPhoto] = useState(true);
  const [calcMusic, setCalcMusic] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const calculateBudget = () => {
    let foodCost = 0;
    if (calcFood === 'Basic Menu') foodCost = calcGuests * 500;
    else if (calcFood === 'Premium Buffet') foodCost = calcGuests * 800;
    else foodCost = calcGuests * 1200;

    let decoCost = 0;
    if (calcDeco === 'Basic') decoCost = 3000;
    else if (calcDeco === 'Gold') decoCost = 10000;
    else decoCost = 25000;

    const photoCost = calcPhoto ? 5000 : 0;
    const musicCost = calcMusic ? 4000 : 0;

    return {
      food: foodCost,
      deco: decoCost,
      photo: photoCost,
      music: musicCost,
      total: foodCost + decoCost + photoCost + musicCost
    };
  };
  const budget = calculateBudget();

  const [selectedPackageObj, setSelectedPackageObj] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [modalPhone, setModalPhone] = useState('');
  const [modalDate, setModalDate] = useState('');

  // Custom Event Customizer State
  const [customName, setCustomName] = useState(userData?.fullName || '');
  const [customPhone, setCustomPhone] = useState(userData?.mobile || '');
  const [customEventType, setCustomEventType] = useState('Birthday');
  const [customTheme, setCustomTheme] = useState('Default Theme');
  const [customGuests, setCustomGuests] = useState(25);
  const [customDate, setCustomDate] = useState('');
  const [customFoodTier, setCustomFoodTier] = useState('Premium Buffet');
  const [customFoodStyle, setCustomFoodStyle] = useState('Both');
  const [customFoodChoice, setCustomFoodChoice] = useState('');
  const [customDrinksTier, setCustomDrinksTier] = useState('Soft Drinks');
  const [addonPhoto, setAddonPhoto] = useState(false);
  const [addonDeco, setAddonDeco] = useState(false);
  const [addonDJ, setAddonDJ] = useState(false);
  const [addonLiveMusic, setAddonLiveMusic] = useState(false);

  // Sync user info if loaded later
  useEffect(() => {
    if (userData) {
      setCustomName(userData.fullName);
      setCustomPhone(userData.mobile || '');
    }
  }, [userData]);

  const getThemeList = (cat) => {
    if (cat === 'birthday') {
      return [...THEME_OPTIONS.birthday.kids, ...THEME_OPTIONS.birthday.teen, ...THEME_OPTIONS.birthday.adult];
    }
    return [...THEME_OPTIONS.anniversary.romantic, ...THEME_OPTIONS.anniversary.royal, ...THEME_OPTIONS.anniversary.family];
  };

  const getPresetGuestsCount = (pkgId) => {
    if (pkgId === 'bday-silver') return 15;
    if (pkgId === 'bday-gold') return 35;
    if (pkgId === 'bday-platinum') return 75;
    if (pkgId === 'anni-silver') return 2;
    if (pkgId === 'anni-gold') return 2;
    if (pkgId === 'anni-platinum') return 10;
    return 10;
  };

  const handleOpenBookingModal = (pkg) => {
    if (!userData) {
      toast.error("Please sign in to book a package.");
      navigate('/signin');
      return;
    }
    setSelectedPackageObj(pkg);
    setModalPhone(userData.mobile || '');
    
    // Default to tomorrow's date formatted as YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    setModalDate(`${year}-${month}-${day}`);
    
    setBookingModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalPhone.trim()) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!modalDate) {
      toast.error("Please select a booking date.");
      return;
    }
    try {
      const guests = getPresetGuestsCount(selectedPackageObj.id);

      await axios.post(`${serverUrl}/api/reservation/create`, {
        fullName: userData.fullName,
        phone: modalPhone,
        eventType: activeTab === 'birthday' ? 'Birthday' : 'Anniversary',
        eventDate: new Date(modalDate),
        guests,
        packageTitle: selectedPackageObj.title,
        decorationTheme: 'Classic Theme',
        requirements: `Preset package: ${selectedPackageObj.title} (Confirmed via single confirmation popup)`
      }, { withCredentials: true });

      toast.success(`Booking request for ${selectedPackageObj.title} submitted! 🥳`);
      setBookingModalOpen(false);
      setSelectedPackageObj(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit package booking.");
    }
  };

  const handleTransitionToCustomizer = (pkg) => {
    setBookingModalOpen(false);
    
    // Set custom event builder states from package specs
    setCustomName(userData?.fullName || '');
    setCustomPhone(userData?.mobile || '');
    setCustomEventType(activeTab === 'birthday' ? 'Birthday' : 'Anniversary');
    setCustomTheme(modalTheme || 'Default Theme');
    setCustomDate(modalDate);
    
    const guests = getPresetGuestsCount(pkg.id);
    setCustomGuests(guests);
    
    // Set Food Tier
    if (pkg.id.includes('silver')) {
      setCustomFoodTier('Basic Menu');
    } else if (pkg.id.includes('gold')) {
      setCustomFoodTier('Premium Buffet');
    } else if (pkg.id.includes('platinum')) {
      setCustomFoodTier('Luxury Buffet');
    }

    // Set Add-ons
    setAddonPhoto(pkg.id.includes('gold') || pkg.id.includes('platinum'));
    setAddonDJ(pkg.id.includes('platinum'));
    setAddonLiveMusic(pkg.id === 'anni-gold' || pkg.id === 'anni-platinum');
    setAddonDeco(pkg.id.includes('gold') || pkg.id.includes('platinum'));

    // Scroll to section
    setTimeout(() => {
      document.getElementById('custom-builder-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    toast.success(`Pre-filled customizer with ${pkg.title} specs! 🛠️`);
  };

  const handleBookConsultation = async (e) => {
    e.preventDefault();
    if (!userData) {
      toast.error("Please sign in to request a consultation.");
      navigate('/signin');
      return;
    }
    const elements = e.target.elements;
    const eventType = elements[0].value;
    const guests = elements[1].value;
    const eventDate = elements[2].value;
    const budgetRange = elements[3].value;
    const requirements = elements[4].value;
    const meetingMode = e.target.querySelector('input[name="meeting"]:checked')?.parentElement?.textContent?.trim() || 'Phone Call';

    try {
      await axios.post(`${serverUrl}/api/reservation/create`, {
        fullName: userData.fullName,
        phone: userData.mobile || 'Not Provided',
        eventType,
        eventDate,
        guests: parseInt(guests),
        packageTitle: 'Custom Event Consultation',
        meetingMode,
        budgetRange,
        requirements
      }, { withCredentials: true });

      toast.success("Consultation request submitted! Our manager will contact you soon. 📞");
      e.target.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit consultation request.");
    }
  };

  // Helper cost calculations
  const getFoodPrice = (tier) => {
    if (tier === 'Basic Menu') return 500;
    if (tier === 'Premium Buffet') return 800;
    if (tier === 'Luxury Buffet') return 1200;
    return 800;
  };

  const getDrinksPrice = (tier) => {
    if (tier === 'Soft Drinks') return 0;
    if (tier === 'Premium Mocktails') return 150;
    if (tier === 'Unlimited Bar') return 300;
    return 0;
  };

  const foodHeadPrice = getFoodPrice(customFoodTier);
  const drinksHeadPrice = getDrinksPrice(customDrinksTier);
  const perHeadTotal = foodHeadPrice + drinksHeadPrice;
  const foodDrinksTotal = perHeadTotal * customGuests;

  const photoCost = addonPhoto ? 5000 : 0;
  const decoCost = addonDeco ? 10000 : 0;
  const djCost = addonDJ ? 4000 : 0;
  const liveMusicCost = addonLiveMusic ? 12000 : 0;
  const addonsTotal = photoCost + decoCost + djCost + liveMusicCost;

  const estimatedTotal = foodDrinksTotal + addonsTotal;

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!userData) {
      toast.error("Please sign in to book a customized reservation.");
      navigate('/signin');
      return;
    }

    if (!customDate) {
      toast.error("Please select an event date and time.");
      return;
    }

    const calculatedAddons = [];
    if (addonPhoto) calculatedAddons.push("Photography");
    if (addonDeco) calculatedAddons.push("Premium Deco");
    if (addonDJ) calculatedAddons.push("DJ & Sound");
    if (addonLiveMusic) calculatedAddons.push("Live Band/Singer");

    const reqString = `Theme: ${customTheme} | Food: ${customFoodTier} (${customFoodStyle}) | Drinks: ${customDrinksTier} | Add-ons: ${calculatedAddons.join(', ') || 'None'} | Notes: ${customFoodChoice || 'None'}`;

    try {
      await axios.post(`${serverUrl}/api/reservation/create`, {
        fullName: customName,
        phone: customPhone,
        eventType: customEventType,
        eventDate: customDate,
        guests: parseInt(customGuests),
        packageTitle: 'Customized Event Package',
        decorationTheme: customTheme,
        requirements: reqString,
        bill: estimatedTotal
      }, { withCredentials: true });

      toast.success("Custom event reservation request submitted! 🥳");
      
      // Reset form
      setCustomTheme('Default Theme');
      setCustomFoodTier('Premium Buffet');
      setCustomFoodStyle('Both');
      setCustomFoodChoice('');
      setCustomDrinksTier('Soft Drinks');
      setAddonPhoto(false);
      setAddonDeco(false);
      setAddonDJ(false);
      setAddonLiveMusic(false);
      setCustomDate('');
    } catch (error) {
      toast.error("Failed to submit custom event reservation.");
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="res-root">
      <div className="res-glow res-glow-1" />
      <div className="res-glow res-glow-2" />

      <div className="res-chex-bg">
        <nav className="res-nav landing-nav">
        <div className="landing-logo" onClick={() => navigate('/')}>
          <img src={logoImg} alt="Prime Dine Logo" />
          <span>Prime Dine</span>
        </div>
        <ul className="landing-links">
          <li><a onClick={() => navigate('/')}>Home</a></li>
          <li><a onClick={() => navigate('/menu')}>Menu</a></li>
          <li><a className="active">Reservations</a></li>
          <li><a onClick={() => navigate('/about')}>About Us</a></li>
        </ul>
        <div className="landing-nav-auth">
          {userData ? (
            userData.role === "customer" ? (
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

      <header className="res-hero">
        <div className="res-hero-bg" />
        <div className="res-hero-content">
          <div className="res-hero-badge">✨ Premium Event Management ✨</div>
          <h1 className="res-hero-title">
            Make Your Special Moments <span>Unforgettable</span>
          </h1>
          <p className="res-hero-sub">
            From intimate anniversary dinners to grand birthday celebrations and corporate events, we plan it all to perfection.
          </p>
        </div>
      </header>

      <div className="res-tabs-container">
        <div className="res-tabs">
          <button 
            className={`res-tab ${activeTab === 'birthday' ? 'active' : ''}`}
            onClick={() => setActiveTab('birthday')}
          >
            <GiPartyPopper /> Birthday Celebrations
          </button>
          <button 
            className={`res-tab ${activeTab === 'anniversary' ? 'active' : ''}`}
            onClick={() => setActiveTab('anniversary')}
          >
            <GiBigDiamondRing /> Anniversary Celebrations
          </button>
          <button 
            className={`res-tab ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            <FaCalendarAlt /> Custom Events
          </button>
        </div>
      </div>

      <main className="res-main-content res-top-content">
        {activeTab === 'birthday' && (<>
          <div className="res-birthday-wrapper">

            <section className="res-section res-section-birthday fade-in">
            <div className="res-section-header">
              <h2>Birthday Celebration Packages</h2>
              <p>Choose the perfect package for a magical birthday experience.</p>
            </div>
            
            <div className="res-packages-grid">
              {BIRTHDAY_PACKAGES.map(pkg => (
                <div key={pkg.id} className={`res-package-card ${pkg.isPopular ? 'popular' : ''}`}>
                  {pkg.isPopular && <div className="res-popular-badge">Most Popular</div>}
                  <img src={pkg.img} alt={pkg.title} className="res-package-img" />
                  <div className="res-package-content">
                    <h3 className="res-pkg-title">{pkg.title}</h3>
                    <div className="res-pkg-ideal"><FaUserFriends /> Ideal for: {pkg.idealFor}</div>
                    <div className="res-pkg-price">{pkg.price}</div>
                    
                    <div className="res-pkg-divider" />
                    
                    <div className="res-pkg-section">
                      <h4>Includes:</h4>
                      <ul className="res-pkg-list">
                        {pkg.includes.map((inc, i) => (
                          <li key={i}><FaCheckCircle className="check-icon" /> {inc}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="res-pkg-section">
                      <h4>Food:</h4>
                      <div className="res-pkg-food-tags">
                        {pkg.food.map((f, i) => <span key={i} className="res-food-tag">{f}</span>)}
                      </div>
                    </div>

                    {pkg.special && (
                      <div className="res-pkg-special">
                        <h4>{pkg.special.title}</h4>
                        <p>{pkg.special.desc}</p>
                      </div>
                    )}

                    <button className="res-btn-book" onClick={() => handleOpenBookingModal(pkg)}>Book This Package</button>
                  </div>
                </div>
              ))}
            </div>

          </section>
          </div>
          
          <section className="res-section res-themes-animated-section res-themes-birthday fade-in">
            <div className="res-themes-animated-header">
              <h2>✨ Discover Magical Themes</h2>
              <p>Hover over the cards below to explore the perfect vibe for your celebration.</p>
            </div>
            
            <div className="res-themes-3d-grid">
              <div className="res-flip-card">
                <div className="res-flip-card-inner">
                  <div className="res-flip-card-front">
                    <img src={themeKids} alt="Kids Themes" className="res-flip-img" />
                    <h4>Kids Themes</h4>
                  </div>
                  <div className="res-flip-card-back">
                    <ul>
                      {THEME_OPTIONS.birthday.kids.map(t => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="res-flip-card" style={{animationDelay: '0.2s'}}>
                <div className="res-flip-card-inner">
                  <div className="res-flip-card-front">
                    <img src={themeTeen} alt="Teen Themes" className="res-flip-img" />
                    <h4>Teen Themes</h4>
                  </div>
                  <div className="res-flip-card-back">
                    <ul>
                      {THEME_OPTIONS.birthday.teen.map(t => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="res-flip-card" style={{animationDelay: '0.4s'}}>
                <div className="res-flip-card-inner">
                  <div className="res-flip-card-front">
                    <img src={themeAdult} alt="Adult Themes" className="res-flip-img" />
                    <h4>Adult Themes</h4>
                  </div>
                  <div className="res-flip-card-back">
                    <ul>
                      {THEME_OPTIONS.birthday.adult.map(t => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="res-gallery-section">
            <h2>Birthday Theme Gallery</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>Explore some of our beautiful birthday setups.</p>
            <div className="res-gallery-grid bento-grid">
              <div className="res-gallery-card bento-card-large">
                <img src={bday1} alt="Premium Birthday 1" />
                <div className="res-gallery-info">Premium Birthday</div>
              </div>
              <div className="res-gallery-card bento-card-tall">
                <img src={bday2} alt="Premium Birthday 2" />
                <div className="res-gallery-info">Luxury Setup</div>
              </div>
              <div className="res-gallery-card">
                <img src={bday3} alt="Premium Birthday 3" />
                <div className="res-gallery-info">Kids Special</div>
              </div>
              <div className="res-gallery-card">
                <img src={bday4} alt="Premium Birthday 4" />
                <div className="res-gallery-info">Royal Theme</div>
              </div>
              <div className="res-gallery-card bento-card-wide">
                <img src={bday5} alt="Premium Birthday 5" />
                <div className="res-gallery-info">Elegant Setup</div>
              </div>
              <div className="res-gallery-card">
                <img src={bday6} alt="Premium Birthday 6" />
                <div className="res-gallery-info">Romantic Vibe</div>
              </div>
              <div className="res-gallery-card bento-card-large">
                <img src={bday7} alt="Premium Birthday 7" />
                <div className="res-gallery-info">Neon Party</div>
              </div>
              <div className="res-gallery-card">
                <img src={bday8} alt="Premium Birthday 8" />
                <div className="res-gallery-info">Minimalist</div>
              </div>
              <div className="res-gallery-card bento-card-wide">
                <img src={bday9} alt="Premium Birthday 9" />
                <div className="res-gallery-info">Grand Celebration</div>
              </div>
              <div className="res-gallery-card bento-card-wide">
                <img src={bday10} alt="Premium Birthday 10" />
                <div className="res-gallery-info">Intimate Dining</div>
              </div>
            </div>
          </section>
        </>)}

        {activeTab === 'anniversary' && (<>
          <section className="res-section res-section-anniversary fade-in">
            <div className="res-section-header">
              <h2>❤️ Anniversary Packages</h2>
              <p>Celebrate your love story with our romantic and exclusive setups.</p>
            </div>
            
            <div className="res-packages-grid">
              {ANNIVERSARY_PACKAGES.map(pkg => (
                <div key={pkg.id} className={`res-package-card ${pkg.isPopular ? 'popular' : ''}`}>
                  {pkg.isPopular && <div className="res-popular-badge">Most Romantic</div>}
                  <img src={pkg.img} alt={pkg.title} className="res-package-img" />
                  <div className="res-package-content">
                    <h3 className="res-pkg-title">{pkg.title}</h3>
                    <div className="res-pkg-ideal"><FaUserFriends /> {pkg.idealFor}</div>
                    <div className="res-pkg-price">{pkg.price}</div>
                    
                    <div className="res-pkg-divider" />
                    
                    <div className="res-pkg-section">
                      <h4>Includes:</h4>
                      <ul className="res-pkg-list heart-list">
                        {pkg.includes.map((inc, i) => (
                          <li key={i}>❤️ {inc}</li>
                        ))}
                      </ul>
                    </div>

                    <button className="res-btn-book" onClick={() => handleOpenBookingModal(pkg)}>Book This Package</button>
                  </div>
                </div>
              ))}
            </div>

          </section>

          <section className="res-section res-themes-animated-section res-themes-anniversary fade-in">
            <div className="res-themes-animated-header">
              <h2>💍 Special Anniversary Themes</h2>
              <p>Hover over the cards below to find the perfect romantic setup.</p>
            </div>
            
            <div className="res-themes-3d-grid">
              <div className="res-flip-card">
                <div className="res-flip-card-inner">
                  <div className="res-flip-card-front">
                    <img src={themeAnniRom} alt="Romantic Theme" className="res-flip-img" />
                    <h4>Romantic Theme</h4>
                  </div>
                  <div className="res-flip-card-back">
                    <ul>
                      {THEME_OPTIONS.anniversary.romantic.map(t => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="res-flip-card" style={{animationDelay: '0.2s'}}>
                <div className="res-flip-card-inner">
                  <div className="res-flip-card-front">
                    <img src={themeAnniRoy} alt="Royal Theme" className="res-flip-img" />
                    <h4>Royal Theme</h4>
                  </div>
                  <div className="res-flip-card-back">
                    <ul>
                      {THEME_OPTIONS.anniversary.royal.map(t => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="res-flip-card" style={{animationDelay: '0.4s'}}>
                <div className="res-flip-card-inner">
                  <div className="res-flip-card-front">
                    <img src={themeAnniFam} alt="Family Celebration" className="res-flip-img" />
                    <h4>Family Celebration</h4>
                  </div>
                  <div className="res-flip-card-back">
                    <ul>
                      {THEME_OPTIONS.anniversary.family.map(t => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="res-gallery-section">
            <h2>Anniversary Theme Gallery</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>Explore some of our beautiful romantic setups.</p>
            <div className="res-gallery-grid bento-grid">
              <div className="res-gallery-card bento-card-large">
                <img src={anni1} alt="Anniversary Celebration 1" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
              <div className="res-gallery-card bento-card-tall">
                <img src={anni2} alt="Anniversary Celebration 2" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
              <div className="res-gallery-card">
                <img src={anni3} alt="Anniversary Celebration 3" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
              <div className="res-gallery-card">
                <img src={anni4} alt="Anniversary Celebration 4" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
              <div className="res-gallery-card bento-card-wide">
                <img src={anni5} alt="Anniversary Celebration 5" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
              <div className="res-gallery-card">
                <img src={anni6} alt="Anniversary Celebration 6" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
              <div className="res-gallery-card bento-card-large">
                <img src={anni7} alt="Anniversary Celebration 7" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
              <div className="res-gallery-card">
                <img src={anni8} alt="Anniversary Celebration 8" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
              <div className="res-gallery-card bento-card-wide">
                <img src={anni9} alt="Anniversary Celebration 9" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
              <div className="res-gallery-card bento-card-wide">
                <img src={anni10} alt="Anniversary Celebration 10" />
                <div className="res-gallery-info">Anniversary Celebration</div>
              </div>
            </div>
          </section>
        </>)}

        {activeTab === 'custom' && (
          <section className="res-section res-section-custom fade-in">
            <div className="res-section-header">
              <h2>Custom Event Planning</h2>
              <p>This is where your idea becomes unique. Tailored experiences for corporate and personal events.</p>
            </div>

            <div className="res-custom-workflow">
              <h3>Custom Event Workflow</h3>
              <div className="res-workflow-steps">
                <div className="res-step">
                  <div className="res-step-icon">1</div>
                  <span>Book Consultation</span>
                </div>
                <div className="res-step-line" />
                <div className="res-step">
                  <div className="res-step-icon">2</div>
                  <span>Discussion Call</span>
                </div>
                <div className="res-step-line" />
                <div className="res-step">
                  <div className="res-step-icon">3</div>
                  <span>Custom Quotation</span>
                </div>
                <div className="res-step-line" />
                <div className="res-step">
                  <div className="res-step-icon">4</div>
                  <span>Approval & Confirmation</span>
                </div>
              </div>
            </div>

            <div className="res-custom-form-container">
              <form className="res-custom-form" onSubmit={handleBookConsultation}>
                <h3>Book a Consultation</h3>
                <div className="res-form-grid">
                  <div className="res-form-group">
                    <label>Event Type</label>
                    <select required>
                      <option value="">Select Event Type</option>
                      <option>Corporate Meeting</option>
                      <option>Engagement</option>
                      <option>Baby Shower</option>
                      <option>Farewell Party</option>
                      <option>Family Reunion</option>
                      <option>Product Launch</option>
                      <option>Festival Celebration</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="res-form-group">
                    <label>Number of Guests</label>
                    <input type="number" min="10" placeholder="E.g. 50" required />
                  </div>
                  <div className="res-form-group">
                    <label>Estimated Date</label>
                    <input type="date" required />
                  </div>
                  <div className="res-form-group">
                    <label>Budget Range</label>
                    <input type="text" placeholder="E.g. ₹20,000 - ₹50,000" />
                  </div>
                </div>
                <div className="res-form-group">
                  <label>Specific Requirements</label>
                  <textarea rows="4" placeholder="Tell us about your dream event..."></textarea>
                </div>
                
                <div className="res-meeting-options">
                  <label>Preferred Meeting Mode:</label>
                  <div className="res-radio-group">
                    <label><input type="radio" name="meeting" defaultChecked /> <FaPhoneAlt /> Phone Call</label>
                    <label><input type="radio" name="meeting" /> <FaVideo /> Video Meeting</label>
                    <label><input type="radio" name="meeting" /> <FaMapMarkerAlt /> In-Person</label>
                  </div>
                </div>

                <button type="submit" className="res-btn-submit">Schedule Consultation</button>
              </form>

              <div className="res-extra-features">
                <h3>Extra Features You Can Add</h3>
                <ul className="res-features-list">
                  <li>
                    <strong>🎥 Memory Video Upload:</strong> Upload images, videos, and voice messages. We'll create a projector presentation.
                  </li>
                  <li>
                    <strong>🍽️ Extensive Food Selection:</strong> Choose from Indian, Chinese, Italian, Mexican, Thai, Live Counters, and Dessert Bars.
                  </li>
                  <li>
                    <strong>🎨 Premium Decoration:</strong> Select from our gallery of Basic, Premium, and Luxury setups.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}
        </main>
      </div>

      <main className="res-main-content res-bottom-content">




        <section className="res-testimonials">
          <div className="res-stars-bg"></div>
          <div className="res-stars-bg res-stars-bg-2"></div>
          <h2>What Our Guests Say</h2>
          <div className="res-test-marquee-container">
            <div className="res-test-marquee-track">
              {/* First Set */}
              {TESTIMONIALS.map((t, idx) => (
                <div key={`t1-${idx}`} className="res-test-card">
                  <div className="res-stars"><FaStar/><FaStar/><FaStar/><FaStar/><FaStar/></div>
                  <p>"{t.text}"</p>
                  <h4>- {t.name}</h4>
                </div>
              ))}
              {/* Second Set for seamless loop */}
              {TESTIMONIALS.map((t, idx) => (
                <div key={`t2-${idx}`} className="res-test-card">
                  <div className="res-stars"><FaStar/><FaStar/><FaStar/><FaStar/><FaStar/></div>
                  <p>"{t.text}"</p>
                  <h4>- {t.name}</h4>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="res-faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="res-faq-list">
            {FAQS.map((faq, index) => (
              <div key={index} className={`res-faq-item ${openFaq === index ? 'open' : ''}`} onClick={() => toggleFaq(index)}>
                <div className="res-faq-q">
                  <span>{faq.question}</span>
                  {openFaq === index ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                <div className="res-faq-a">
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="custom-builder-section" className="res-booking-section py-16 bg-[#121217] border-t border-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4">
            
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#ff4d2d] uppercase tracking-widest px-3 py-1 bg-[#ff4d2d]/10 rounded-full">Tailored Experience</span>
              <h2 className="text-3xl sm:text-4xl font-black mt-3">Custom Event Builder & Estimator</h2>
              <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
                Customize every single detail of your event—from themes and guest counts to custom menu tiers, drinks, and sound setups. Estimate your cost in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Form inputs */}
              <form onSubmit={handleCustomSubmit} className="lg:col-span-2 space-y-8 bg-[#18181f] p-6 sm:p-8 rounded-3xl border border-gray-900 shadow-xl">
                
                {/* Contact Section */}
                <div>
                  <h3 className="text-lg font-black text-gray-100 border-b border-gray-800 pb-2 mb-4">1. Contact & Time</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Full Name</label>
                      <input 
                        type="text" 
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        required
                        placeholder="Your Name"
                        className="bg-[#202028] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff4d2d] transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Phone Number</label>
                      <input 
                        type="tel" 
                        value={customPhone}
                        onChange={e => setCustomPhone(e.target.value)}
                        required
                        placeholder="E.g. +91 9876543210"
                        className="bg-[#202028] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff4d2d] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Event Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        required
                        className="bg-[#202028] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff4d2d] transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Event Vibe / Type</label>
                      <select
                        value={customEventType}
                        onChange={e => setCustomEventType(e.target.value)}
                        className="bg-[#202028] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff4d2d] transition-colors"
                      >
                        <option value="Birthday">Birthday Celebration</option>
                        <option value="Anniversary">Anniversary Celebration</option>
                        <option value="Custom Vibe">Custom/Other Event</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Event Details Section */}
                <div>
                  <h3 className="text-lg font-black text-gray-100 border-b border-gray-800 pb-2 mb-4">2. Guest Capacity & Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Number of Guests</label>
                      <input 
                        type="number" 
                        min="1"
                        max="1000"
                        value={customGuests}
                        onChange={e => setCustomGuests(Math.max(1, parseInt(e.target.value) || 0))}
                        required
                        className="bg-[#202028] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff4d2d] transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Select Event Theme</label>
                      <select
                        value={customTheme}
                        onChange={e => setCustomTheme(e.target.value)}
                        className="bg-[#202028] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff4d2d] transition-colors"
                      >
                        <option value="Classic Elegance">Classic Elegance Theme</option>
                        <option value="Neon Fantasy">Neon Glow Theme</option>
                        <option value="Kids Carnival">Kids Cartoon Carnival</option>
                        <option value="Romantic Candlelight">Romantic Candlelight Theme</option>
                        <option value="Royal Palace Vibe">Royal Palace Gold Theme</option>
                        <option value="Custom Bohemian">Bohemian Pastel Vibe</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Food & Beverage Tier */}
                <div>
                  <h3 className="text-lg font-black text-gray-100 border-b border-gray-800 pb-2 mb-4">3. Food & Drinks Customization</h3>
                  
                  {/* Food Tier */}
                  <div className="flex flex-col gap-2.5 mb-6">
                    <label className="text-xs font-bold text-gray-400">Catering Food Menu Tier</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { tier: 'Basic Menu', price: '₹500 / head', desc: '2 Starters, 2 Main, Bread Basket, 1 Dessert' },
                        { tier: 'Premium Buffet', price: '₹800 / head', desc: '4 Starters, 3 Main, Custom Cake, 2 Dessert' },
                        { tier: 'Luxury Buffet', price: '₹1200 / head', desc: 'Unlimited Multi-Cuisine Buffet (Indian, Italian, Chinese)' }
                      ].map((item) => (
                        <div 
                          key={item.tier}
                          onClick={() => setCustomFoodTier(item.tier)}
                          className={`p-4 rounded-xl border cursor-pointer text-left transition-all ${customFoodTier === item.tier ? 'bg-[#ff4d2d]/10 border-[#ff4d2d]' : 'bg-[#202028] border-gray-800 hover:border-gray-700'}`}
                        >
                          <h4 className="font-bold text-sm text-white">{item.tier}</h4>
                          <p className="text-xs text-[#ff4d2d] font-bold mt-0.5">{item.price}</p>
                          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Food Style Selection & Drinks Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Food Style Preference</label>
                      <div className="flex gap-2">
                        {['Veg', 'Non-Veg', 'Both'].map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setCustomFoodStyle(style)}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${customFoodStyle === style ? 'bg-white text-gray-900 border-white' : 'bg-[#202028] text-gray-400 border-gray-800 hover:border-gray-700'}`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Drinks Package Tier</label>
                      <select
                        value={customDrinksTier}
                        onChange={e => setCustomDrinksTier(e.target.value)}
                        className="bg-[#202028] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff4d2d] transition-colors"
                      >
                        <option value="Soft Drinks">Soft Drinks & Water (Included)</option>
                        <option value="Premium Mocktails">Premium Fresh Mocktails (+₹150/head)</option>
                        <option value="Unlimited Bar">Unlimited Mocktails & Shakes Bar (+₹300/head)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-4">
                    <label className="text-xs font-bold text-gray-400">Special Menu / Custom Food Choice (Optional)</label>
                    <textarea 
                      rows="3" 
                      value={customFoodChoice}
                      onChange={e => setCustomFoodChoice(e.target.value)}
                      placeholder="E.g., Gluten-free options, specific dessert replacements, custom food selection, etc."
                      className="bg-[#202028] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#ff4d2d] transition-colors"
                    />
                  </div>
                </div>

                {/* Entertainment & Upgrades */}
                <div>
                  <h3 className="text-lg font-black text-gray-100 border-b border-gray-800 pb-2 mb-4">4. Event Entertainment & Upgrades</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${addonPhoto ? 'bg-[#ff4d2d]/10 border-[#ff4d2d]' : 'bg-[#202028] border-gray-800 hover:border-gray-700'}`}>
                      <input 
                        type="checkbox" 
                        checked={addonPhoto} 
                        onChange={e => setAddonPhoto(e.target.checked)}
                        className="w-4 h-4 accent-[#ff4d2d]"
                      />
                      <div>
                        <h4 className="text-sm font-bold">Photography & Video</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">Professional event shoot (+₹5,000)</p>
                      </div>
                    </label>

                    <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${addonDeco ? 'bg-[#ff4d2d]/10 border-[#ff4d2d]' : 'bg-[#202028] border-gray-800 hover:border-gray-700'}`}>
                      <input 
                        type="checkbox" 
                        checked={addonDeco} 
                        onChange={e => setAddonDeco(e.target.checked)}
                        className="w-4 h-4 accent-[#ff4d2d]"
                      />
                      <div>
                        <h4 className="text-sm font-bold">Luxury Decor Upgrade</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">Heavy thematic floral/LED set (+₹10,000)</p>
                      </div>
                    </label>

                    <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${addonDJ ? 'bg-[#ff4d2d]/10 border-[#ff4d2d]' : 'bg-[#202028] border-gray-800 hover:border-gray-700'}`}>
                      <input 
                        type="checkbox" 
                        checked={addonDJ} 
                        onChange={e => setAddonDJ(e.target.checked)}
                        className="w-4 h-4 accent-[#ff4d2d]"
                      />
                      <div>
                        <h4 className="text-sm font-bold">Live DJ & Sound System</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">Dance floor lighting + DJ (+₹4,000)</p>
                      </div>
                    </label>

                    <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${addonLiveMusic ? 'bg-[#ff4d2d]/10 border-[#ff4d2d]' : 'bg-[#202028] border-gray-800 hover:border-gray-700'}`}>
                      <input 
                        type="checkbox" 
                        checked={addonLiveMusic} 
                        onChange={e => setAddonLiveMusic(e.target.checked)}
                        className="w-4 h-4 accent-[#ff4d2d]"
                      />
                      <div>
                        <h4 className="text-sm font-bold">Live Singer & Band</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">Acoustic set during dining (+₹12,000)</p>
                      </div>
                    </label>

                  </div>
                </div>

              </form>

              {/* Calculator Summary Card */}
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="bg-[#18181f] border border-gray-900 rounded-3xl p-6 shadow-xl relative overflow-hidden text-left">
                  
                  {/* Decorative background circle */}
                  <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-[#ff4d2d]/10 blur-xl pointer-events-none"></div>

                  <h3 className="text-lg font-black border-b border-gray-800 pb-3 mb-4 flex items-center gap-2">
                    📊 Cost Breakdown
                  </h3>

                  <div className="space-y-4 text-sm font-medium text-gray-300">
                    
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Catering Subtotal</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{customGuests} Guests x ₹{perHeadTotal}</p>
                      </div>
                      <span className="font-bold text-white">₹{foodDrinksTotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="h-px bg-gray-800/50 my-2"></div>

                    {/* Add-ons list */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Selected Add-ons</p>
                      <ul className="space-y-1.5 text-xs text-gray-400">
                        {addonPhoto && <li className="flex justify-between"><span>Photography & Video</span><span className="font-bold">₹5,000</span></li>}
                        {addonDeco && <li className="flex justify-between"><span>Luxury Decor</span><span className="font-bold">₹10,000</span></li>}
                        {addonDJ && <li className="flex justify-between"><span>Live DJ & Sound</span><span className="font-bold">₹4,000</span></li>}
                        {addonLiveMusic && <li className="flex justify-between"><span>Live Singer/Band</span><span className="font-bold">₹12,000</span></li>}
                        {!addonPhoto && !addonDeco && !addonDJ && !addonLiveMusic && <li className="italic text-gray-600">No add-ons selected</li>}
                      </ul>
                    </div>

                    <div className="h-px bg-gray-800/50 my-2"></div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-black text-gray-400 uppercase">Estimated Total</span>
                      <span className="text-2xl font-black text-[#ff4d2d]">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-800">
                    <button 
                      type="submit" 
                      onClick={handleCustomSubmit}
                      className="w-full py-3.5 bg-[#ff4d2d] hover:bg-[#e03c20] text-white font-bold rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 text-sm uppercase tracking-wider"
                    >
                      Request Custom Reservation
                    </button>
                    <p className="text-[10px] text-gray-500 text-center font-bold mt-3 leading-snug">
                      *Note: Estimates do not include GST. Final quotation will be sent by our event manager.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logoImg} alt="Prime Dine Logo" />
              <span>Prime Dine</span>
            </div>
            <p>Delivering premium gourmet experiences and unforgettable events right to your table.</p>
          </div>
          <div className="footer-links-group">
            <h4>Quick Links</h4>
            <ul>
              <li><a onClick={() => navigate('/')}>Home</a></li>
              <li><a onClick={() => navigate('/menu')}>Menu</a></li>
              <li><a className="active">Reservations</a></li>
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
              Email: events@primedine.com
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              Call: +91 85117 27429
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Prime Dine Events. All rights reserved.</p>
        </div>
      </footer>

      {bookingModalOpen && selectedPackageObj && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <form onSubmit={handleModalSubmit} className="bg-[#18181f] text-white w-full max-w-2xl rounded-3xl border border-gray-850 shadow-2xl overflow-hidden relative text-left flex flex-col max-h-[90vh]">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setBookingModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <FaTimes size={14} />
            </button>

            {/* Content Container (Scrollable) */}
            <div className="overflow-y-auto p-6 md:p-8 flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Side: Media & Title */}
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-gray-800">
                    <img 
                      src={selectedPackageObj.img} 
                      alt={selectedPackageObj.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-4">
                      <span className="text-xs font-black text-[#ff4d2d] uppercase tracking-widest bg-black/60 px-2.5 py-1 rounded-full self-start">
                        {activeTab === 'birthday' ? 'Birthday Package' : 'Anniversary Package'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedPackageObj.title}</h2>
                    <div className="flex justify-between items-center mt-2 bg-[#202028] p-3 rounded-xl border border-gray-800/50">
                      <span className="text-xs font-bold text-gray-400">Price Package</span>
                      <span className="text-base font-black text-[#ff4d2d]">{selectedPackageObj.price}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 bg-[#202028] p-3 rounded-xl border border-gray-800/50">
                      <span className="text-xs font-bold text-gray-400">Guest Capacity</span>
                      <span className="text-xs font-black text-white"><FaUserFriends className="inline mr-1" /> {selectedPackageObj.idealFor}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Inclusions, Food & Contact */}
                <div className="space-y-6">
                  {/* Includes List */}
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-2 mb-3">
                      Package Inclusions
                    </h4>
                    <ul className="grid grid-cols-1 gap-2 text-xs text-gray-300 font-medium">
                      {selectedPackageObj.includes.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <FaCheckCircle className="text-[#ff4d2d] text-sm shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Food Options */}
                  {selectedPackageObj.food && (
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-2 mb-3">
                        Food / Catering
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPackageObj.food.map((f, i) => (
                          <span key={i} className="bg-[#ff4d2d]/10 text-[#ff4d2d] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#ff4d2d]/20">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Features */}
                  {selectedPackageObj.special && (
                    <div className="bg-[#ff4d2d]/5 border border-[#ff4d2d]/25 rounded-2xl p-4">
                      <h4 className="text-xs font-black text-[#ff4d2d] uppercase tracking-widest mb-1.5">
                        {selectedPackageObj.special.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                        {selectedPackageObj.special.desc}
                      </p>
                    </div>
                  )}

                  {/* Required Phone & Date Inputs */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5 bg-[#202028] p-4 rounded-2xl border border-gray-800/80">
                      <label className="text-xs font-black text-gray-300 uppercase tracking-wider">
                        Contact Phone Number <span className="text-[#ff4d2d]">*</span>
                      </label>
                      <input 
                        type="tel"
                        value={modalPhone}
                        onChange={e => setModalPhone(e.target.value)}
                        placeholder="E.g. +91 9876543210"
                        required
                        className="bg-[#18181f] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff4d2d] transition-colors mt-1"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 bg-[#202028] p-4 rounded-2xl border border-gray-800/80">
                      <label className="text-xs font-black text-gray-300 uppercase tracking-wider">
                        Select Event Date <span className="text-[#ff4d2d]">*</span>
                      </label>
                      <input 
                        type="date"
                        value={modalDate}
                        onChange={e => setModalDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="bg-[#18181f] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff4d2d] transition-colors mt-1 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-[#121217] p-6 border-t border-gray-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="text-center sm:text-left mb-2 sm:mb-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Booking Account</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Confirm booking for <strong className="text-white">{userData?.fullName}</strong>.
                </p>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  type="button" 
                  onClick={() => setBookingModalOpen(false)}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-colors border border-gray-700 text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 sm:flex-none px-6 py-3 bg-[#ff4d2d] hover:bg-[#e03c20] text-white rounded-xl text-sm font-bold transition-colors shadow-md text-center animate-pulse"
                >
                  Confirm Booking
                </button>
              </div>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
