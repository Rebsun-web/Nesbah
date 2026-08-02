// Stable option codes shared by the public application form, the admin portal
// and the API. The UI shows localized labels; the database stores codes.
//
// Ported from the authoritative reference implementation (nesbah.net). The client
// spec is explicit that where the two disagree, nesbah.net wins — so the code
// vocabularies and the amount/age/revenue bucket boundaries below are copied
// verbatim and must not be "improved" locally. Changing a code is a data
// migration, not an edit.

export const CONSENT_VERSION = '2026-07-10';

// ─── Financing types ────────────────────────────────────────────────────────
// 'general' ("أخرى") existed in an earlier version of this form and still exists
// on historical rows. It is deliberately absent here: the form no longer offers
// it, and LEGACY_FINANCING_TYPES keeps it renderable in admin/partner views.
export const FINANCING_TYPES = {
    corporate:              { ar: 'تمويل الشركات',            en: 'Corporate Financing' },
    working_capital:        { ar: 'تمويل رأس المال العامل',   en: 'Working Capital' },
    expansion:              { ar: 'تمويل التوسع والنمو',      en: 'Growth & Expansion' },
    equipment:              { ar: 'تمويل المعدات والأجهزة',   en: 'Equipment Financing' },
    project:                { ar: 'تمويل المشاريع',           en: 'Project Financing' },
    commercial_real_estate: { ar: 'التمويل العقاري التجاري',  en: 'Commercial Real Estate' },
    pos:                    { ar: 'تمويل نقاط البيع',         en: 'POS Financing' },
};

export const FINANCING_ORDER = [
    'corporate',
    'working_capital',
    'expansion',
    'equipment',
    'project',
    'commercial_real_estate',
    'pos',
];

// Retired codes, kept so historical rows still render a real label.
export const LEGACY_FINANCING_TYPES = {
    general: { ar: 'أخرى', en: 'Other' },
};

// Public product pages already indexed in Google Search Console. The slugs must
// not change when the internal codes do.
export const FINANCING_SLUGS = {
    corporate:              '/business-financing',
    working_capital:        '/working-capital-financing',
    expansion:              '/expansion-financing',
    equipment:              '/equipment-financing',
    project:                '/project-financing',
    commercial_real_estate: '/real-estate-project-financing',
    pos:                    '/pos-financing',
};

// ─── Requested amount ───────────────────────────────────────────────────────
// `min` feeds the lead-prioritization indicator; the UI never renders it.
export const AMOUNT_RANGES = {
    lt_250k:      { ar: 'أقل من ٢٥٠ ألف ريال',        en: 'Less than SAR 250K', min: 0,         max: 250000 },
    '250k_500k':  { ar: '٢٥٠ - ٥٠٠ ألف ريال',         en: 'SAR 250K – 500K',    min: 250000,    max: 500000 },
    '500k_1m':    { ar: '٥٠٠ ألف - ١ مليون ريال',     en: 'SAR 500K – 1M',      min: 500000,    max: 1000000 },
    gt_1m:        { ar: 'أكثر من ١ مليون ريال',       en: 'More than SAR 1M',   min: 1000000,   max: null },
};

export const AMOUNT_ORDER = ['lt_250k', '250k_500k', '500k_1m', 'gt_1m'];

// Representative value for the legacy numeric `requested_financing_amount` column,
// which predates the range codes and is still used by admin reporting and exports.
// Never 0: use the range's upper bound, falling back to `min` for the open-ended
// top bucket. Matches the reference implementation. The UI always renders the range
// label, never this number.
export function representativeAmount(code) {
    const range = AMOUNT_RANGES[code];
    if (!range) return null;
    return range.max ?? range.min;
}

// ─── Business age ───────────────────────────────────────────────────────────
export const AGE_RANGES = {
    lt_1:   { ar: 'أقل من سنة',        en: 'Less than 1 year',  years: 0 },
    '1_2':  { ar: '١ – ٢ سنة',         en: '1 – 2 years',       years: 1 },
    '2_3':  { ar: '٢ – ٣ سنوات',       en: '2 – 3 years',       years: 2 },
    '3_5':  { ar: '٣ – ٥ سنوات',       en: '3 – 5 years',       years: 3 },
    gt_5:   { ar: 'أكثر من ٥ سنوات',   en: 'More than 5 years', years: 5 },
};

export const AGE_ORDER = ['lt_1', '1_2', '2_3', '3_5', 'gt_5'];

// ─── Annual revenue ─────────────────────────────────────────────────────────
// Arabic-Indic numerals are intentional — they match the reference implementation
// exactly. A later decision may standardise numerals across both sites.
export const REVENUE_RANGES = {
    '100k_300k': { ar: '١٠٠ - ٣٠٠ ألف ريال',      en: 'SAR 100K – 300K' },
    '300k_1m':   { ar: '٣٠٠ ألف - ١ مليون ريال',  en: 'SAR 300K – 1M' },
    gt_1m:       { ar: 'أكثر من ١ مليون ريال',    en: 'More than SAR 1M' },
};

export const REVENUE_ORDER = ['100k_300k', '300k_1m', 'gt_1m'];

