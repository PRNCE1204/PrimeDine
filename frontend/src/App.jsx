import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import useGetCurrentUser from './hooks/useGetCurrentUser'
import { useDispatch, useSelector } from 'react-redux'
import Home from './pages/Home'
import useGetCity from './hooks/useGetCity'
import useGetMyShop from './hooks/useGetMyShop'
import CreateEditShop from './pages/CreateEditShop'
import AddItem from './pages/AddItem'
import EditItem from './pages/EditItem'
import useGetShopByCity from './hooks/useGetShopByCity'
import useGetItemsByCity from './hooks/useGetItemsByCity'
import CartPage from './pages/CartPage'
import CheckOut from './pages/CheckOut'
import OrderPlaced from './pages/OrderPlaced'
import MyOrders from './pages/MyOrders'
import useGetMyOrders from './hooks/useGetMyOrders'
import useUpdateLocation from './hooks/useUpdateLocation'
import Shop from './pages/Shop'
import NotFound from './pages/NotFound'
import GoogleCallback from './pages/GoogleCallback'
import LandingPage from './pages/LandingPage'
import MobileLayout from './components/MobileLayout'
import Menu from './pages/Menu'
import Reservations from './pages/Reservations'
import About from './pages/About'
import TablePinWidget from './components/user/TablePinWidget'


export const serverUrl = "http://localhost:8000"

function App() {
  const { userData } = useSelector(state => state.user)
  const dispatch = useDispatch()

  useGetCurrentUser()
  useUpdateLocation()
  useGetCity()
  useGetMyShop()
  useGetShopByCity()
  useGetItemsByCity()
  useGetMyOrders()

  useEffect(() => {
    // Other initializations can go here if needed in the future
  }, [userData?._id, dispatch])

  // Role-based redirect for already-authenticated users visiting auth pages
  const authRedirect = userData ? <Navigate to="/dashboard" /> : null

  return (
    <>
      <Routes>
        {/* Public Routes - redirect authenticated users to correct home */}
        <Route path='/signup' element={userData ? authRedirect : <SignUp />} />
        <Route path='/signin' element={userData ? authRedirect : <SignIn />} />
        <Route path='/forgot-password' element={userData ? authRedirect : <ForgotPassword />} />
        <Route path='/auth/callback' element={<GoogleCallback />} />
        <Route path='/menu' element={<Menu />} />
        <Route path='/reservations' element={<Reservations />} />
        <Route path='/about' element={<About />} />

        {/* Landing Page - public only; authenticated users go to their dashboard */}
        <Route path='/' element={userData ? <Navigate to="/dashboard" /> : <LandingPage />} />

        {/* Dashboard Route */}
        <Route path='/dashboard' element={!userData ? <Navigate to="/signin" /> : <Home />} />

        {/* Authenticated User Routes wrapped in MobileLayout */}
        {userData?.role === "customer" && (
          <Route element={<MobileLayout />}>
            <Route path='/cart' element={<CartPage />} />
            <Route path='/checkout' element={<CheckOut />} />
            <Route path='/order-placed' element={<OrderPlaced />} />
            <Route path='/my-orders' element={<MyOrders />} />
            <Route path='/shop/:shopId' element={<Shop />} />
          </Route>
        )}

        {/* Authenticated Admin/Cook Routes */}
        {(userData?.role === "admin" || userData?.role === "cook") && (
          <>
            <Route path='/create-edit-shop' element={<CreateEditShop />} />
            <Route path='/add-item' element={<AddItem />} />
            <Route path='/edit-item/:itemId' element={<EditItem />} />
            {/* MyOrders for owner is handled within OwnerDashboard now, but keeping route just in case */}
            <Route path='/my-orders' element={<Navigate to="/" />} />
          </>
        )}

        {/* Catch All */}
        <Route path='*' element={<NotFound />} />
      </Routes>
      <TablePinWidget />
    </>
  )
}

export default App
