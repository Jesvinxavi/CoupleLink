import { HashRouter as Router } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { CoupleProvider } from "@/context/CoupleContext"
import { SexplorationModalProvider } from "@/context/SexplorationModalContext"
import { ChallengeModalProvider } from "@/context/ChallengeModalContext"
import { GameSessionProvider } from "@/context/GameSessionContext"
import { FantasyBucketListProvider } from "@/context/FantasyBucketListContext"
import { CouponsProvider } from "@/context/CouponsContext"
import { JournalModalProvider } from "@/context/JournalModalContext"
import { PartnerNotesProvider } from "@/context/PartnerNotesContext"
import AnimatedRoutes from "@/components/AnimatedRoutes"
import { NotificationListener } from "@/components/NotificationListener"
import { GlobalCouponListener } from "@/components/GlobalCouponListener"
import { GlobalModalQueueProvider } from "@/context/GlobalModalQueueContext"

import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary"

function App() {
  return (
    <Router>
      <GlobalErrorBoundary>
        <AuthProvider>
          <CoupleProvider>
            <PartnerNotesProvider>
              <FantasyBucketListProvider>
                <CouponsProvider>
                  <GameSessionProvider>
                    <GlobalModalQueueProvider>
                      <SexplorationModalProvider>
                        <JournalModalProvider>
                          <ChallengeModalProvider>
                            <NotificationListener />
                            <GlobalCouponListener />
                            <AnimatedRoutes />
                          </ChallengeModalProvider>
                        </JournalModalProvider>
                      </SexplorationModalProvider>
                    </GlobalModalQueueProvider>
                  </GameSessionProvider>
                </CouponsProvider>
              </FantasyBucketListProvider>
            </PartnerNotesProvider>
          </CoupleProvider>
        </AuthProvider>
      </GlobalErrorBoundary>
    </Router>
  )
}

export default App
