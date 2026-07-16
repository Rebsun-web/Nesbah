// Shared input validators used on both the client (inline field errors) and the
// server (400 responses before any DB call). Each `check*` function returns an
// English error string when invalid, or null when valid. Regexes are exported
// for callers that need bilingual messaging (e.g. the public onboarding form).

// Business CR national numbers issued by Wathiq always start with "70" — matches
// the actual Wathiq verification route (business_users/verify) and the business
// registration rule already enforced there.
export const CR_NATIONAL_NUMBER_RE = /^70\d{8}$/;
// Saudi mobile: 05XXXXXXXX, +9665XXXXXXXX, or 9665XXXXXXXX (spaces/dashes tolerated).
export const SAUDI_MOBILE_RE = /^(?:\+?966|0)5\d{8}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhone = (v) => String(v == null ? '' : v).replace(/[\s-]/g, '');

export function checkRequired(value, label = 'This field') {
    if (value == null || String(value).trim() === '') return `${label} is required`;
    return null;
}

export function checkEmail(value, { required = true, label = 'Email' } = {}) {
    const v = String(value == null ? '' : value).trim();
    if (!v) return required ? `${label} is required` : null;
    if (!EMAIL_RE.test(v)) return `Enter a valid email address`;
    return null;
}

export function checkSaudiMobile(value, { required = true, label = 'Mobile number' } = {}) {
    const v = normalizePhone(value);
    if (!v) return required ? `${label} is required` : null;
    if (!SAUDI_MOBILE_RE.test(v)) return `Enter a valid Saudi mobile number (e.g. 05XXXXXXXX)`;
    return null;
}

export function checkCRNationalNumber(value, { required = true, label = 'CR national number' } = {}) {
    const v = String(value == null ? '' : value).trim();
    if (!v) return required ? `${label} is required` : null;
    if (!CR_NATIONAL_NUMBER_RE.test(v)) return `CR national number must be 10 digits starting with 70`;
    return null;
}

export function checkLength(value, { min = 0, max = Infinity, required = true, label = 'This field' } = {}) {
    const v = String(value == null ? '' : value).trim();
    if (!v) return required ? `${label} is required` : null;
    if (v.length < min) return `${label} must be at least ${min} characters`;
    if (v.length > max) return `${label} must be at most ${max} characters`;
    return null;
}

export function checkPassword(value, { min = 8, required = true, label = 'Password' } = {}) {
    const v = String(value == null ? '' : value);
    if (!v.trim()) return required ? `${label} is required` : null;
    if (v.trim().length < min) return `${label} must be at least ${min} characters`;
    return null;
}

export function checkNumber(value, { min = -Infinity, max = Infinity, required = true, integer = false, label = 'This field' } = {}) {
    const raw = value == null ? '' : String(value).trim();
    if (!raw) return required ? `${label} is required` : null;
    const n = Number(raw);
    if (isNaN(n)) return `${label} must be a number`;
    if (integer && !Number.isInteger(n)) return `${label} must be a whole number`;
    if (n < min) return `${label} must be at least ${min}`;
    if (n > max) return `${label} must be at most ${max}`;
    return null;
}

/**
 * Run a map of { field: () => errorStringOrNull } and collect results.
 * Returns { valid, errors, firstError }.
 */
export function collectErrors(checks) {
    const errors = {};
    for (const [field, run] of Object.entries(checks)) {
        const err = typeof run === 'function' ? run() : run;
        if (err) errors[field] = err;
    }
    const keys = Object.keys(errors);
    return { valid: keys.length === 0, errors, firstError: keys.length ? errors[keys[0]] : null };
}
