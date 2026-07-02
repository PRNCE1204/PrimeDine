import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import axios from 'axios';
import { serverUrl } from '../App';
import toast from 'react-hot-toast';
import { FaUtensils, FaBirthdayCake, FaMobileAlt, FaConciergeBell, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import './About.css';

// Using existing assets from the project
import logoImg from '../assets/FoodZone.png';
import heroImg from '../assets/why_choose_us_bg.png';
import storyImg from '../assets/features_background.png';
import imgIndian from '../assets/lamb-curry.png';
import imgChinese from '../assets/spicy-chicken.png';
import imgItalian from '../assets/side-dish-1.png';
import imgMexican from '../assets/beef-steak.png';
import imgThai from '../assets/side-dish-2.png';
import imgDessert from '../assets/offer_mocktails.png';
import wavesBg from '../assets/abstract_waves_bg.png';

const STATS_DATA = [
  { label: 'Happy Customers', value: 5000, suffix: '+' },
  { label: 'Orders Served', value: 10000, suffix: '+' },
  { label: 'Signature Dishes', value: 50, suffix: '+' },
  { label: 'Customer Rating', value: 4.8, suffix: '★', isFloat: true },
];

const TEAM_DATA = [
  { role: 'Expert Chefs', desc: 'Passionate culinary experts.', icon: '👨‍🍳' },
  { role: 'Service Team', desc: 'Dedicated hospitality professionals.', icon: '🤝' },
  { role: 'Event Planners', desc: 'Helping create memorable celebrations.', icon: '🎉' },
];

const TESTIMONIALS = [
  { rating: 5, text: "Excellent food and amazing service.", author: "Rahul M." },
  { rating: 5, text: "Perfect place for birthday celebrations.", author: "Priya S." },
  { rating: 5, text: "One of the best dining experiences.", author: "Amit K." },
];

function About() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);
  const [showInfo, setShowInfo] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

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
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-root">
      
      {/* NAVIGATION */}
      <nav className="landing-nav" style={{ position: 'fixed', top: 0, zIndex: 100, width: '100%' }}>
        <div className="landing-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logoImg} alt="Food Zone Logo" />
          <span>Prime Dine</span>
        </div>
        <ul className="landing-links">
          <li><a onClick={() => navigate('/')}>Home</a></li>
          <li><a onClick={() => navigate('/menu')}>Menu</a></li>
          <li><a onClick={() => navigate('/reservations')}>Reservations</a></li>
          <li><a className="active">About Us</a></li>
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

      {/* 1. HERO SECTION */}
      <header className="about-hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url(${heroImg})` }}>
        <div className="about-hero-content fade-in-up">
          <h1>More Than Just Food,<br/><span className="highlight-text">We Create Memorable Experiences</span></h1>
          <p>At Prime Dine, we believe every meal should be special. From delicious cuisines to unforgettable celebrations, we bring families, friends, and loved ones together through exceptional dining experiences.</p>
        </div>
      </header>

      {/* 2. OUR STORY */}
      <section className="about-story-section">
        <div className="about-container">
          <div className="about-story-grid">
            <div className="about-story-text slide-in-left">
              <h2 className="section-title text-left">Our Journey</h2>
              <h3 className="story-subtitle">Crafting Culinary Magic Since Day One</h3>
              <p className="drop-cap"><strong>Prime Dine</strong> started with a simple vision: to serve high-quality food while creating memorable moments for every guest.</p>
              <p>Over the years, we have grown into a destination where people celebrate birthdays, anniversaries, family gatherings, and special occasions while enjoying delicious food from around the world.</p>
              <div className="story-signature">The Prime Dine Family</div>
            </div>
            <div className="about-story-image slide-in-right">
              <div className="story-img-wrapper">
                <img src={storyImg} alt="Our Journey" />
                <div className="about-story-logo">
                  <img src={logoImg} alt="Prime Dine Logo" />
                </div>
              </div>
              <div className="img-backdrop"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHAT WE OFFER */}
      <section className="about-offer-section" style={{ backgroundImage: `url(${wavesBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="about-container">
          <h2 className="section-title text-center">What We Offer</h2>
          <div className="about-cards-grid">
            
            <div className="botanical-card hover-lift">
              <div className="botanical-bg"></div>
              <div className="botanical-ribbon">🎀</div>
              <div className="botanical-inner">
                <div className="card-icon"><FaUtensils /></div>
                <h3>Multi-Cuisine Dining</h3>
                <p>Indian, Chinese, Thai, Italian, and Mexican delicacies.</p>
              </div>
              <div className="botanical-flowers">🌿🌸🌿</div>
            </div>

            <div className="botanical-card hover-lift">
              <div className="botanical-bg"></div>
              <div className="botanical-ribbon">🎀</div>
              <div className="botanical-inner">
                <div className="card-icon"><FaBirthdayCake /></div>
                <h3>Event Celebrations</h3>
                <p>Birthday parties, anniversaries, family gatherings, and corporate events.</p>
              </div>
              <div className="botanical-flowers">🌿🌼🌿</div>
            </div>

            <div className="botanical-card hover-lift">
              <div className="botanical-bg"></div>
              <div className="botanical-ribbon">🎀</div>
              <div className="botanical-inner">
                <div className="card-icon"><FaMobileAlt /></div>
                <h3>Smart Ordering</h3>
                <p>Order directly from your mobile with live order tracking.</p>
              </div>
              <div className="botanical-flowers">🌿🍃🌿</div>
            </div>

            <div className="botanical-card hover-lift">
              <div className="botanical-bg"></div>
              <div className="botanical-ribbon">🎀</div>
              <div className="botanical-inner">
                <div className="card-icon"><FaConciergeBell /></div>
                <h3>Premium Service</h3>
                <p>Dedicated staff ensuring an exceptional dining experience.</p>
              </div>
              <div className="botanical-flowers">🌿🌺🌿</div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. OUR SPECIALTIES */}
      <section className="about-specialties-section">
        <div className="about-container">
          <h2 className="section-title text-center">Our Specialties</h2>
          <p className="specialties-subtitle">A world of flavours — crafted with passion, served with pride</p>

          {/* Row 1: One large hero card + two stacked cards */}
          <div className="sp-row sp-row-1">
            <div className="sp-hero-card" style={{backgroundImage: `url(${imgIndian})`}}>
              <div className="sp-overlay">
                <span className="sp-tag">Signature</span>
                <h3>Indian Cuisine</h3>
                <p>Rich curries, tandoori delights & aromatic biryanis</p>
              </div>
            </div>
            <div className="sp-side-stack">
              <div className="sp-side-card" style={{backgroundImage: `url(${imgChinese})`}}>
                <div className="sp-overlay">
                  <h3>Chinese Cuisine</h3>
                  <p>Dim sum, noodles & wok-fired specialties</p>
                </div>
              </div>
              <div className="sp-side-card" style={{backgroundImage: `url(${imgThai})`}}>
                <div className="sp-overlay">
                  <h3>Thai Cuisine</h3>
                  <p>Bold flavors, fresh herbs & exotic spices</p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Three equal cards */}
          <div className="sp-row sp-row-2">
            <div className="sp-equal-card" style={{backgroundImage: `url(${imgMexican})`}}>
              <div className="sp-overlay">
                <h3>Mexican Cuisine</h3>
                <p>Tacos, burritos & nachos</p>
              </div>
            </div>
            <div className="sp-equal-card" style={{backgroundImage: `url(${imgItalian})`}}>
              <div className="sp-overlay">
                <h3>Italian Cuisine</h3>
                <p>Pasta, pizza & risotto</p>
              </div>
            </div>
            <div className="sp-equal-card" style={{backgroundImage: `url(${imgDessert})`}}>
              <div className="sp-overlay">
                <span className="sp-tag">New</span>
                <h3>Desserts & Beverages</h3>
                <p>Premium mocktails & artisan desserts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT & VALUES REDESIGNED */}
      <section className="impact-values-section" ref={statsRef}>
        <div className="about-container">
          <h2 className="section-title text-center">Purpose & Impact</h2>
          <div className="iv-grid" style={{ marginTop: '40px' }}>
            
            {/* Left: Values (Vision & Mission) */}
            <div className="iv-values slide-in-left">
              <div className="iv-mission-vision">
                <div className="iv-card">
                  <div className="iv-card-glow"></div>
                  <h3>Our Vision</h3>
                  <p>To become the most loved dining and celebration destination by combining great food, technology, and unforgettable experiences.</p>
                </div>
                <div className="iv-card">
                  <div className="iv-card-glow"></div>
                  <h3>Our Mission</h3>
                  <p>To deliver exceptional food, seamless service, and memorable celebrations through innovation and hospitality.</p>
                </div>
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="iv-stats slide-in-right">
              {STATS_DATA.map((stat, i) => (
                <div className="iv-stat-box" key={i}>
                  <div className="iv-stat-value">
                    {statsVisible ? <AnimatedNumber value={stat.value} isFloat={stat.isFloat} /> : '0'}
                    <span className="iv-stat-suffix">{stat.suffix}</span>
                  </div>
                  <div className="iv-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* 10. VISITING CARD SECTION */}
      <section className="visiting-card-section">
        <div className="about-container">
          <div className="vc-wrapper slide-in-up">
            <div className="vc-card">
              <div className="vc-front">
                <div className="vc-logo">
                  <img src={logoImg} alt="Prime Dine Logo" />
                  <h2>Prime Dine</h2>
                </div>
                <div className="vc-divider"></div>
                <h3 className="vc-tagline">Premium Dining & Celebrations</h3>
              </div>
              <div className="vc-back">
                <div className="vc-details">
                  <div className="vc-item">
                    <FaMapMarkerAlt className="vc-icon" />
                    <span>123 Culinary Avenue, Food City, FC 45678</span>
                  </div>
                  <div className="vc-item">
                    <FaPhoneAlt className="vc-icon" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="vc-item">
                    <FaEnvelope className="vc-icon" />
                    <span>reservations@primedine.com</span>
                  </div>
                </div>
                <div className="vc-socials">
                  <span className="vc-website">www.primedine.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// Simple Animated Number component
const AnimatedNumber = ({ value, isFloat }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16); // 60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{isFloat ? count.toFixed(1) : Math.floor(count)}</span>;
};

export default About;
