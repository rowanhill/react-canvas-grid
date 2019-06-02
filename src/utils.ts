export function numberBetween(num: number, min: number, max: number) {
    return Math.max(Math.min(num, max), min);
}
