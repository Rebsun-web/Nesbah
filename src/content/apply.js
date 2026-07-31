// Application-form copy, ported verbatim from the nesbah.net reference implementation
// (src/routes/apply.tsx + src/routes/en/apply.tsx). Client-approved — do not reword.
//
// The reference's step order is Company → Financing → Contact, with consent on the
// final step and NO review step. Our previous form had a review step instead; this
// matches the reference.

export const steps = [
    { id: 1, ar: 'بيانات الشركة', en: 'Company info' },
    { id: 2, ar: 'تفاصيل التمويل', en: 'Financing details' },
    { id: 3, ar: 'بيانات التواصل', en: 'Contact info' },
]

export const aside = {
    badge: { ar: 'نموذج مختصر وواضح', en: 'Takes less than 3 minutes' },
    titleLine1: { ar: 'قدّم طلبك مرة واحدة،', en: 'Apply once,' },
    titleAccent: {
        ar: 'لعرضه على جهات تمويل مرخصة',
        en: 'for consideration by licensed financing providers',
    },
    sub: {
        ar: 'خدمة مجانية بالكامل. بياناتك تُشارك فقط بموافقتك مع جهات تمويل مرخصة في المملكة.',
        en: 'Completely free. Your data is shared only with your consent, with licensed financing providers in the Kingdom.',
    },
    points: [
        { icon: 'shield', t: { ar: 'جهات مرخصة فقط', en: 'Licensed lenders only' }, d: { ar: 'بنوك وشركات تمويل مرخصة.', en: 'Licensed banks and finance companies in the Kingdom.' } },
        { icon: 'check', t: { ar: 'القرار بيدك', en: 'No obligation' }, d: { ar: 'راجع أي خيار قد تشاركه إحدى الجهات واختر بحرية.', en: 'Review any options a provider may share and choose freely.' } },
        { icon: 'send', t: { ar: 'مجاناً بالكامل', en: 'Completely free' }, d: { ar: 'لا رسوم على تقديم الطلب.', en: 'No fees to submit your request.' } },
    ],
    whatsapp: {
        ar: 'تحتاج مساعدة؟ تواصل معنا عبر واتساب',
        en: 'Need help? Message us on WhatsApp',
    },
}

export const header = {
    home: { ar: 'الرئيسية', en: 'Home' },
    whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
}

export const stepHeadings = {
    1: {
        title: { ar: 'بيانات الشركة', en: 'Company information' },
        sub: { ar: 'أدخل معلومات شركتك الأساسية', en: 'Enter your basic company details' },
    },
    2: {
        title: { ar: 'تفاصيل التمويل', en: 'Financing details' },
        sub: { ar: 'حدد نوع ومبلغ التمويل المطلوب', en: 'Choose the type and amount you need' },
    },
    3: {
        title: { ar: 'بيانات التواصل', en: 'Contact information' },
        sub: { ar: 'كيف يمكننا التواصل معك؟', en: 'How can we reach you?' },
    },
}

export const fields = {
    companyName: { label: { ar: 'اسم الشركة', en: 'Company name' }, ph: { ar: 'اسم المنشأة كما يظهر في السجل', en: 'Business name as registered' } },
    cr: { label: { ar: 'الرقم الوطني الموحد', en: 'Unified national number' }, ph: { ar: '7XXXXXXXXX', en: '7XXXXXXXXX' } },
    sector: { label: { ar: 'القطاع', en: 'Sector' }, ph: { ar: 'اختر القطاع', en: 'Select sector' } },
    city: { label: { ar: 'المدينة', en: 'City' }, ph: { ar: 'اختر المدينة', en: 'Select city' } },
    revenue: { label: { ar: 'الإيراد السنوي', en: 'Annual revenue' }, ph: { ar: 'اختر الإيراد السنوي', en: 'Select annual revenue' } },
    preRevenue: { label: { ar: 'لا توجد مبيعات / لم تبدأ المنشأة نشاطها بعد', en: 'No sales yet / business has not started operating' } },
    financingType: { label: { ar: 'نوع التمويل', en: 'Financing type' } },
    amount: { label: { ar: 'المبلغ المطلوب', en: 'Requested amount' }, ph: { ar: 'اختر المبلغ المطلوب', en: 'Select requested amount' } },
    age: { label: { ar: 'منذ متى بدأت المنشأة نشاطها؟', en: 'How long has the business been operating?' }, ph: { ar: 'اختر العمر التشغيلي', en: 'Select operating age' } },
    hasPos: { label: { ar: 'هل تتم مبيعاتك كلياً أو جزئياً عبر أجهزة نقاط البيع؟', en: 'Do your sales fully or partially go through POS devices?' } },
    contactName: { label: { ar: 'اسم المسؤول', en: 'Contact person' }, ph: { ar: 'الاسم الكامل', en: 'Full name' } },
    mobile: { label: { ar: 'رقم الجوال', en: 'Mobile number' }, ph: { ar: '05XXXXXXXX', en: '05XXXXXXXX' } },
    email: { label: { ar: 'البريد الإلكتروني (اختياري)', en: 'Email (optional)' }, ph: { ar: 'name@company.com', en: 'name@company.com' } },
    notes: { label: { ar: 'ملاحظات إضافية (اختياري)', en: 'Additional notes (optional)' }, ph: { ar: 'أي تفاصيل إضافية تود مشاركتها...', en: 'Any extra details you would like to share…' } },
    yes: { ar: 'نعم', en: 'Yes' },
    no: { ar: 'لا', en: 'No' },
}

