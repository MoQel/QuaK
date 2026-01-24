export const getBarColor = (phase?: number) => {
    const baseHue = 220; // IDE blue

    if (phase === undefined) return `hsl(${baseHue} 80% 56%)`;

    // Zero phase tolerance directly in radians
    if (Math.abs(phase) < 0.002) {
        // ~0.1°
        return `hsl(${baseHue} 80% 56%)`;
    }

    const normalized = phase ?? 0; // −π … π
    const fraction = normalized / Math.PI; // −1 … 1
    const shiftedHue = (baseHue + fraction * 90 + 360) % 360;

    return `hsl(${shiftedHue} 75% 60%)`;
};
