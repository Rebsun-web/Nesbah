// Legal copy, extracted verbatim from the nesbah.net reference implementation
// (src/routes/{terms,privacy}.tsx and their /en counterparts).
//
// This is legal text pending the client's final legal review — it must be reproduced
// exactly and never reworded, summarised or "tidied" locally. Arabic and English
// blocks are paired positionally and were verified to have identical structure
// (18 blocks for terms, 14 for privacy) at extraction time.
//
// `tag` is the element to render: 'h2' heading, 'p' paragraph, 'ul' bullet list.

export const terms = {
    title: { ar: "الشروط والأحكام", en: "Terms of Service" },
    updated: { ar: "آخر تحديث: يوليو 2026", en: "Last updated: July 2026" },
    blocks: [
        { tag: 'h2', ar: "1. طبيعة الخدمة", en: "1. Nature of the service" },
        { tag: 'p', ar: "نسبة منصة تقنية سعودية تربط أصحاب الأعمال بالجهات المرخصة لتقديم التمويل في المملكة العربية السعودية. نسبة ليست بنكاً ولا شركة تمويل، ولا تقدّم تمويلاً بذاتها ولا تتخذ أي قرار ائتماني، ولا تضمن الحصول على أي عرض أو الموافقة عليه.", en: "Nesbah is a Saudi technology platform that connects business owners with licensed financing providers in the Kingdom of Saudi Arabia. Nesbah is not a bank or a finance company. Nesbah does not provide financing itself, does not make any credit decision, and does not guarantee that any offer will be received or approved." },
        { tag: 'h2', ar: "2. أهلية الاستخدام", en: "2. Eligibility" },
        { tag: 'p', ar: "يقتصر استخدام نموذج الطلب على المخوّل بالتصرف نيابة عن المنشأة. بتقديم الطلب فأنت تُقرّ بصحة البيانات المُدخلة وبأنك مخوّل بمشاركتها.", en: "The application form may only be submitted by a person authorized to act on behalf of the business. By submitting a request you confirm that the information is accurate and that you are authorized to share it." },
        { tag: 'h2', ar: "3. مشاركة البيانات مع جهات التمويل", en: "3. Sharing data with financing providers" },
        { tag: 'p', ar: "عند تقديم الطلب فأنت توافق صراحةً على أن تشارك نسبة كامل بيانات الطلب — بما يشمل اسم المنشأة، الرقم الوطني الموحد، القطاع، المدينة، الإيراد، عمر النشاط، نوع ومبلغ التمويل، وبيانات التواصل — مع البنوك وشركات التمويل المرخصة المشاركة لغرض دراسة الطلب والنظر في إمكانية تقديم خيار تمويلي. يتم توثيق هذه الموافقة بتاريخها ورقم إصدارها.", en: "When you submit a request you explicitly authorize Nesbah to share the full application — including business name, commercial registration, sector, city, revenue, business age, financing type and amount, and contact details — with participating licensed banks and finance companies for the purpose of reviewing your request and offering financing. Your consent is recorded together with its timestamp and policy version." },
        { tag: 'h2', ar: "4. مسؤولية جهات التمويل", en: "4. Provider responsibility" },
        { tag: 'p', ar: "قرارات الموافقة، والمبالغ، والتسعير، والشروط، والمستندات المطلوبة، هي بالكامل من صلاحية كل جهة تمويل وفقاً لسياستها الائتمانية والأنظمة الرقابية. نسبة ليست طرفاً في العقد النهائي بين المنشأة وأي جهة تمويل.", en: "Approval decisions, amounts, pricing, terms, and required documents are the sole responsibility of each financing provider in accordance with its credit policy and applicable regulations. Nesbah is not a party to any final agreement between a business and a financing provider." },
        { tag: 'h2', ar: "5. المحتوى التثقيفي", en: "5. Educational content" },
        { tag: 'p', ar: "أي محتوى تثقيفي مثل «دليل التمويل» يُقدَّم للتعريف العام فقط، ولا يُعتبر مشورة مالية أو قانونية أو ائتمانية.", en: "Any educational content such as the “Financing Guide” is provided for general information only and does not constitute financial, legal, or credit advice." },
        { tag: 'h2', ar: "6. إساءة الاستخدام", en: "6. Misuse" },
        { tag: 'p', ar: "يُحظر تقديم بيانات كاذبة أو مضلّلة، أو استخدام المنصة لأي غرض غير مشروع. تحتفظ نسبة بحق رفض أي طلب أو حظر أي مستخدم يخالف هذه الشروط.", en: "Submitting false or misleading information, or using the platform for any unlawful purpose, is prohibited. Nesbah reserves the right to reject any request or block any user that violates these terms." },
        { tag: 'h2', ar: "7. تعديل الشروط", en: "7. Changes" },
        { tag: 'p', ar: "يجوز لنا تحديث هذه الشروط من وقت لآخر. الاستمرار في استخدام المنصة بعد النشر يُعدّ قبولاً بالنسخة المحدَّثة.", en: "We may update these terms from time to time. Continued use of the platform after publication constitutes acceptance of the updated version." },
        { tag: 'h2', ar: "8. القانون الواجب التطبيق", en: "8. Governing law" },
        { tag: 'p', ar: "تخضع هذه الشروط لأنظمة المملكة العربية السعودية.", en: "These terms are governed by the laws of the Kingdom of Saudi Arabia." },
        { tag: 'h2', ar: "9. التواصل", en: "9. Contact" },
        { tag: 'p', ar: "info@nesbah.com.sa", en: "info@nesbah.com.sa" },
    ],
}
export const privacy = {
    title: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
    updated: { ar: "آخر تحديث: يوليو 2026", en: "Last updated: July 2026" },
    blocks: [
        { tag: 'h2', ar: "1. البيانات التي نجمعها", en: "1. Data we collect" },
        { tag: 'ul', ar: ["بيانات المنشأة: الاسم، الرقم الوطني الموحد، القطاع، المدينة، الإيراد السنوي، عمر النشاط.", "بيانات الطلب: نوع التمويل، المبلغ المطلوب، وجود نقاط بيع، ملاحظات إضافية.", "بيانات التواصل: اسم المسؤول، رقم الجوال، البريد الإلكتروني (اختياري).", "سجلات تقنية: تاريخ ووقت التقديم، إصدار وثيقة الموافقة."], en: ["Business data: name, commercial registration, sector, city, annual revenue, business age.", "Application data: financing type, requested amount, POS status, additional notes.", "Contact data: contact person name, mobile number, email (optional).", "Technical records: submission timestamp, consent policy version."] },
        { tag: 'h2', ar: "2. غرض المعالجة", en: "2. Purpose of processing" },
        { tag: 'ul', ar: ["مشاركة طلبك مع جهات التمويل المرخصة المشاركة لدراسة الطلب والنظر في إمكانية تقديم خيار تمويلي.", "التواصل معك بخصوص طلبك.", "تحسين الخدمة وقياس الأداء بشكل مجمّع.", "الالتزام بالأنظمة المعمول بها في المملكة العربية السعودية."], en: ["To route your request to participating licensed banks and finance companies for review.", "To communicate with you about your request.", "To improve the service and measure performance in aggregate.", "To comply with applicable regulations in the Kingdom of Saudi Arabia."] },
        { tag: 'h2', ar: "3. مشاركة البيانات", en: "3. Data sharing" },
        { tag: 'p', ar: "نُشارك كامل بيانات الطلب وبيانات التواصل مع جهات التمويل المرخصة المشاركة بناءً على موافقتك الصريحة عند تقديم الطلب. لا نبيع بياناتك ولا نستخدمها لأغراض تسويقية خارج نطاق خدمة نسبة.", en: "We share the full application and contact details with participating licensed banks and finance companies based on your explicit consent at submission. We do not sell your data and do not use it for marketing purposes outside the scope of the Nesbah service." },
        { tag: 'h2', ar: "4. مدة الاحتفاظ", en: "4. Retention" },
        { tag: 'p', ar: "نحتفظ ببيانات الطلب لفترة مناسبة تسمح بمتابعة عملية التمويل والامتثال للأنظمة، ثم تُؤرشف أو تُحذف وفقاً لسياستنا الداخلية.", en: "We retain application data for a reasonable period that allows follow-up on the financing process and regulatory compliance, after which it is archived or deleted according to our internal policy." },
        { tag: 'h2', ar: "5. حقوقك", en: "5. Your rights" },
        { tag: 'ul', ar: ["طلب الاطلاع على بياناتك المُقدَّمة.", "طلب تصحيحها إن كانت غير دقيقة.", "طلب حذفها ضمن حدود الأنظمة والاحتياجات التشغيلية.", "سحب موافقتك للمعالجة المستقبلية عبر التواصل معنا."], en: ["Request access to the data you submitted.", "Request corrections if inaccurate.", "Request deletion within the limits of applicable regulations and operational needs.", "Withdraw your consent for future processing by contacting us."] },
        { tag: 'h2', ar: "6. الأمان", en: "6. Security" },
        { tag: 'p', ar: "نطبّق ضوابط تقنية وتنظيمية لحماية البيانات، بما في ذلك التشفير أثناء النقل والوصول المحدود. لا يوجد نظام آمن بشكل مطلق، ولكن نحرص على تحديث ممارساتنا باستمرار.", en: "We apply technical and organizational safeguards to protect your data, including encryption in transit and restricted access. No system is completely secure, but we continuously update our practices." },
        { tag: 'h2', ar: "7. الاستفسارات", en: "7. Contact" },
        { tag: 'p', ar: "لأي استفسار متعلق بالخصوصية أو ممارسة حقوقك: info@nesbah.com.sa", en: "For any privacy inquiry or to exercise your rights: info@nesbah.com.sa" },
    ],
}