// ─── Sector / city ──────────────────────────────────────────────────────────
export const SECTORS = [
    { code: 'retail',        ar: 'البيع بالتجزئة',      en: 'Retail' },
    { code: 'wholesale',     ar: 'البيع بالجملة',       en: 'Wholesale' },
    { code: 'manufacturing', ar: 'التصنيع',             en: 'Manufacturing' },
    { code: 'services',      ar: 'الخدمات',             en: 'Services' },
    { code: 'technology',    ar: 'التكنولوجيا',         en: 'Technology' },
    { code: 'healthcare',    ar: 'الرعاية الصحية',      en: 'Healthcare' },
    { code: 'education',     ar: 'التعليم',             en: 'Education' },
    { code: 'hospitality',   ar: 'الفندقة والسياحة',    en: 'Hospitality & Tourism' },
    { code: 'construction',  ar: 'البناء والمقاولات',   en: 'Construction' },
    { code: 'agriculture',   ar: 'الزراعة',             en: 'Agriculture' },
    { code: 'other',         ar: 'أخرى',                en: 'Other' },
];

export const CITIES = [
    { code: 'riyadh',   ar: 'الرياض',       en: 'Riyadh' },
    { code: 'jeddah',   ar: 'جدة',          en: 'Jeddah' },
    { code: 'dammam',   ar: 'الدمام',       en: 'Dammam' },
    { code: 'makkah',   ar: 'مكة',          en: 'Makkah' },
    { code: 'madinah',  ar: 'المدينة',      en: 'Madinah' },
    { code: 'khobar',   ar: 'الخبر',        en: 'Khobar' },
    { code: 'abha',     ar: 'أبها',         en: 'Abha' },
    { code: 'taif',     ar: 'الطائف',       en: 'Taif' },
    { code: 'buraydah', ar: 'بريدة',        en: 'Buraydah' },
    { code: 'khamis',   ar: 'خميس مشيط',    en: 'Khamis Mushait' },
    { code: 'other',    ar: 'أخرى',         en: 'Other' },
];

// Valid-code sets for server-side validation.
export const VALID_FINANCING_CODES = FINANCING_ORDER;
export const VALID_AMOUNT_CODES = AMOUNT_ORDER;
export const VALID_AGE_CODES = AGE_ORDER;
export const VALID_REVENUE_CODES = REVENUE_ORDER;
export const VALID_SECTOR_CODES = SECTORS.map((s) => s.code);
export const VALID_CITY_CODES = CITIES.map((c) => c.code);

// ─── Digit normalisation ────────────────────────────────────────────────────

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits → Western digits. Saudi users
// routinely type either, and every numeric field here is validated against
// Western-digit regexes.
export function normalizeDigits(s) {
    if (!s) return '';
    let out = '';
    for (const ch of String(s)) {
        const code = ch.charCodeAt(0);
        if (code >= 0x0660 && code <= 0x0669) out += String(code - 0x0660);
        else if (code >= 0x06f0 && code <= 0x06f9) out += String(code - 0x06f0);
        else out += ch;
    }
    return out;
}

export function digitsOnly(s) {
    return normalizeDigits(s).replace(/\D/g, '');
}

// ─── Display formatters ─────────────────────────────────────────────────────
// Every formatter takes a code and a language and never renders a raw code or an
// empty cell. `fallback` lets admin/partner views show the original free-text
// value for historical rows whose code could not be back-filled.

const notSpecified = (lang) => (lang === 'ar' ? 'غير محدد' : 'Not specified');

export function formatFinancingType(code, lang = 'ar') {
    if (code && FINANCING_TYPES[code]) return FINANCING_TYPES[code][lang];
    if (code && LEGACY_FINANCING_TYPES[code]) return LEGACY_FINANCING_TYPES[code][lang];
    return notSpecified(lang);
}

export function formatAmountRange(code, lang = 'ar', fallback = null) {
    if (code && AMOUNT_RANGES[code]) return AMOUNT_RANGES[code][lang];
    return fallback || notSpecified(lang);
}

export function formatAgeRange(code, lang = 'ar') {
    if (code && AGE_RANGES[code]) return AGE_RANGES[code][lang];
    return notSpecified(lang);
}

export function formatRevenueRange(code, lang = 'ar', { isPreRevenue = false } = {}) {
    if (isPreRevenue) {
        return lang === 'ar' ? 'لا توجد مبيعات بعد' : 'No sales yet';
    }
    if (code && REVENUE_RANGES[code]) return REVENUE_RANGES[code][lang];
    return notSpecified(lang);
}

export function formatSector(code, lang = 'ar', fallback = null) {
    const s = SECTORS.find((x) => x.code === code);
    if (s) return s[lang];
    return fallback || notSpecified(lang);
}

export function formatCity(code, lang = 'ar', fallback = null) {
    const c = CITIES.find((x) => x.code === code);
    if (c) return c[lang];
    return fallback || notSpecified(lang);
}

export function formatHasPos(value, lang = 'ar') {
    if (value === true) return lang === 'ar' ? 'نعم' : 'Yes';
    if (value === false) return lang === 'ar' ? 'لا' : 'No';
    return notSpecified(lang);
}

// Convenience for building <select>/button lists in either language.
export function optionsFor(ranges, order, lang = 'ar') {
    return order.map((code) => ({ value: code, label: ranges[code][lang] }));
}
