import { useCoupleContext } from '../context/CoupleContext';
import { useAuth } from '../context/AuthContext';

export const useCoupleData = () => {
    const { couple, partner, userProfile, loading, error, refreshCoupleData } = useCoupleContext();
    const { user: currentUser } = useAuth();

    return {
        couple,
        partner,
        userProfile,
        currentUser,
        loading,
        error,
        refreshCoupleData
    };
};
