// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { HashRouter as Router } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { CoupleProvider } from "@/context/CoupleContext"
import { SexplorationModalProvider } from "@/context/SexplorationModalContext"
import { ChallengeModalProvider } from "@/context/ChallengeModalContext"
import { ChallengeProvider } from "@/context/ChallengeContext"
import { GameSessionProvider } from "@/context/GameSessionContext"
import { FantasyBucketListProvider } from "@/context/FantasyBucketListContext"
import { CouponsProvider } from "@/context/CouponsContext"
import { JournalModalProvider } from "@/context/JournalModalContext"
import { PartnerNotesProvider } from "@/context/PartnerNotesContext"
import { JournalProvider } from "@/context/JournalContext"
import { CalendarProvider } from "@/context/CalendarContext"
import AnimatedRoutes from "@/components/AnimatedRoutes"
import { NotificationListener } from "@/components/NotificationListener"
import { GlobalCouponListener } from "@/components/GlobalCouponListener"
import { GlobalModalQueueProvider } from "@/context/GlobalModalQueueContext"
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary"
import { DebugConsole } from "@/components/debug/DebugConsole"

import { DeveloperProvider } from "@/context/DeveloperContext"

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
// Provider order notes:
// - AuthProvider must wrap everything to provide user state.
// - DeveloperProvider depends on auth state for debug flags.
// - CoupleProvider depends on auth state and provides couple context.
// - PartnerNotes/Journal/Calendar/Fantasy/Coupons/Game contexts depend on couple data.
// - GlobalModalQueue must wrap modal providers to coordinate overlays.
// - Modal providers depend on their respective data contexts above.
// - Global listeners (notifications/coupons) must be inside providers.
// - AnimatedRoutes must be last to render with all providers available.
function App() {
  return (
    <Router>
      <GlobalErrorBoundary>
        <AuthProvider>
          <DeveloperProvider>
            <CoupleProvider>
              <PartnerNotesProvider>
                <JournalProvider>
                  <CalendarProvider>
                    <FantasyBucketListProvider>
                      <CouponsProvider>
                        <GameSessionProvider>
                          <GlobalModalQueueProvider>
                            <SexplorationModalProvider>
                              <JournalModalProvider>
                                <ChallengeProvider>
                                  <ChallengeModalProvider>
                                    <NotificationListener />
                                    {/* PERMANENT DEV TOOL - DO NOT DELETE - Mobile debug console for development */}
                                    <DebugConsole />
                                    <GlobalCouponListener />
                                    <AnimatedRoutes />
                                  </ChallengeModalProvider>
                                </ChallengeProvider>
                              </JournalModalProvider>
                            </SexplorationModalProvider>
                          </GlobalModalQueueProvider>
                        </GameSessionProvider>
                      </CouponsProvider>
                    </FantasyBucketListProvider>
                  </CalendarProvider>
                </JournalProvider>
              </PartnerNotesProvider>
            </CoupleProvider>
          </DeveloperProvider>
        </AuthProvider>
      </GlobalErrorBoundary>
    </Router>
  )
}

export default App
