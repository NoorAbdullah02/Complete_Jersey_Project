/**
 * ICE Jersey "Production AI" Sizer
 * Returns recommended jersey size based on user metrics
 */
export type FitPreference = 'slim' | 'regular' | 'loose';

export const recommendSize = (heightCm: number, weightKg: number, fit: FitPreference = 'regular'): string => {
    // Basic logic for athletic jerseys
    let baseSize = 'M';

    if (heightCm < 160) {
        if (weightKg < 55) baseSize = 'S';
        else baseSize = 'M';
    } else if (heightCm < 175) {
        if (weightKg < 65) baseSize = 'M';
        else if (weightKg < 80) baseSize = 'L';
        else baseSize = 'XL';
    } else if (heightCm < 185) {
        if (weightKg < 75) baseSize = 'L';
        else if (weightKg < 90) baseSize = 'XL';
        else baseSize = 'XXL';
    } else {
        if (weightKg < 85) baseSize = 'XL';
        else baseSize = 'XXL';
    }

    // Adjust for fit preference
    const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    let idx = sizes.indexOf(baseSize);

    if (fit === 'slim') idx = Math.max(0, idx - 1);
    if (fit === 'loose') idx = Math.min(sizes.length - 1, idx + 1);

    return sizes[idx];
};
