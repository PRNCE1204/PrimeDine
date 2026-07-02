import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/user/UserDashboard'
import OwnerDashboard from '../components/owner/OwnerDashboard'
import CookDashboard from '../components/cook/CookDashboard'
import MobileLayout from '../components/MobileLayout'
import { Navigate } from 'react-router-dom'
import LandingPage from './LandingPage'

function Home() {
    const { userData } = useSelector(state => state.user)

    if (!userData) return <Navigate to="/signin" />

    if (userData.role === "customer") {
        return <LandingPage />
    }
    if (userData.role === "admin")    return <OwnerDashboard />
    if (userData.role === "cook")     return <CookDashboard />

    // Fallback: unknown role — send to landing page
    return <Navigate to="/" />
}

export default Home