export const consent = {
    text: {
        ar: 'أوافق على مشاركة بيانات الطلب مع جهات التمويل المشاركة لغرض دراسة الطلب والنظر في إمكانية تقديم خيار تمويلي. اطّلعت على',
        en: 'I agree to share my application data with participating financing providers so they can review it and consider offering a financing option. I have read the',
    },
    terms: { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
    and: { ar: 'و', en: 'and the' },
    privacy: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
}

export const errors = {
    companyName: { ar: 'الاسم مطلوب', en: 'Name is required' },
    cr: { ar: 'الرقم الوطني يجب أن يتكون من 10 أرقام ويبدأ بـ 70', en: 'National number must be 10 digits starting with 70' },
    sector: { ar: 'اختر القطاع', en: 'Select a sector' },
    city: { ar: 'اختر المدينة', en: 'Select a city' },
    revenue: { ar: 'اختر الإيراد السنوي', en: 'Select annual revenue' },
    financingType: { ar: 'اختر نوع التمويل', en: 'Select a financing type' },
    amount: { ar: 'اختر المبلغ', en: 'Select an amount' },
    age: { ar: 'اختر عمر المنشأة', en: 'Select the business age' },
    hasPos: { ar: 'الإجابة مطلوبة', en: 'This answer is required' },
    contactName: { ar: 'الاسم مطلوب', en: 'Name is required' },
    mobile: { ar: 'رقم الجوال يبدأ بـ ٠٥ ويتكون من ١٠ أرقام', en: 'Mobile must start with 05 and be 10 digits' },
    email: { ar: 'بريد إلكتروني غير صالح', en: 'Invalid email address' },
    consent: { ar: 'الموافقة على مشاركة البيانات مطلوبة', en: 'Consent to share your data is required' },
}

export const nav = {
    back: { ar: 'السابق', en: 'Back' },
    next: { ar: 'التالي', en: 'Next' },
    submit: { ar: 'إرسال الطلب', en: 'Submit request' },
    submitting: { ar: 'جارٍ الإرسال…', en: 'Submitting…' },
}

export const success = {
    title: { ar: 'تم استلام طلبك', en: 'Your request was received' },
    sub: {
        ar: 'احفظ الرقم المرجعي أدناه لمتابعة طلبك لاحقاً.',
        en: 'Save your reference number below to follow up later.',
    },
    refLabel: { ar: 'الرقم المرجعي', en: 'Reference' },
    home: { ar: 'العودة للرئيسية', en: 'Back to Home' },
    followUp: {
        ar: 'سيتواصل معك فريقنا قريباً عبر واتساب أو البريد الإلكتروني.',
        en: 'Our team will follow up with you shortly via WhatsApp or email.',
    },
}

export const submitErrors = {
    CR_NOT_FOUND: {
        ar: 'رقم السجل التجاري غير موجود أو غير صحيح. يرجى التحقق من الرقم والمحاولة مجدداً.',
        en: 'The CR number does not exist or is invalid. Please check and try again.',
    },
    DUPLICATE_CR: {
        ar: 'تم تقديم طلب بهذا الرقم الوطني مسبقاً.',
        en: 'A request with this CR number has already been submitted.',
    },
    generic: {
        ar: 'حدث خطأ. يرجى المحاولة مجدداً.',
        en: 'Something went wrong. Please try again.',
    },
}
