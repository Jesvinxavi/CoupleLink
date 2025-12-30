import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"

import { useAuth } from "@/context/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { PageTransition } from "@/components/PageTransition"
import Login from "@/pages/Login"
import ResetPassword from "@/pages/ResetPassword"
import Dashboard from "@/pages/Dashboard"
import ProfileSetup from "@/pages/ProfileSetup"
import PairingLanding from "@/pages/PairingLanding"
import CreateSpace from "@/pages/CreateSpace"
import JoinPartner from "@/pages/JoinPartner"
import RestoreSpace from "@/pages/RestoreSpace"
import JournalPage from "@/pages/Journal"
import MemoriesPage from "@/pages/Memories"
import GamesPage from "@/pages/Games"
import DateNightPage from "@/pages/DateNight"
import CalendarPage from "@/pages/Calendar"
import Settings from "@/pages/Settings"
import Welcome from "@/pages/Welcome"
import StatsPage from "@/pages/Stats"
import SexplorationPage from "@/pages/Sexploration"
import ChallengesPage from "@/pages/Challenges"
import { useCoupleData } from "@/hooks/useCoupleData"

function RootRedirect() {
    const { userProfile, loading } = useCoupleData()
    const { isRecovery } = useAuth()



    if (loading || !userProfile) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF5F5]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#EA2831] border-t-transparent shadow-lg"></div>
                <p className="mt-4 text-body-soft animate-pulse">Loading your space...</p>
            </div>
        )
    }

    // Check for password recovery flow using persisted state
    if (isRecovery) {
        return <Navigate to="/reset-password" replace />
    }

    // Fallback check for hash just in case Context hasn't updated yet
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
        return <Navigate to="/reset-password" replace />
    }

    if (!userProfile?.first_name || !userProfile?.birth_date) {
        return <Navigate to="/welcome" replace />
    }

    if (!userProfile?.couple_id) {
        return <Navigate to="/dashboard" replace />
    }


    return <Navigate to="/dashboard" replace />
}

import { useStreak } from "@/hooks/useStreak"
import { TokenEarnedModal } from "@/components/dashboard/TokenEarnedModal"

export default function AnimatedRoutes() {
    const location = useLocation();
    const { showTokenModal, handleCloseTokenModal } = useStreak();



    return (
        <>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={
                        <PageTransition>
                            <Login />
                        </PageTransition>
                    } />

                    <Route path="/reset-password" element={
                        <PageTransition>
                            <ResetPassword />
                        </PageTransition>
                    } />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<RootRedirect />} />
                        <Route path="/welcome" element={
                            <PageTransition>
                                <Welcome />
                            </PageTransition>
                        } />
                        <Route path="/dashboard" element={
                            <PageTransition>
                                <Dashboard />
                            </PageTransition>
                        } />
                        <Route path="/profile-setup" element={
                            <PageTransition>
                                <ProfileSetup />
                            </PageTransition>
                        } />
                        <Route path="/pairing" element={
                            <PageTransition>
                                <PairingLanding />
                            </PageTransition>
                        } />
                        <Route path="/create-space" element={
                            <PageTransition>
                                <CreateSpace />
                            </PageTransition>
                        } />
                        <Route path="/restore-space" element={
                            <PageTransition>
                                <RestoreSpace />
                            </PageTransition>
                        } />
                        <Route path="/join-partner" element={
                            <PageTransition>
                                <JoinPartner />
                            </PageTransition>
                        } />
                        <Route path="/journal" element={
                            <PageTransition>
                                <JournalPage />
                            </PageTransition>
                        } />
                        <Route path="/memories" element={
                            <PageTransition>
                                <MemoriesPage />
                            </PageTransition>
                        } />
                        <Route path="/games" element={
                            <PageTransition>
                                <GamesPage />
                            </PageTransition>
                        } />
                        <Route path="/date-night" element={
                            <PageTransition>
                                <DateNightPage />
                            </PageTransition>
                        } />
                        <Route path="/calendar" element={
                            <PageTransition>
                                <CalendarPage />
                            </PageTransition>
                        } />
                        <Route path="/settings" element={
                            <PageTransition>
                                <Settings />
                            </PageTransition>
                        } />
                        <Route path="/stats" element={
                            <PageTransition>
                                <StatsPage />
                            </PageTransition>
                        } />
                        <Route path="/sexploration" element={
                            <PageTransition>
                                <SexplorationPage />
                            </PageTransition>
                        } />
                        <Route path="/challenges" element={
                            <PageTransition>
                                <ChallengesPage />
                            </PageTransition>
                        } />
                    </Route>
                </Routes>
            </AnimatePresence>

            <TokenEarnedModal
                isOpen={showTokenModal}
                onClose={handleCloseTokenModal}
            />
        </>
    )
}
