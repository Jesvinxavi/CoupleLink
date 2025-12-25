/**
 * Auth Configuration
 * 
 * Set VITE_AUTH_TESTING_MODE=true in your .env file to:
 * - Disable password requirements (users can sign in with just email)
 * - Skip email verification for new users
 * 
 * In production, set VITE_AUTH_TESTING_MODE=false or remove it entirely
 */

export const authConfig = {
    // When true: skip password & email verification (for testing)
    // When false: require password & email verification (for production)
    isTestingMode: import.meta.env.VITE_AUTH_TESTING_MODE === 'true',
    
    // Minimum password length (only enforced when not in testing mode)
    minPasswordLength: 6,
}

export const getAuthConfig = () => authConfig











