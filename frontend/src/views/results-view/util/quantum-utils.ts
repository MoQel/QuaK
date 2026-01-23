export const getBarColor = (phase?: number) => {
    if (phase === undefined) return 'hsl(var(--chart-1))';
    const degrees = (phase * 180) / Math.PI;
    const degCalc = degrees < 0 ? degrees + 360 : degrees;
    return `hsl(${degCalc}, 70%, 60%)`;
};
