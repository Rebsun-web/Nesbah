// Internal lead-prioritization indicator.
//
// This is NOT a credit score, an affordability assessment, or an eligibility
// decision. It exists solely to order the lead queue for admins and financing
// partners. It must never be shown to an applicant, and no score, rating or
// eligibility message may appear anywhere in the applicant-facing flow.
//
// The formula is ported verbatim from the reference implementation on nesbah.net
// so both sites rank leads identically. Do not tune the weights locally — a
// change here silently reorders every partner's queue.
//
//   base                40
//   amount   >= 1M      +25   >= 500K  +18   >= 250K  +10   else +5
//   age      >= 5y      +20   >= 3y    +12   >= 1y    +6
//   has POS sales       +10
//   pre-revenue         -20
//   clamped to 0..100
//
// `lead_tier` is NOT computed here — a Postgres trigger derives it from the score
// (>=75 high, >=45 medium, else low) so that every write path agrees.

import { AMOUNT_RANGES, AGE_RANGES } from '@/lib/apply-options';

export function computeLeadScore({ amountCode, ageCode, hasPos, isPreRevenue }) {
    const amount = AMOUNT_RANGES[amountCode] ? AMOUNT_RANGES[amountCode].min : 0;
    const years = AGE_RANGES[ageCode] ? AGE_RANGES[ageCode].years : 0;

    let score = 40;

    if (amount >= 1000000) score += 25;
    else if (amount >= 500000) score += 18;
    else if (amount >= 250000) score += 10;
    else score += 5;

    if (years >= 5) score += 20;
    else if (years >= 3) score += 12;
    else if (years >= 1) score += 6;

    // Legacy rows and unanswered questions read as "unknown", not "no": the
    // existing own_pos_system column answered a slightly different question, so
    // only an explicit true earns the bonus.
    if (hasPos === true) score += 10;

    if (isPreRevenue === true) score -= 20;

    return Math.max(0, Math.min(100, score));
}

// Tier thresholds, mirrored from the DB trigger for read-only display use.
export function tierForScore(score) {
    if (score == null) return null;
    if (score >= 75) return 'high';
    if (score >= 45) return 'medium';
    return 'low';
}

export const TIER_LABELS = {
    high:   { ar: 'أولوية عالية',   en: 'High priority' },
    medium: { ar: 'أولوية متوسطة',  en: 'Medium priority' },
    low:    { ar: 'أولوية منخفضة',  en: 'Low priority' },
};

export const TIER_BADGE_CLASSES = {
    high:   'bg-emerald-100 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low:    'bg-slate-100 text-slate-700 border-slate-200',
};

export const SCORE_DISCLAIMER = {
    ar: 'مؤشر لترتيب الأولويات فقط — ليس تقييماً ائتمانياً أو تقييماً للملاءة المالية',
    en: 'Prioritization indicator only — not a credit or affordability assessment',
};
