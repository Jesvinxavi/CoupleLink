import { createContext, useContext, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFantasyBucketList } from '../hooks/useFantasyBucketList';
import { useSexploration } from '../hooks/useSexploration';
import { WalletOverlay } from '../components/sexploration/WalletOverlay';
import { PositionsOverlay } from '../components/sexploration/PositionsOverlay';
import { FantasyBucketListOverlay } from '../components/sexploration/FantasyBucketListOverlay';

interface SexplorationModalContextType {
    openWallet: () => void;
    openPositions: () => void;
    openFantasies: () => void;
}

const SexplorationModalContext = createContext<SexplorationModalContextType | null>(null);

export function useSexplorationModals() {
    const context = useContext(SexplorationModalContext);
    if (!context) {
        throw new Error('useSexplorationModals must be used within SexplorationModalProvider');
    }
    return context;
}

interface SexplorationModalProviderProps {
    children: ReactNode;
}

export function SexplorationModalProvider({ children }: SexplorationModalProviderProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Modal states
    const [showWallet, setShowWallet] = useState(false);
    const [showPositions, setShowPositions] = useState(false);
    const [showFantasies, setShowFantasies] = useState(false);

    // Data for modals
    const { isPositionCompleted, togglePositionComplete } = useSexploration();
    const {
        fantasies,
        pendingCount,
        approvedCount,
        completedCount,
        loading: fantasyLoading,
        addFantasy,
        approveFantasy,
        vetoFantasy,
        deleteFantasy,
        completeFantasy,
        isRequester
    } = useFantasyBucketList();

    // Open modal and navigate to sexploration
    const openWithNavigation = (openFn: () => void) => {
        openFn();
        // Navigate after modal opens (while backdrop is blurring)
        setTimeout(() => {
            if (location.pathname !== '/sexploration') {
                navigate('/sexploration', { replace: true });
            }
        }, 100);
    };

    const openWallet = () => openWithNavigation(() => setShowWallet(true));
    const openPositions = () => openWithNavigation(() => setShowPositions(true));
    const openFantasies = () => openWithNavigation(() => setShowFantasies(true));

    const handleWalletClose = () => setShowWallet(false);
    const handlePositionsClose = () => setShowPositions(false);
    const handleFantasiesClose = () => setShowFantasies(false);

    return (
        <SexplorationModalContext.Provider value={{ openWallet, openPositions, openFantasies }}>
            {children}

            {/* Global Modals - persist across page navigation */}
            <WalletOverlay
                isOpen={showWallet}
                onClose={handleWalletClose}
            />

            <PositionsOverlay
                isOpen={showPositions}
                onClose={handlePositionsClose}
                isPositionCompleted={isPositionCompleted}
                togglePositionComplete={togglePositionComplete}
            />

            <FantasyBucketListOverlay
                isOpen={showFantasies}
                onClose={handleFantasiesClose}
                fantasies={fantasies}
                pendingCount={pendingCount}
                approvedCount={approvedCount}
                completedCount={completedCount}
                loading={fantasyLoading}
                addFantasy={addFantasy}
                approveFantasy={approveFantasy}
                vetoFantasy={vetoFantasy}
                deleteFantasy={deleteFantasy}
                completeFantasy={completeFantasy}
                isRequester={isRequester}
            />
        </SexplorationModalContext.Provider>
    );
}











