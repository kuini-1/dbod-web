const FEQ_MIN = 1;
const FEQ_MAX = 10;

/**
 * Maps admin `feq` (1 = rarest … 10 = most common) to the weight used for
 * weighted random rolls and chance % display. Quadratic curve steepens the
 * gap between low and high feq vs linear feq.
 */
export function slotMachineEffectiveWeight(feq: number): number {
    const f = Math.floor(Number(feq));
    if (!Number.isFinite(f)) return FEQ_MIN * FEQ_MIN;
    const clamped = Math.max(FEQ_MIN, Math.min(FEQ_MAX, f));
    return clamped * clamped;
}
