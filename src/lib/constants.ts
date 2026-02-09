export const STORAGE_KEYS = {
    DISMISSED_RESTORE_MODAL: 'dismissed_restore_modal'
} as const;

export const INTERVALS = {
    POLLING: 30_000,
    DEBOUNCE: 500,
    ONE_MINUTE: 60_000,
    SPINNER_DELAY: 250,
    ANIMATION_SHORT: 300,
    ANIMATION_MEDIUM: 1500,
    ANIMATION_LONG: 3000
} as const;

export const URGENCY_THRESHOLDS = {
    ONE_HOUR: 3_600_000,
    ONE_DAY: 86_400_000,
    TWO_DAYS: 172_800_000
} as const;

export const Z_INDEX = {
    SIDEBAR: 40,
    DROPDOWN: 50,
    OVERLAY: 100,
    MODAL: 150,
    TOAST: 200
} as const;

export const LIMITS = {
    MAX_INVITE_CODE_LENGTH: 6,
    MIN_PASSWORD_LENGTH: 6,
    MAX_UPLOAD_SIZE_MB: 10
} as const;

export const ROUTES = {
    ROOT: '/',
    LOGIN: '/login',
    RESET_PASSWORD: '/reset-password',
    WELCOME: '/welcome',
    DASHBOARD: '/dashboard',
    PROFILE_SETUP: '/profile-setup',
    PAIRING: '/pairing',
    CREATE_SPACE: '/create-space',
    RESTORE_SPACE: '/restore-space',
    JOIN_PARTNER: '/join-partner',
    JOURNAL: '/journal',
    MEMORIES: '/memories',
    GAMES: '/games',
    DATE_NIGHT: '/date-night',
    CALENDAR: '/calendar',
    SETTINGS: '/settings',
    STATS: '/stats',
    SEXPLORATION: '/sexploration',
    CHALLENGES: '/challenges'
} as const;
