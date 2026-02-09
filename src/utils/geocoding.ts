import { logger } from '@/lib/logger';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export interface GeocodingResult {
    country: string | null;
    displayName: string;
    lat: string;
    lon: string;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Resolves a location string to a country using OpenStreetMap (Nominatim).
 * @param location The unstructured location text (e.g. "Paris", "Central Park, NYC")
 * @returns GeocodingResult or null if not found/error
 */
export async function resolveCountry(location: string): Promise<GeocodingResult | null> {
    if (!location || !location.trim()) return null;

    try {
        const params = new URLSearchParams({
            q: location,
            format: 'json',
            addressdetails: '1',
            limit: '1'
        });

        // Nominatim requires a User-Agent identifying the application
        const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
            headers: {
                'User-Agent': 'CoupleLink-Web/1.0'
            }
        });

        if (!response.ok) {
            logger.warn('geocoding', 'Geocoding failed', response.statusText);
            return null;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const firstMatch = data[0];
            return {
                country: firstMatch.address?.country || null,
                displayName: firstMatch.display_name,
                lat: firstMatch.lat,
                lon: firstMatch.lon
            };
        }

        return null;
    } catch (error) {
        logger.error('geocoding', 'Error resolving country', error);
        return null;
    }
}

/**
 * Maps a country name to its continent using a static mapping.
 * @param country The country name
 * @returns The continent name (e.g. "Europe", "Asia") or "Other"
 */
// ═══════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════
export function getContinent(country: string): string {
    if (!country) return 'Other';
    const c = country.toLowerCase().trim();

    // Mapping of common countries to continents
    const mapping: Record<string, string> = {
        // Europe
        'united kingdom': 'Europe', 'uk': 'Europe', 'england': 'Europe', 'scotland': 'Europe', 'wales': 'Europe',
        'france': 'Europe', 'germany': 'Europe', 'italy': 'Europe', 'spain': 'Europe', 'portugal': 'Europe',
        'netherlands': 'Europe', 'belgium': 'Europe', 'switzerland': 'Europe', 'austria': 'Europe',
        'greece': 'Europe', 'sweden': 'Europe', 'norway': 'Europe', 'denmark': 'Europe', 'finland': 'Europe',
        'ireland': 'Europe', 'poland': 'Europe', 'czech republic': 'Europe', 'hungary': 'Europe', 'croatia': 'Europe',

        // North America
        'united states': 'North America', 'usa': 'North America', 'canada': 'North America', 'mexico': 'North America',

        // Asia
        'china': 'Asia', 'japan': 'Asia', 'india': 'Asia', 'thailand': 'Asia', 'vietnam': 'Asia',
        'indonesia': 'Asia', 'malaysia': 'Asia', 'singapore': 'Asia', 'philippines': 'Asia', 'south korea': 'Asia',
        'united arab emirates': 'Asia', 'dubai': 'Asia', 'turkey': 'Asia', 'israel': 'Asia',

        // Oceania
        'australia': 'Oceania', 'new zealand': 'Oceania', 'fiji': 'Oceania',

        // South America
        'brazil': 'South America', 'argentina': 'South America', 'chile': 'South America', 'colombia': 'South America', 'peru': 'South America',

        // Africa
        'south africa': 'Africa', 'egypt': 'Africa', 'morocco': 'Africa', 'nigeria': 'Africa', 'kenya': 'Africa', 'tanzania': 'Africa'
    };

    return mapping[c] || 'Other';
}
