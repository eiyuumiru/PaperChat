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
 * Get current seasonal theme type
 * Can be extended in the future for other themes (Valentine's, Easter, etc.)
 */
export type SeasonalTheme = 'christmas' | 'tet' | 'none';

export function getCurrentSeasonalTheme(): SeasonalTheme {
    if (!isHolidaySeason()) {
        return 'none';
    }

    // For now, return 'christmas' during the holiday season
    // This can be changed to 'tet' for Vietnamese New Year theme
    return 'christmas';
}
