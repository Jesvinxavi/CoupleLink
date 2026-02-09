// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { PageTransition } from "@/components/PageTransition"
import { TokenEarnedModal } from "@/components/dashboard/TokenEarnedModal"
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
import { useStreak } from "@/hooks/useStreak"
import { ROUTES } from "@/lib/constants"
import logo from "@/assets/logo.png"

// ═══════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════
function RootRedirect() {
    const { userProfile, loading } = useCoupleData()
    const { isRecovery } = useAuth()



    if (loading || !userProfile) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF5F5]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    <div className="flex items-center gap-3 mb-10">
                        <img src={logo} alt="CoupleLink Logo" className="h-12 w-12 object-contain" />
                        <h1 className="text-4xl font-bold text-heading-dark">Couple<span className="text-[#EA2831]">Link</span></h1>
                    </div>
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EA2831] border-t-transparent shadow-md"></div>
                    <p className="mt-6 text-body-soft font-medium animate-pulse">Loading your space...</p>
                </motion.div>
            </div>
        )
    }

    // Check for password recovery flow using persisted state
    if (isRecovery) {
        return <Navigate to={ROUTES.RESET_PASSWORD} replace />
    }

    // Fallback check for hash just in case Context hasn't updated yet
    if (window.location.hash && window.location.hash.includes("type=recovery")) {
        return <Navigate to={ROUTES.RESET_PASSWORD} replace />
    }

    if (!userProfile?.first_name || !userProfile?.birth_date) {
        return <Navigate to={ROUTES.WELCOME} replace />
    }

    if (!userProfile?.couple_id) {
        return <Navigate to={ROUTES.DASHBOARD} replace />
    }


    return <Navigate to={ROUTES.DASHBOARD} replace />
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export default function AnimatedRoutes() {
    const location = useLocation()
    const { showTokenModal, handleCloseTokenModal } = useStreak()



    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path={ROUTES.LOGIN} element={
                        <PageTransition>
                            <Login />
                        </PageTransition>
                    } />

                    <Route path={ROUTES.RESET_PASSWORD} element={
                        <PageTransition>
                            <ResetPassword />
                        </PageTransition>
                    } />

                    <Route element={<ProtectedRoute />}>
                        <Route path={ROUTES.ROOT} element={<RootRedirect />} />
                        <Route path={ROUTES.WELCOME} element={
                            <PageTransition>
                                <Welcome />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.DASHBOARD} element={
                            <PageTransition>
                                <Dashboard />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.PROFILE_SETUP} element={
                            <PageTransition>
                                <ProfileSetup />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.PAIRING} element={
                            <PageTransition>
                                <PairingLanding />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.CREATE_SPACE} element={
                            <PageTransition>
                                <CreateSpace />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.RESTORE_SPACE} element={
                            <PageTransition>
                                <RestoreSpace />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.JOIN_PARTNER} element={
                            <PageTransition>
                                <JoinPartner />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.JOURNAL} element={
                            <PageTransition>
                                <JournalPage />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.MEMORIES} element={
                            <PageTransition>
                                <MemoriesPage />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.GAMES} element={
                            <PageTransition>
                                <GamesPage />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.DATE_NIGHT} element={
                            <PageTransition>
                                <DateNightPage />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.CALENDAR} element={
                            <PageTransition>
                                <CalendarPage />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.SETTINGS} element={
                            <PageTransition>
                                <Settings />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.STATS} element={
                            <PageTransition>
                                <StatsPage />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.SEXPLORATION} element={
                            <PageTransition>
                                <SexplorationPage />
                            </PageTransition>
                        } />
                        <Route path={ROUTES.CHALLENGES} element={
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
