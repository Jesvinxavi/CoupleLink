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
import { ConsoleLogger } from "@/components/debug/ConsoleLogger"

function App() {
  return (
    <Router>
      <GlobalErrorBoundary>
        <AuthProvider>
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
                                  <ConsoleLogger />
                                  <NotificationListener />
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
        </AuthProvider>
      </GlobalErrorBoundary>
    </Router>
  )
}

export default App
