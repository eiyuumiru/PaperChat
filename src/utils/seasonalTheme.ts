/**
 * Seasonal Theme Utilities
 * Helper functions to determine which seasonal theme should be displayed
 */

/**
 * Check if current date is within Christmas season (December only)
 * @returns true if in December, false otherwise
 */
export function isHolidaySeason(): boolean {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed: 0 = January, 11 = December

    // Only December (month 11)
    return month === 11;
}

/**
 * Check if current date is within Tet season (January - April)
 * @returns true if in January, February, March or April, false otherwise
 */
export function isTetSeason(): boolean {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed: 0 = January, 3 = April

    // January (0), February (1), March (2), April (3)
    return month >= 0 && month <= 3;
}

/**
 * Get current seasonal theme type
 * Can be extended in the future for other themes (Valentine's, Easter, etc.)
 */
export type SeasonalTheme = 'christmas' | 'tet' | 'none';

export function getCurrentSeasonalTheme(): SeasonalTheme {
    if (isHolidaySeason()) {
        return 'christmas';
    }
    if (isTetSeason()) {
        return 'tet';
    }
    return 'none';
}
