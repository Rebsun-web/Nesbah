// Bilingual educational content for the 7 financing products, ported verbatim from the
// nesbah.net reference implementation (src/lib/product-details.ts). TypeScript types
// stripped; the content itself is unchanged and is client-approved — do not reword.
//
// Purely educational: no eligibility guarantees, no invented rates, amounts or
// partners, no approval promises. Keys match the financing codes in
// src/lib/apply-options.js.

export const PRODUCT_DETAILS = {
  corporate: {
    code: "corporate",
    ar: {
      title: "تمويل الشركات",
      tag: "حلول تمويلية شاملة لتنمية أعمال شركتك",
      intro:
        "تمويل الشركات مصطلح جامع يغطي حلولاً تمويلية متعددة تُقدّمها البنوك وشركات التمويل المرخصة للمنشآت والشركات لدعم تشغيلها ونموّها. يستخدمه أصحاب الأعمال عندما لا يكون الاحتياج مرتبطاً بأصل واحد أو مشروع محدد فقط، بل بخطة أوسع لتطوير الشركة.",
      useCases: [
        { title: "دعم النشاط التشغيلي", desc: "تمويل مرن يغطي احتياجات التشغيل المتكررة والموسمية." },
        { title: "خطط تطوير عامة", desc: "لدعم أكثر من هدف في وقت واحد: توسع + تشغيل + تجديد." },
        { title: "إعادة هيكلة السيولة", desc: "تنظيم التدفقات النقدية للمنشأة على مدى أطول." },
      ],
      howItWorks: [
        { title: "تعبئة طلب واحد", desc: "أكمل نموذج نسبة بمعلومات شركتك ونوع الاحتياج." },
        { title: "مراجعة من جهات مرخصة", desc: "نعرض طلبك على بنوك وشركات تمويل مرخصة في المملكة." },
        { title: "راجع أي خيارات متاحة", desc: "إذا قررت إحدى الجهات المرخصة المضي في دراسة الطلب، فقد تشارك خياراً يمكنك مراجعته بحرية وبدون التزام." },
      ],
      whatLendersLookAt: [
        "طبيعة النشاط وقطاع الشركة",
        "أداء التدفقات النقدية عبر الحسابات البنكية التشغيلية",
        "عمر السجل التجاري وسجل الأداء",
        "التاريخ الائتماني للمنشأة والشركاء",
        "توفر ضمانات أو دعم برنامج كفالة عند الحاجة",
      ],
      documents: [
        "نسخة سارية من السجل التجاري",
        "كشوفات حساب بنكي تشغيلي (عادةً ٦ – ١٢ شهراً)",
        "القوائم المالية إن توفرت",
        "إقرارات ضريبة القيمة المضافة إن وُجدت",
        "الهوية الوطنية للمالك أو الشركاء",
      ],
      tips: [
        "حدّد بوضوح الغرض من التمويل قبل التقديم.",
        "حافظ على انتظام إيرادات الشركة عبر الحساب البنكي التجاري.",
        "احرص على تحديث السجل التجاري وبيانات المنشأة.",
      ],
      faqs: [
        { q: "ما الفرق بين تمويل الشركات ورأس المال العامل؟", a: "تمويل الشركات مصطلح أشمل قد يجمع رأس المال العامل والتوسع والتشغيل ضمن هيكل واحد، بينما رأس المال العامل مخصص للمصاريف التشغيلية اليومية." },
        { q: "هل نسبة تحدد قيمة التمويل؟", a: "لا. نسبة لا تتخذ قرارات ائتمانية. مبلغ التمويل وشروطه يحددها كل ممول وفق سياسته." },
        { q: "هل الخدمة مجانية؟", a: "نعم، تقديم الطلب عبر نسبة مجاني بالكامل ودون التزام." },
      ],
      notLenderNote:
        "نسبة ليست بنكاً أو شركة تمويل، ولا تتخذ قرارات ائتمانية. دورنا هو تسهيل إيصال طلبك إلى جهات تمويل مرخصة في المملكة.",
      ctaApply: "قدّم طلبك الآن",
      ctaGuide: "استكشف دليل التمويل",
      breadcrumbHome: "الرئيسية",
      breadcrumbProducts: "أنواع التمويل",
      sectionUseCases: "متى يناسبك هذا التمويل",
      sectionHow: "كيف يعمل عبر نسبة",
      sectionLenders: "ما تنظر إليه جهات التمويل",
      sectionDocs: "المستندات التي يُطلب توفيرها عادةً",
      sectionTips: "نصائح لتقوية طلبك",
      sectionFaq: "الأسئلة الشائعة",
      metaTitle: "تمويل الشركات في السعودية | نسبة",
      metaDescription:
        "تمويل الشركات: حلول تمويلية شاملة لتنمية أعمال شركتك عبر جهات تمويل مرخصة. اعرف كيفية العمل، المستندات، ونصائح تقوية الطلب — عبر منصة نسبة.",
    },
    en: {
      title: "Corporate Financing",
      tag: "Comprehensive financing solutions to grow your business",
      intro:
        "Corporate financing is an umbrella term for financing solutions offered by licensed banks and finance companies to businesses supporting their operations and growth. Owners use it when the need is broader than a single asset or project — for example, a wider development plan that mixes operations and expansion.",
      useCases: [
        { title: "Operational support", desc: "Flexible financing that covers recurring and seasonal operating needs." },
        { title: "Broader development plans", desc: "Supports more than one goal at once: expansion, operations, renewal." },
        { title: "Cash-flow restructuring", desc: "Organizes company cash flows over a longer horizon." },
      ],
      howItWorks: [
        { title: "One application", desc: "Complete the Nesbah form with your company details and financing need." },
        { title: "Reviewed by licensed lenders", desc: "We share your request with licensed banks and finance companies in the Kingdom." },
        { title: "Review any available options", desc: "If a licensed provider chooses to proceed with your request, it may share an option you can review freely — no obligation." },
      ],
      whatLendersLookAt: [
        "Business activity and sector",
        "Cash-flow performance through operating bank accounts",
        "Age of the commercial registration and track record",
        "Credit history of the entity and partners",
        "Available collateral or Kafalah program support when needed",
      ],
      documents: [
        "Valid copy of the commercial registration",
        "Operating bank statements (typically 6 – 12 months)",
        "Financial statements if available",
        "VAT returns if applicable",
        "National ID of the owner or partners",
      ],
      tips: [
        "Clearly define the purpose of the financing before applying.",
        "Keep company revenue flowing through the commercial bank account.",
        "Make sure the commercial registration and company data are up to date.",
      ],
      faqs: [
        { q: "What's the difference between corporate financing and working capital?", a: "Corporate financing is broader and can package working capital, expansion, and operations into one structure. Working capital is specific to day-to-day operating expenses." },
        { q: "Does Nesbah decide the financing amount?", a: "No. Nesbah does not make credit decisions. Each lender determines the amount and terms per its own policy." },
        { q: "Is the service free?", a: "Yes, submitting a request through Nesbah is completely free with no obligation." },
      ],
      notLenderNote:
        "Nesbah is not a bank or finance company and does not make credit decisions. Our role is to route your request to licensed financing providers in the Kingdom.",
      ctaApply: "Apply now",
      ctaGuide: "Explore the Financing Guide",
      breadcrumbHome: "Home",
      breadcrumbProducts: "Financing products",
      sectionUseCases: "When it fits your business",
      sectionHow: "How it works with Nesbah",
      sectionLenders: "What lenders review",
      sectionDocs: "Documents commonly requested",
      sectionTips: "Tips to strengthen your request",
      sectionFaq: "FAQ",
      metaTitle: "Corporate Financing in Saudi Arabia | Nesbah",
      metaDescription:
        "Corporate financing: comprehensive solutions to grow your business through licensed lenders. Learn how it works, documents, and tips — via Nesbah.",
    },
  },
  working_capital: {
    code: "working_capital",
    ar: {
      title: "تمويل رأس المال العامل",
      tag: "لتغطية المصاريف التشغيلية اليومية",
      intro:
        "تمويل رأس المال العامل منتج قصير إلى متوسط الأجل يستخدم لتغطية المصاريف التشغيلية اليومية للمنشأة مثل الرواتب والمخزون والموردين، دون الحاجة لربطه بأصل محدد.",
      useCases: [
        { title: "تدفق تشغيلي منتظم", desc: "تغطية فجوات السيولة بين الإيرادات والمصروفات." },
        { title: "المخزون والموردين", desc: "شراء المخزون في المواسم أو دفعة واحدة لتحسين التكلفة." },
        { title: "الرواتب والالتزامات", desc: "الحفاظ على انتظام الرواتب والالتزامات الشهرية." },
      ],
      howItWorks: [
        { title: "قدّم طلبك", desc: "اختر رأس المال العامل ضمن نموذج نسبة." },
        { title: "مراجعة من الممولين", desc: "تدرس جهات التمويل المرخصة نشاط الحساب وسجل النشاط." },
        { title: "راجع أي خيارات متاحة", desc: "إذا قررت إحدى الجهات المرخصة المضي في دراسة الطلب، فقد تشارك خياراً يمكنك مراجعته بحرية وبدون التزام." },
      ],
      whatLendersLookAt: [
        "نشاط الحساب البنكي التجاري وانتظام الإيرادات",
        "عمر السجل التجاري ونشاط المنشأة",
        "القطاع والمخاطر التشغيلية المرتبطة به",
        "التاريخ الائتماني للمنشأة والشركاء",
        "توفر ضمانات تشغيلية أو دعم برنامج كفالة",
      ],
      documents: [
        "نسخة سارية من السجل التجاري",
        "كشوفات حساب بنكي تشغيلي (عادةً آخر ٦ – ١٢ شهراً)",
        "إقرارات ضريبة القيمة المضافة إن وُجدت",
        "القوائم المالية أو ملخص للإيرادات إن توفر",
        "الهوية الوطنية للمالك أو الشركاء",
      ],
      tips: [
        "حافظ على تدفق إيرادات المنشأة عبر الحساب البنكي التجاري.",
        "جهّز كشوفات بنكية بصيغة رسمية من البنك مباشرةً.",
        "تجنّب السحب النقدي الكبير غير المبرر خلال فترة الكشوفات.",
        "وضّح دورة رأس المال العامل بشكل مختصر ضمن وصف الطلب.",
      ],
      faqs: [
        { q: "ما الفرق بين رأس المال العامل وتمويل الشركات؟", a: "رأس المال العامل مخصص للتشغيل اليومي، بينما تمويل الشركات مصطلح أشمل قد يجمع أكثر من هدف تمويلي." },
        { q: "هل يتطلب رهن أصل؟", a: "لا يشترط دائماً؛ يعتمد على سياسة كل ممول وقد يُدعم أحياناً ببرنامج كفالة." },
        { q: "كم تستغرق المدة؟", a: "تختلف بحسب سياسة كل ممول. عادةً ما يكون قصير إلى متوسط الأجل." },
      ],
      notLenderNote:
        "نسبة ليست بنكاً أو شركة تمويل، ولا تتخذ قرارات ائتمانية. دورنا هو تسهيل إيصال طلبك إلى جهات تمويل مرخصة في المملكة.",
      ctaApply: "قدّم طلب رأس مال عامل",
      ctaGuide: "استكشف دليل التمويل",
      breadcrumbHome: "الرئيسية",
      breadcrumbProducts: "أنواع التمويل",
      sectionUseCases: "متى يناسبك هذا التمويل",
      sectionHow: "كيف يعمل عبر نسبة",
      sectionLenders: "ما تنظر إليه جهات التمويل",
      sectionDocs: "المستندات التي يُطلب توفيرها عادةً",
      sectionTips: "نصائح لتقوية طلبك",
      sectionFaq: "الأسئلة الشائعة",
      metaTitle: "تمويل رأس المال العامل للشركات | نسبة",
      metaDescription:
        "تمويل رأس المال العامل لتغطية الرواتب والمخزون والموردين عبر جهات تمويل مرخصة. تعرّف على المستندات، وما تراجعه الجهات، ونصائح تقوية الطلب.",
    },
    en: {
      title: "Working Capital Financing",
      tag: "To cover day-to-day operating expenses",
      intro:
        "Working capital financing is a short- to mid-term product used to cover a business's day-to-day operating expenses — salaries, inventory, suppliers — without being tied to a specific asset.",
      useCases: [
        { title: "Steady operating flow", desc: "Bridge liquidity gaps between revenues and expenses." },
        { title: "Inventory and suppliers", desc: "Buy inventory in-season or in bulk to improve cost." },
        { title: "Payroll and obligations", desc: "Keep monthly payroll and obligations running smoothly." },
      ],
      howItWorks: [
        { title: "Submit your request", desc: "Select Working Capital inside the Nesbah form." },
        { title: "Lender review", desc: "Licensed lenders review your account activity and history." },
        { title: "Review any available options", desc: "If a licensed provider chooses to proceed with your request, it may share an option you can review freely — no obligation." },
      ],
      whatLendersLookAt: [
        "Business bank account activity and revenue consistency",
        "Age of the commercial registration and activity",
        "Sector and its operational risk profile",
        "Credit history of the entity and partners",
        "Availability of operational collateral or Kafalah program support",
      ],
      documents: [
        "Valid copy of the commercial registration",
        "Operating bank statements (typically last 6 – 12 months)",
        "VAT returns if applicable",
        "Financial statements or a revenue summary if available",
        "National ID of the owner or partners",
      ],
      tips: [
        "Keep business revenue flowing through the commercial bank account.",
        "Use official bank statements issued directly by the bank.",
        "Avoid large unexplained cash withdrawals during the statement period.",
        "Briefly explain your working-capital cycle in the application description.",
      ],
      faqs: [
        { q: "How is working capital different from corporate financing?", a: "Working capital covers day-to-day operations; corporate financing is broader and can package multiple goals into one structure." },
        { q: "Is an asset pledge required?", a: "Not always — it depends on each lender's policy and can sometimes be supported by the Kafalah program." },
        { q: "How long is the tenor?", a: "It varies by lender. Typically short to mid-term." },
      ],
      notLenderNote:
        "Nesbah is not a bank or finance company and does not make credit decisions. Our role is to route your request to licensed financing providers in the Kingdom.",
      ctaApply: "Apply for working capital",
      ctaGuide: "Explore the Financing Guide",
      breadcrumbHome: "Home",
      breadcrumbProducts: "Financing products",
      sectionUseCases: "When it fits your business",
      sectionHow: "How it works with Nesbah",
      sectionLenders: "What lenders review",
      sectionDocs: "Documents commonly requested",
      sectionTips: "Tips to strengthen your request",
      sectionFaq: "FAQ",
      metaTitle: "Working Capital Financing for SMEs | Nesbah",
      metaDescription:
        "Working capital financing to cover salaries, inventory, and suppliers through licensed lenders. Documents, what lenders review, and tips — via Nesbah.",
    },
  },
  expansion: {
    code: "expansion",
    ar: {
      title: "تمويل التوسع والنمو",
      tag: "لفتح فرع جديد أو زيادة الطاقة الإنتاجية",
      intro:
        "تمويل التوسع والنمو منتج متوسط إلى طويل الأجل يستخدم لتمويل خطط النمو مثل افتتاح فروع جديدة، أو دخول أسواق، أو زيادة الطاقة التشغيلية للمنشأة.",
      useCases: [
        { title: "افتتاح فرع جديد", desc: "توسع جغرافي أو موقع تشغيلي إضافي." },
        { title: "دخول سوق جديد", desc: "تمكين خدمة أو قطاع لم تخدمه المنشأة سابقاً." },
        { title: "زيادة الطاقة التشغيلية", desc: "لتلبية طلب متزايد على منتجات أو خدمات المنشأة." },
      ],
      howItWorks: [
        { title: "قدّم طلب التوسع", desc: "اختر تمويل التوسع والنمو ضمن نموذج نسبة." },
        { title: "دراسة الخطة", desc: "تدرس جهات التمويل خطة التوسع والأداء التشغيلي والمالي." },
        { title: "راجع أي خيارات متاحة", desc: "إذا قررت إحدى الجهات المرخصة المضي في دراسة الطلب، فقد تشارك خياراً يمكنك مراجعته بحرية وبدون التزام." },
      ],
      whatLendersLookAt: [
        "خطة توسع واضحة (الموقع، السوق المستهدف، الجدول الزمني)",
        "الأداء التشغيلي والمالي التاريخي للمنشأة",
        "عمر النشاط في القطاع المستهدف",
        "التوقعات المدروسة لعوائد التوسع",
        "توفر ضمانات أو دعم برنامج كفالة",
      ],
      documents: [
        "نسخة سارية من السجل التجاري",
        "خطة توسع مختصرة (وصف النشاط الجديد، الجدول الزمني)",
        "كشوفات حساب بنكي (عادةً ١٢ شهراً)",
        "القوائم المالية للسنة الأخيرة إن توفرت",
        "إقرارات ضريبة القيمة المضافة إن وُجدت",
        "أي عقود إيجار أو مخاطبات مبدئية للفرع الجديد إن توفرت",
      ],
      tips: [
        "اكتب سبب التوسع في جملتين واضحتين ضمن وصف الطلب.",
        "أرفق أي مؤشرات نجاح للفروع أو الأنشطة الحالية.",
        "جهّز خط زمني تقريبي لمراحل التوسع.",
      ],
      faqs: [
        { q: "هل يشترط أن يكون لدي فرع سابق؟", a: "لا يشترط دائماً، لكن الأداء التشغيلي الحالي وقدرة المنشأة على التنفيذ عوامل تنظر إليها جهات التمويل." },
        { q: "كم تستغرق مدة التمويل؟", a: "غالباً متوسطة إلى طويلة الأجل بحسب حجم التوسع وسياسة الممول." },
        { q: "هل يمكن ربطها ببرنامج كفالة؟", a: "نعم، غالباً ما يُدرَس تمويل التوسع مع إمكانية إشراك برنامج كفالة لدعم الضمانات." },
      ],
      notLenderNote:
        "نسبة ليست بنكاً أو شركة تمويل، ولا تتخذ قرارات ائتمانية. دورنا هو تسهيل إيصال طلبك إلى جهات تمويل مرخصة في المملكة.",
      ctaApply: "قدّم طلب تمويل توسع",
      ctaGuide: "استكشف دليل التمويل",
      breadcrumbHome: "الرئيسية",
      breadcrumbProducts: "أنواع التمويل",
      sectionUseCases: "متى يناسبك هذا التمويل",
      sectionHow: "كيف يعمل عبر نسبة",
      sectionLenders: "ما تنظر إليه جهات التمويل",
      sectionDocs: "المستندات التي يُطلب توفيرها عادةً",
      sectionTips: "نصائح لتقوية طلبك",
      sectionFaq: "الأسئلة الشائعة",
      metaTitle: "تمويل التوسع والنمو للشركات | نسبة",
      metaDescription:
        "تمويل التوسع والنمو لفتح فرع، دخول سوق، أو زيادة الطاقة الإنتاجية عبر جهات تمويل مرخصة — تعرف على المستندات والنصائح عبر نسبة.",
    },
    en: {
      title: "Growth & Expansion Financing",
      tag: "To open a new branch or increase capacity",
      intro:
        "Growth and expansion financing is a mid- to long-term product used to fund plans such as opening new branches, entering new markets, or increasing operational capacity.",
      useCases: [
        { title: "New branch opening", desc: "Geographic expansion or an additional operating location." },
        { title: "New market entry", desc: "Enabling a product or segment not previously served." },
        { title: "Capacity increase", desc: "Meeting rising demand for your products or services." },
      ],
      howItWorks: [
        { title: "Submit an expansion request", desc: "Select Growth & Expansion inside the Nesbah form." },
        { title: "Plan review", desc: "Lenders review the expansion plan and past performance." },
        { title: "Review any available options", desc: "If a licensed provider chooses to proceed with your request, it may share an option you can review freely — no obligation." },
      ],
      whatLendersLookAt: [
        "A clear expansion plan (location, target market, timeline)",
        "Historical operational and financial performance",
        "Track record in the target sector",
        "Reasoned projections of expansion returns",
        "Available collateral or Kafalah program support",
      ],
      documents: [
        "Valid copy of the commercial registration",
        "A concise expansion plan (activity, timeline)",
        "Bank statements (typically last 12 months)",
        "Financial statements for the last year if available",
        "VAT returns if applicable",
        "Any lease agreements or initial correspondence for the new branch if available",
      ],
      tips: [
        "State the reason for expansion in two clear sentences in the application.",
        "Attach success indicators from existing branches or activities.",
        "Prepare an approximate timeline for the expansion stages.",
      ],
      faqs: [
        { q: "Do I need an existing branch?", a: "Not always — but current operating performance and the ability to execute matter to lenders." },
        { q: "How long is the tenor?", a: "Typically mid to long term, depending on the size of the expansion and lender policy." },
        { q: "Can it be paired with Kafalah?", a: "Yes — expansion financing is often reviewed with Kafalah program support to help with collateral." },
      ],
      notLenderNote:
        "Nesbah is not a bank or finance company and does not make credit decisions. Our role is to route your request to licensed financing providers in the Kingdom.",
      ctaApply: "Apply for expansion financing",
      ctaGuide: "Explore the Financing Guide",
      breadcrumbHome: "Home",
      breadcrumbProducts: "Financing products",
      sectionUseCases: "When it fits your business",
      sectionHow: "How it works with Nesbah",
      sectionLenders: "What lenders review",
      sectionDocs: "Documents commonly requested",
      sectionTips: "Tips to strengthen your request",
      sectionFaq: "FAQ",
      metaTitle: "Growth & Expansion Financing for SMEs | Nesbah",
      metaDescription:
        "Growth and expansion financing for new branches, new markets, or added capacity through licensed lenders — documents and tips via Nesbah.",
    },
  },
  equipment: {
    code: "equipment",
    ar: {
      title: "تمويل المعدات والأجهزة",
      tag: "لشراء أصول أو معدات تشغيلية",
      intro:
        "تمويل المعدات مخصص لشراء أصول تشغيلية ثابتة مثل الآلات، المعدات، أجهزة المطابخ، أو المركبات التجارية، وغالباً ما يكون الأصل ذاته جزءاً من الضمان.",
      useCases: [
        { title: "معدات إنتاج", desc: "خطوط إنتاج، آلات ورش، تجهيزات صناعية." },
        { title: "مركبات تشغيلية", desc: "شاحنات، سيارات نقل، مركبات خدمات." },
        { title: "تجهيزات فروع جديدة", desc: "مطابخ، ثلاجات، معدات مطاعم أو صالونات." },
      ],
      howItWorks: [
        { title: "احصل على عرض سعر", desc: "من مورد رسمي باسم منشأتك." },
        { title: "قدّم الطلب", desc: "اختر تمويل المعدات ضمن نموذج نسبة وأرفق العرض." },
        { title: "راجع أي خيارات متاحة", desc: "إذا قررت إحدى الجهات المرخصة المضي في دراسة الطلب، فقد تشارك خياراً يمكنك مراجعته بحرية وبدون التزام." },
      ],
      whatLendersLookAt: [
        "طبيعة الأصل ومدى ارتباطه بنشاط المنشأة",
        "عرض سعر رسمي من المورد",
        "قيمة الأصل واستخدامه التشغيلي المتوقع",
        "التاريخ الائتماني والقدرة على السداد التشغيلي",
        "عمر النشاط وسجل الأداء",
      ],
      documents: [
        "نسخة سارية من السجل التجاري",
        "عرض سعر رسمي من المورد (Pro Forma Invoice)",
        "كشوفات حساب بنكي (عادةً ٦ – ١٢ شهراً)",
        "مواصفات الأصل أو المعدة",
        "إقرارات ضريبة القيمة المضافة إن وُجدت",
      ],
      tips: [
        "احرص أن يكون عرض السعر من مورد مسجّل وباسم منشأتك.",
        "وضّح كيف يخدم الأصل تشغيلك (زيادة إنتاج، خدمة عملاء، تقليل تكلفة).",
        "احتفظ بأكثر من عرض سعر إن أمكن للمقارنة.",
      ],
      faqs: [
        { q: "هل يشترط أن يكون الأصل جديداً؟", a: "يعتمد على سياسة كل ممول وطبيعة الأصل." },
        { q: "هل الأصل يبقى ضماناً حتى نهاية التمويل؟", a: "غالباً نعم، فالأصل يمثل جزءاً أساسياً من ضمان الجهة الممولة." },
        { q: "هل يمكن جمع عدة أصول في طلب واحد؟", a: "نعم عادةً، مع توضيح مواصفات كل أصل ومورّده." },
      ],
      notLenderNote:
        "نسبة ليست بنكاً أو شركة تمويل، ولا تتخذ قرارات ائتمانية. دورنا هو تسهيل إيصال طلبك إلى جهات تمويل مرخصة في المملكة.",
      ctaApply: "قدّم طلب تمويل معدات",
      ctaGuide: "استكشف دليل التمويل",
      breadcrumbHome: "الرئيسية",
      breadcrumbProducts: "أنواع التمويل",
      sectionUseCases: "متى يناسبك هذا التمويل",
      sectionHow: "كيف يعمل عبر نسبة",
      sectionLenders: "ما تنظر إليه جهات التمويل",
      sectionDocs: "المستندات التي يُطلب توفيرها عادةً",
      sectionTips: "نصائح لتقوية طلبك",
      sectionFaq: "الأسئلة الشائعة",
      metaTitle: "تمويل المعدات والأجهزة للشركات | نسبة",
      metaDescription:
        "تمويل المعدات لشراء آلات، مركبات، وتجهيزات تشغيلية عبر جهات تمويل مرخصة — تعرف على المستندات والنصائح عبر نسبة.",
    },
    en: {
      title: "Equipment Financing",
      tag: "To purchase operating assets or equipment",
      intro:
        "Equipment financing is designed for the purchase of fixed operating assets — machines, tools, kitchen equipment, or commercial vehicles — where the asset itself is often part of the collateral.",
      useCases: [
        { title: "Production equipment", desc: "Production lines, workshop machines, industrial gear." },
        { title: "Operating vehicles", desc: "Trucks, delivery vans, service vehicles." },
        { title: "New branch fit-outs", desc: "Kitchens, fridges, restaurant or salon equipment." },
      ],
      howItWorks: [
        { title: "Get a quotation", desc: "From a registered supplier in your company's name." },
        { title: "Submit the request", desc: "Pick Equipment Financing in the Nesbah form and attach the quote." },
        { title: "Review any available options", desc: "If a licensed provider chooses to proceed with your request, it may share an option you can review freely — no obligation." },
      ],
      whatLendersLookAt: [
        "The asset's nature and how it fits the business activity",
        "An official supplier quotation",
        "Asset value and expected operational use",
        "Credit history and repayment capacity",
        "Age of the business and performance track record",
      ],
      documents: [
        "Valid copy of the commercial registration",
        "Official supplier quotation (Pro Forma Invoice)",
        "Bank statements (typically 6 – 12 months)",
        "Asset specifications",
        "VAT returns if applicable",
      ],
      tips: [
        "Make sure the quotation is from a registered supplier in your company's name.",
        "Explain how the asset serves operations (higher output, better service, lower cost).",
        "Keep more than one quotation for comparison when possible.",
      ],
      faqs: [
        { q: "Does the asset have to be new?", a: "It depends on each lender's policy and the asset type." },
        { q: "Does the asset stay as collateral until the end?", a: "Usually yes — the asset itself is a core part of the lender's collateral." },
        { q: "Can I combine multiple assets in one request?", a: "Yes, typically — clearly listing each asset's specs and supplier." },
      ],
      notLenderNote:
        "Nesbah is not a bank or finance company and does not make credit decisions. Our role is to route your request to licensed financing providers in the Kingdom.",
      ctaApply: "Apply for equipment financing",
      ctaGuide: "Explore the Financing Guide",
      breadcrumbHome: "Home",
      breadcrumbProducts: "Financing products",
      sectionUseCases: "When it fits your business",
      sectionHow: "How it works with Nesbah",
      sectionLenders: "What lenders review",
      sectionDocs: "Documents commonly requested",
      sectionTips: "Tips to strengthen your request",
      sectionFaq: "FAQ",
      metaTitle: "Equipment Financing for SMEs | Nesbah",
      metaDescription:
        "Equipment financing for machines, vehicles, and operating gear through licensed lenders — documents and tips via Nesbah.",
    },
  },
  project: {
    code: "project",
    ar: {
      title: "تمويل تنفيذ المشاريع والعقود",
      tag: "لتمويل تنفيذ عقد أو أمر شراء موقّع",
      intro:
        "تمويل موجّه لتنفيذ عقد أو مشروع محدد مسبقاً، غالباً بربطه بجدول تسليم ودفعات العميل النهائي (Contract / Project Finance).",
      useCases: [
        { title: "عقود حكومية أو شبه حكومية", desc: "تنفيذ مشاريع أو أوامر شراء بعقود موقّعة." },
        { title: "عقود قطاع خاص كبير", desc: "توريد أو خدمات للعقود ذات الحجم النسبي الكبير." },
        { title: "مشاريع بجدول دفعات", desc: "تمويل الفجوة بين مصروفات التنفيذ ودفعات العميل." },
      ],
      howItWorks: [
        { title: "أرفق العقد", desc: "قدّم العقد أو أمر الشراء الموقّع ضمن نموذج نسبة." },
        { title: "دراسة الأطراف والتدفقات", desc: "تراجع الجهات المرخصة الجهة المتعاقدة وجدول الدفعات." },
        { title: "راجع أي خيارات متاحة", desc: "إذا قررت إحدى الجهات المرخصة المضي في دراسة الطلب، فقد تشارك خياراً يمكنك مراجعته بحرية وبدون التزام." },
      ],
      whatLendersLookAt: [
        "نسخة موقّعة من العقد أو أمر الشراء",
        "الجهة المتعاقدة معك وطبيعتها (حكومية، شبه حكومية، خاصة)",
        "جدول الدفعات والتسليم",
        "خبرة المنشأة في تنفيذ مشاريع مشابهة",
        "التدفقات المتوقعة للمشروع",
      ],
      documents: [
        "نسخة سارية من السجل التجاري",
        "نسخة موقّعة من العقد أو أمر الشراء",
        "جدول الدفعات والتسليم إن وُجد",
        "كشوفات حساب بنكي (عادةً ٦ – ١٢ شهراً)",
        "سجل تنفيذ مشاريع سابقة إن توفر",
      ],
      tips: [
        "تأكد من وضوح جدول دفعات العميل النهائي في العقد.",
        "أرفق ملخصاً تنفيذياً للمشروع (النطاق، المدة، المستلمات).",
        "وضّح من هو العميل النهائي وما مصدر تمويله.",
      ],
      faqs: [
        { q: "هل يشترط أن يكون العقد حكومياً؟", a: "لا يشترط، لكن طبيعة الجهة المتعاقدة عامل مهم في تقييم مخاطر التنفيذ." },
        { q: "هل يمكن التمويل قبل توقيع العقد؟", a: "عادةً لا؛ فالعقد الموقّع أو أمر الشراء هما الأساس الذي تبني عليه الجهات دراستها." },
        { q: "هل يمكن دعم الطلب بكفالة؟", a: "نعم، غالباً ما تُدرَس هذه المنتجات مع إمكانية إشراك برنامج كفالة." },
      ],
      notLenderNote:
        "نسبة ليست بنكاً أو شركة تمويل، ولا تتخذ قرارات ائتمانية. دورنا هو تسهيل إيصال طلبك إلى جهات تمويل مرخصة في المملكة.",
      ctaApply: "قدّم طلب تمويل مشروع",
      ctaGuide: "استكشف دليل التمويل",
      breadcrumbHome: "الرئيسية",
      breadcrumbProducts: "أنواع التمويل",
      sectionUseCases: "متى يناسبك هذا التمويل",
      sectionHow: "كيف يعمل عبر نسبة",
      sectionLenders: "ما تنظر إليه جهات التمويل",
      sectionDocs: "المستندات التي يُطلب توفيرها عادةً",
      sectionTips: "نصائح لتقوية طلبك",
      sectionFaq: "الأسئلة الشائعة",
      metaTitle: "تمويل المشاريع والعقود | نسبة",
      metaDescription:
        "تمويل تنفيذ العقود والمشاريع الموقّعة عبر جهات تمويل مرخصة. المستندات وما تراجعه الجهات ونصائح تقوية الطلب — عبر نسبة.",
    },
    en: {
      title: "Project & Contract Financing",
      tag: "To fund the execution of a signed contract or purchase order",
      intro:
        "Financing directed at executing a specific, pre-defined contract or project — usually linked to a delivery and payment schedule from the end client (Contract / Project Finance).",
      useCases: [
        { title: "Government or quasi-government contracts", desc: "Executing signed projects or purchase orders." },
        { title: "Large private-sector contracts", desc: "Supply or services under sizable contracts." },
        { title: "Project payment gaps", desc: "Bridging between execution costs and client payments." },
      ],
      howItWorks: [
        { title: "Attach the contract", desc: "Submit the signed contract or purchase order via Nesbah." },
        { title: "Parties & cash-flow review", desc: "Licensed lenders review the counterparty and payment schedule." },
        { title: "Review any available options", desc: "If a licensed provider chooses to proceed with your request, it may share an option you can review freely — no obligation." },
      ],
      whatLendersLookAt: [
        "A signed copy of the contract or purchase order",
        "The counterparty and its nature (government, quasi-government, private)",
        "Payment and delivery schedule",
        "Experience executing similar projects",
        "Expected project cash flows",
      ],
      documents: [
        "Valid copy of the commercial registration",
        "Signed copy of the contract or purchase order",
        "Payment/delivery schedule if available",
        "Bank statements (typically 6 – 12 months)",
        "Record of past project execution if available",
      ],
      tips: [
        "Make sure the end-client payment schedule is clear in the contract.",
        "Attach a short executive summary (scope, duration, deliverables).",
        "Clarify who the end client is and where their funding comes from.",
      ],
      faqs: [
        { q: "Must the contract be with a government entity?", a: "Not required — but the counterparty's nature matters for execution-risk assessment." },
        { q: "Can I be financed before signing the contract?", a: "Usually not — the signed contract or PO is the basis for review." },
        { q: "Can the request be supported by Kafalah?", a: "Yes, this product is often reviewed with Kafalah program support." },
      ],
      notLenderNote:
        "Nesbah is not a bank or finance company and does not make credit decisions. Our role is to route your request to licensed financing providers in the Kingdom.",
      ctaApply: "Apply for project financing",
      ctaGuide: "Explore the Financing Guide",
      breadcrumbHome: "Home",
      breadcrumbProducts: "Financing products",
      sectionUseCases: "When it fits your business",
      sectionHow: "How it works with Nesbah",
      sectionLenders: "What lenders review",
      sectionDocs: "Documents commonly requested",
      sectionTips: "Tips to strengthen your request",
      sectionFaq: "FAQ",
      metaTitle: "Project & Contract Financing | Nesbah",
      metaDescription:
        "Contract and project financing for signed contracts and POs through licensed lenders — documents, review criteria, and tips via Nesbah.",
    },
  },
  commercial_real_estate: {
    code: "commercial_real_estate",
    ar: {
      title: "التمويل العقاري التجاري",
      tag: "لشراء أو تطوير عقار لغرض النشاط",
      intro:
        "تمويل طويل الأجل لاقتناء أو تطوير عقار يخدم النشاط التجاري للمنشأة (محل، معرض، مستودع، مبنى إداري).",
      useCases: [
        { title: "اقتناء مقر تشغيلي", desc: "شراء عقار لخدمة النشاط بدلاً من الإيجار." },
        { title: "شراء مستودع أو معرض", desc: "توسيع العمليات اللوجستية أو المعارض." },
        { title: "تطوير أو تجهيز عقار", desc: "أعمال تطوير عقار لاستخدامه ضمن نشاط الشركة." },
      ],
      howItWorks: [
        { title: "حدّد العقار والغرض", desc: "أرفق تفاصيل العقار والغرض من الاقتناء." },
        { title: "دراسة العقار والنشاط", desc: "قد تطلب الجهات المرخصة تقييماً عقارياً معتمداً." },
        { title: "راجع أي خيارات متاحة", desc: "إذا قررت إحدى الجهات المرخصة المضي في دراسة الطلب، فقد تشارك خياراً يمكنك مراجعته بحرية وبدون التزام." },
      ],
      whatLendersLookAt: [
        "الغرض من العقار وموقعه ومدى ملاءمته للنشاط",
        "وثائق ملكية العقار أو صك البيع المبدئي",
        "تقييم عقاري معتمد عند الطلب",
        "الأداء المالي والتشغيلي للمنشأة",
        "خبرة المنشأة في القطاع",
      ],
      documents: [
        "نسخة سارية من السجل التجاري",
        "صك الملكية أو عرض البيع المبدئي",
        "دراسة استخدام العقار للنشاط (اختياري)",
        "كشوفات حساب بنكي (عادةً ١٢ شهراً)",
        "القوائم المالية للسنة الأخيرة إن توفرت",
      ],
      tips: [
        "حدّد بوضوح كيف سيخدم العقار نشاطك (فرع تشغيلي، مستودع، مقر).",
        "احرص على استكمال المستندات العقارية قبل التقديم.",
        "احتفظ بنسخ رقمية عالية الجودة من صك الملكية.",
      ],
      faqs: [
        { q: "هل يشمل التمويل تطوير عقار قائم؟", a: "نعم في كثير من الحالات، بحسب سياسة الممول ووثائق العقار." },
        { q: "هل مدة التمويل طويلة؟", a: "غالباً طويلة الأجل مقارنة ببقية المنتجات، بسبب طبيعة الأصل العقاري." },
        { q: "هل يشترط تقييم معتمد؟", a: "قد يطلب الممول تقييماً عقارياً معتمداً كجزء من الدراسة." },
      ],
      notLenderNote:
        "نسبة ليست بنكاً أو شركة تمويل، ولا تتخذ قرارات ائتمانية. دورنا هو تسهيل إيصال طلبك إلى جهات تمويل مرخصة في المملكة.",
      ctaApply: "قدّم طلب تمويل عقاري تجاري",
      ctaGuide: "استكشف دليل التمويل",
      breadcrumbHome: "الرئيسية",
      breadcrumbProducts: "أنواع التمويل",
      sectionUseCases: "متى يناسبك هذا التمويل",
      sectionHow: "كيف يعمل عبر نسبة",
      sectionLenders: "ما تنظر إليه جهات التمويل",
      sectionDocs: "المستندات التي يُطلب توفيرها عادةً",
      sectionTips: "نصائح لتقوية طلبك",
      sectionFaq: "الأسئلة الشائعة",
      metaTitle: "التمويل العقاري التجاري للشركات | نسبة",
      metaDescription:
        "تمويل عقاري تجاري لاقتناء أو تطوير مقر أو مستودع أو معرض عبر جهات تمويل مرخصة — المستندات والنصائح عبر نسبة.",
    },
    en: {
      title: "Commercial Real Estate Financing",
      tag: "To buy or develop property for business use",
      intro:
        "Long-term financing to acquire or develop property that serves the company's business (shop, showroom, warehouse, office building).",
      useCases: [
        { title: "Acquiring an operating premises", desc: "Buying property to serve operations instead of renting." },
        { title: "Warehouses or showrooms", desc: "Expanding logistics or retail footprint." },
        { title: "Property development or fit-out", desc: "Developing a property for business use." },
      ],
      howItWorks: [
        { title: "Define property and purpose", desc: "Attach property details and the purpose of acquisition." },
        { title: "Property & activity review", desc: "Lenders may request a certified property valuation." },
        { title: "Review any available options", desc: "If a licensed provider chooses to proceed with your request, it may share an option you can review freely — no obligation." },
      ],
      whatLendersLookAt: [
        "Property purpose, location, and fit for the business",
        "Property title documents or an initial sale offer",
        "Certified property valuation when requested",
        "Financial and operational performance",
        "Sector experience",
      ],
      documents: [
        "Valid copy of the commercial registration",
        "Title deed or initial sale offer",
        "Optional study of the property's business use",
        "Bank statements (typically 12 months)",
        "Financial statements for the last year if available",
      ],
      tips: [
        "Explain clearly how the property will serve your business (branch, warehouse, HQ).",
        "Complete property documents before applying.",
        "Keep high-quality digital copies of the title deed.",
      ],
      faqs: [
        { q: "Does it cover developing an existing property?", a: "Often yes, depending on the lender's policy and property documents." },
        { q: "Is the tenor long?", a: "Usually longer than other products because of the property nature." },
        { q: "Is a certified valuation required?", a: "The lender may request a certified valuation as part of the review." },
      ],
      notLenderNote:
        "Nesbah is not a bank or finance company and does not make credit decisions. Our role is to route your request to licensed financing providers in the Kingdom.",
      ctaApply: "Apply for commercial real estate financing",
      ctaGuide: "Explore the Financing Guide",
      breadcrumbHome: "Home",
      breadcrumbProducts: "Financing products",
      sectionUseCases: "When it fits your business",
      sectionHow: "How it works with Nesbah",
      sectionLenders: "What lenders review",
      sectionDocs: "Documents commonly requested",
      sectionTips: "Tips to strengthen your request",
      sectionFaq: "FAQ",
      metaTitle: "Commercial Real Estate Financing | Nesbah",
      metaDescription:
        "Commercial real estate financing to buy or develop premises, warehouses, or offices through licensed lenders — documents and tips via Nesbah.",
    },
  },
  pos: {
    code: "pos",
    ar: {
      title: "تمويل نقاط البيع (POS)",
      tag: "مبني على سجل مبيعاتك عبر نقاط البيع",
      intro:
        "تمويل قصير الأجل يعتمد بشكل رئيسي على سجل مبيعات المنشأة عبر أجهزة نقاط البيع، حيث يُقدَّر التمويل بناءً على انتظام وحجم المبيعات المرصودة.",
      useCases: [
        { title: "المطاعم والكافيهات", desc: "تحسين رأس المال العامل خلال المواسم." },
        { title: "التجزئة والخدمات", desc: "تمويل مبني على المبيعات اليومية عبر نقاط البيع." },
        { title: "منشآت متعددة الفروع", desc: "الاستفادة من سجل مبيعات موزّع على عدة أجهزة." },
      ],
      howItWorks: [
        { title: "شغّل نقاط البيع بانتظام", desc: "مبيعاتك عبر الجهاز هي أساس دراسة الطلب." },
        { title: "قدّم كشوفات نقاط البيع", desc: "أرفق كشوفات آخر ٦ – ١٢ شهراً." },
        { title: "راجع أي خيارات متاحة", desc: "إذا قررت إحدى الجهات المرخصة المضي في دراسة الطلب، فقد تشارك خياراً يمكنك مراجعته بحرية وبدون التزام." },
      ],
      whatLendersLookAt: [
        "انتظام وحجم مبيعات نقاط البيع عبر آخر عدة أشهر",
        "مدة استخدام نقاط البيع",
        "طبيعة القطاع (تجزئة، مطاعم، خدمات)",
        "عمر السجل التجاري",
        "التاريخ الائتماني للمنشأة",
      ],
      documents: [
        "نسخة سارية من السجل التجاري",
        "كشوفات نقاط البيع (عادةً ٦ – ١٢ شهراً)",
        "كشوفات حساب بنكي (عادةً ٦ – ١٢ شهراً)",
        "إقرارات ضريبة القيمة المضافة إن وُجدت",
        "الهوية الوطنية للمالك",
      ],
      tips: [
        "حاول تقديم ١٢ شهراً من كشوفات نقاط البيع بدلاً من ٣ أشهر لتقوية السجل.",
        "احرص على أن تمرّ مبيعاتك عبر جهاز نقاط البيع بشكل منتظم.",
        "احتفظ بجميع جلسات نهاية اليوم (Z-reports) إن أمكن.",
        "وضّح إن كان لديك أكثر من فرع أو أكثر من جهاز نقاط بيع.",
      ],
      faqs: [
        { q: "كم يجب أن يكون عمر نقاط البيع لديّ؟", a: "كلما زاد سجل الاستخدام كان الطلب أقوى؛ عادةً يُفضّل توفر ٦ أشهر على الأقل." },
        { q: "هل السداد يخصم من مبيعات نقاط البيع؟", a: "هذه من نماذج السداد المتاحة لدى بعض الممولين وليست إلزامية دائماً." },
        { q: "هل يشمل التمويل عدة فروع؟", a: "نعم عادةً، مع توضيح مصادر المبيعات لكل جهاز." },
      ],
      notLenderNote:
        "نسبة ليست بنكاً أو شركة تمويل، ولا تتخذ قرارات ائتمانية. دورنا هو تسهيل إيصال طلبك إلى جهات تمويل مرخصة في المملكة.",
      ctaApply: "قدّم طلب تمويل نقاط بيع",
      ctaGuide: "استكشف دليل التمويل",
      breadcrumbHome: "الرئيسية",
      breadcrumbProducts: "أنواع التمويل",
      sectionUseCases: "متى يناسبك هذا التمويل",
      sectionHow: "كيف يعمل عبر نسبة",
      sectionLenders: "ما تنظر إليه جهات التمويل",
      sectionDocs: "المستندات التي يُطلب توفيرها عادةً",
      sectionTips: "نصائح لتقوية طلبك",
      sectionFaq: "الأسئلة الشائعة",
      metaTitle: "تمويل نقاط البيع (POS) للمنشآت | نسبة",
      metaDescription:
        "تمويل نقاط البيع مبني على سجل مبيعاتك عبر جهات تمويل مرخصة. المستندات، وما تنظر إليه الجهات، ونصائح تقوية الطلب — عبر نسبة.",
    },
    en: {
      title: "POS Financing",
      tag: "Based on your point-of-sale sales history",
      intro:
        "A short-term product that relies mainly on the business's sales history through POS devices — the financing is estimated based on the consistency and volume of observed sales.",
      useCases: [
        { title: "Restaurants and cafés", desc: "Boost working capital during seasons." },
        { title: "Retail and services", desc: "Financing tied to daily POS sales." },
        { title: "Multi-branch businesses", desc: "Aggregating a sales record across several devices." },
      ],
      howItWorks: [
        { title: "Run POS regularly", desc: "Your device sales are the basis of the review." },
        { title: "Submit POS statements", desc: "Attach the last 6 – 12 months of POS statements." },
        { title: "Review any available options", desc: "If a licensed provider chooses to proceed with your request, it may share an option you can review freely — no obligation." },
      ],
      whatLendersLookAt: [
        "POS sales consistency and volume over recent months",
        "How long POS has been in use",
        "Sector (retail, restaurants, services)",
        "Age of the commercial registration",
        "Credit history",
      ],
      documents: [
        "Valid copy of the commercial registration",
        "POS statements (typically 6 – 12 months)",
        "Bank statements (typically 6 – 12 months)",
        "VAT returns if applicable",
        "National ID of the owner",
      ],
      tips: [
        "Provide 12 months of POS statements rather than 3 to strengthen the record.",
        "Make sure your sales consistently pass through the POS device.",
        "Keep end-of-day Z-reports where possible.",
        "Clarify if you have multiple branches or devices.",
      ],
      faqs: [
        { q: "How long should my POS history be?", a: "The longer the record the stronger the request; at least 6 months is usually preferred." },
        { q: "Is repayment deducted from POS sales?", a: "Some lenders offer that model — it isn't always mandatory." },
        { q: "Does it cover multiple branches?", a: "Yes, typically — with a clear breakdown of sales per device." },
      ],
      notLenderNote:
        "Nesbah is not a bank or finance company and does not make credit decisions. Our role is to route your request to licensed financing providers in the Kingdom.",
      ctaApply: "Apply for POS financing",
      ctaGuide: "Explore the Financing Guide",
      breadcrumbHome: "Home",
      breadcrumbProducts: "Financing products",
      sectionUseCases: "When it fits your business",
      sectionHow: "How it works with Nesbah",
      sectionLenders: "What lenders review",
      sectionDocs: "Documents commonly requested",
      sectionTips: "Tips to strengthen your request",
      sectionFaq: "FAQ",
      metaTitle: "POS Financing for SMEs | Nesbah",
      metaDescription:
        "POS financing based on your point-of-sale sales history through licensed lenders — documents, review criteria, and tips via Nesbah.",
    },
  },
};

export const PRODUCT_CODES = [
  "corporate",
  "working_capital",
  "expansion",
  "equipment",
  "project",
  "commercial_real_estate",
  "pos",
];

export function isProductCode(code) {
    return PRODUCT_CODES.includes(code);
}
