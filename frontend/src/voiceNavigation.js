const navigationAliases = {
  dashboard: ['home', 'homepage', 'my dashboard', 'overview'],
  janavani: ['janavani ai', 'janavani', 'government information assistant'],
  'civic-eye': ['civic eye', 'complaint registration', 'submit a complaint', 'complaint status', 'road damage report'],
  'seva-agent': ['seva agent', 'application checklist', 'service application help'],
  'satya-check': ['satya check', 'fact check', 'verify a source', 'source verification'],
  'opportunity-hub': ['scholarship portal', 'scholarships', 'scholarship section', 'opportunity hub', 'government scheme finder'],
  'loan-connect': ['loan connect ai', 'loan connect', 'emi calculator', 'loan services'],
  'opportunity-radar': ['opportunity radar', 'scheme updates', 'official updates', 'government update monitor'],
  'civic-brain': ['civic brain', 'service search', 'search services'],
  'civic-docs': ['civic docs ai', 'civic docs', 'document services', 'document checklist', 'documents'],
  'civic-alert': ['civic alert', 'notifications', 'notification centre', 'reminders'],
  bengaluru: ['bengaluru 360', 'bengaluru', 'bangalore 360', 'bmtc', 'bengaluru services'],
  'travel-hub': ['civic travel and booking hub', 'travel booking', 'travel and booking', 'travel hub', 'tourist destinations', 'tourism', 'train booking'],
  'regional-status': ['regional status', 'regional dashboard', 'regional information', 'region status'],
}

const portalDirectory = [
  { id: 'income-certificate', label: 'Income Certificate portal', href: 'https://sevasindhu.karnataka.gov.in/', aliases: ['income certificate', 'income certificate portal', 'income proof'] },
  { id: 'caste-certificate', label: 'Caste Certificate portal', href: 'https://sevasindhu.karnataka.gov.in/', aliases: ['caste certificate', 'caste certificate portal'] },
  { id: 'residence-certificate', label: 'Residence Certificate portal', href: 'https://sevasindhu.karnataka.gov.in/', aliases: ['residence certificate', 'domicile certificate', 'residence certificate portal'] },
  { id: 'scholarship-portal', label: 'National Scholarship Portal', href: 'https://scholarships.gov.in/', aliases: ['scholarship portal', 'scholarships portal', 'national scholarship portal'] },
  { id: 'grievance-portal', label: 'Karnataka Public Grievance portal', href: 'https://ipgrs.karnataka.gov.in/Citizens/GrievanceSelfService', aliases: ['grievance portal', 'public grievance portal', 'complaint portal'] },
]

const localizedAliases = {
  janavani: ['ಜನವಾಣಿ'],
  'civic-eye': ['ನಾಗರಿಕ ದೂರು', 'ದೂರು ದಾಖಲಿಸಿ', 'शिकायत दर्ज करें', 'नागरिक शिकायत', 'புகார் பதிவு', 'ఫిర్యాదు నమోదు', 'പരാതി നൽകുക'],
  'seva-agent': ['ಸೇವಾ ಏಜೆಂಟ್', 'सेवा एजेंट', 'சேவை உதவியாளர்', 'సేవా సహాయకుడు', 'സേവാ സഹായി'],
  'satya-check': ['ಸತ್ಯ ಪರಿಶೀಲನೆ', 'सत्य जांच', 'உண்மை சரிபார்ப்பு', 'నిజ నిర్ధారణ', 'വസ്തുത പരിശോധിക്കുക'],
  'opportunity-hub': ['ವಿದ್ಯಾರ್ಥಿವೇತನ', 'ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್', 'छात्रवृत्ति', 'छात्रवृत्ति पोर्टल', 'உதவித்தொகை', 'உதவித்தொகை தளம்', 'స్కాలర్‌షిప్', 'స్కాలర్‌షిప్ పోర్టల్', 'സ്കോളർഷിപ്പ്', 'സ്കോളർഷിപ്പ് പോർട്ടൽ'],
  'loan-connect': ['ಸಾಲ ಸಂಪರ್ಕ', 'ಸಾಲ ಲೆಕ್ಕಾಚಾರ', 'ऋण सेवा', 'ऋण कैलकुलेटर', 'கடன் சேவை', 'లోన్ సేవలు', 'വായ്പ സേവനങ്ങൾ'],
  'opportunity-radar': ['ಅವಕಾಶ ಮಾಹಿತಿ', 'योजना अपडेट', 'सरकारी अपडेट', 'திட்ட அறிவிப்புகள்', 'పథకం నవీకరణలు', 'പദ്ധതി അപ്‌ഡേറ്റുകൾ'],
  'civic-brain': ['ಸೇವೆಗಳ ಹುಡುಕಾಟ', 'सेवा खोजें', 'சேவைகளைத் தேடு', 'సేవలను వెతకండి', 'സേവകൾ തിരയുക'],
  'civic-docs': ['ದಾಖಲೆ ಸೇವೆಗಳು', 'ದಾಖಲೆಗಳ ಪಟ್ಟಿ', 'दस्तावेज़ सेवा', 'दस्तावेज़ चेकलिस्ट', 'ஆவண சேவைகள்', 'ஆவண பட்டியல்', 'పత్రాల సేవలు', 'పత్రాల జాబితా', 'രേഖാ സേവനങ്ങൾ', 'രേഖകളുടെ പട്ടിക'],
  'civic-alert': ['ಅಧಿಸೂಚನೆಗಳು', 'ಜ್ಞಾಪನೆಗಳು', 'सूचनाएं', 'रिमाइंडर', 'அறிவிப்புகள்', 'நினைவூட்டல்கள்', 'నోటిఫికేషన్లు', 'రిమైండర్లు', 'അറിയിപ്പുകൾ', 'ഓർമ്മപ്പെടുത്തലുകൾ'],
  bengaluru: ['ಬೆಂಗಳೂರು 360', 'ಬೆಂಗಳೂರು ಸೇವೆಗಳು', 'बेंगलुरु सेवाएं', 'பெங்களூரு சேவைகள்', 'బెంగళూరు సేవలు', 'ബെംഗളൂരു സേവനങ്ങൾ'],
  'travel-hub': ['ಪ್ರಯಾಣ ಮತ್ತು ಬುಕಿಂಗ್', 'ಪ್ರವಾಸೋದ್ಯಮ', 'यात्रा बुकिंग', 'पर्यटन', 'பயண முன்பதிவு', 'சுற்றுலா', 'ప్రయాణ బుకింగ్', 'పర్యాటకం', 'യാത്രാ ബുക്കിംഗ്', 'വിനോദസഞ്ചാരം'],
  'regional-status': ['ಪ್ರಾದೇಶಿಕ ಸ್ಥಿತಿ', 'ಪ್ರದೇಶದ ಮಾಹಿತಿ', 'क्षेत्रीय स्थिति', 'क्षेत्र की जानकारी', 'பிராந்திய நிலை', 'பகுதி தகவல்', 'ప్రాంతీయ స్థితి', 'ప్రాంత సమాచారం', 'പ്രാദേശിക നില', 'പ്രദേശ വിവരങ്ങൾ'],
}

const additionalLocalizedAliases = {
  dashboard: ['ಮುಖಪುಟ', 'डैशबोर्ड', 'முகப்பு', 'డ్యాష్‌బోర్డ్', 'ഡാഷ്ബോർഡ്', 'डॅशबोर्ड', 'ড্যাশবোর্ড', 'ડેશબોર્ડ', 'ਡੈਸ਼ਬੋਰਡ', 'ڈیش بورڈ'],
  janavani: ['जनवाणी', 'ஜனவாணி', 'జనవాణి', 'ജനവാണി', 'জনবাণী', 'જનવાણી', 'ਜਨਵਾਣੀ', 'جن وانی', 'सरकारी सेवाएं', 'সরকারি পরিষেবা', 'સરકારી સેવાઓ', 'ਸਰਕਾਰੀ ਸੇவਾਵਾਂ', 'سرکاری خدمات'],
  'civic-eye': ['तक्रार नोंदवा', 'नागरिक तक्रार', 'অভিযোগ জানান', 'নাগরিক অভিযোগ', 'ફરિયાદ નોંધાવો', 'નાગરિક ફરિયાદ', 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ', 'ਨਾਗਰਿਕ ਸ਼ਿਕਾਇਤ', 'شکایت درج کریں', 'شہری شکایت', 'പൗര പരാതി', 'పౌర ఫిర్యాదు'],
  'seva-agent': ['सेवा सहाय्यक', 'সেবা সহায়ক', 'સેવા સહાયક', 'ਸੇਵਾ ਸਹਾਇਕ', 'سروس اسسٹنٹ'],
  'satya-check': ['तथ्य तपासा', 'তথ্য যাচাই', 'તથ્ય તપાસો', 'ਤੱਥ ਜਾਂਚੋ', 'حقیقت کی جانچ'],
  'opportunity-hub': ['शिष्यवृत्ती पोर्टल', 'शिष्यवृत्ती', 'বৃত্তি পোর্টাল', 'বৃত্তি', 'શિષ્યવૃત્તિ પોર્ટલ', 'શિષ્યવૃત્તિ', 'ਵਜ਼ੀਫ਼ਾ ਪੋਰਟਲ', 'ਵਜ਼ੀਫ਼ਾ', 'اسکالرشپ پورٹل', 'اسکالرشپ'],
  'loan-connect': ['कर्ज सेवा', 'কর্জ পরিষেবা', 'ঋণ পরিষেবা', 'લોન સેવા', 'ਕਰਜ਼ਾ ਸੇਵਾ', 'قرض کی خدمات'],
  'opportunity-radar': ['योजना अद्यतने', 'सरकारी अद्यतने', 'সরকারি হালনাগাদ', 'প্রকল্পের খবর', 'યોજના અપડેટ', 'સરકારી અપડેટ', 'ਸਰਕਾਰੀ ਅੱਪਡੇਟ', 'યੋਜના અપડેટ', 'سرکاری تازہ کاری', 'اسکیم کی خبریں'],
  'civic-brain': ['सेवा शोधा', 'পরিষেবা খুঁজুন', 'સેવાઓ શોધો', 'ਸੇਵਾਵਾਂ ਲੱਭੋ', 'خدمات تلاش کریں'],
  'civic-docs': ['कागदपत्र सेवा', 'कागदपत्रांची यादी', 'নথি পরিষেবা', 'নথির তালিকা', 'દસ્તાવેજ સેવા', 'દસ્તાવેજોની યાદી', 'ਦਸਤਾਵੇਜ਼ ਸੇਵਾਵਾਂ', 'ਦਸਤਾਵੇਜ਼ਾਂ ਦੀ ਸੂਚੀ', 'دستاویزات کی خدمات', 'دستاویزات کی فہرست'],
  'civic-alert': ['सूचना', 'आठवणी', 'বিজ্ঞপ্তি', 'অনুস্মারক', 'સૂચનાઓ', 'રીમાઇન્ડર', 'ਸੂਚਨਾਵਾਂ', 'یاد دہانیاں', 'اطلاعات'],
  bengaluru: ['बेंगळुरू सेवा', 'বেঙ্গালুরু পরিষেবা', 'બેંગલુરુ સેવાઓ', 'ਬੈਂਗਲੁਰੂ ਸੇਵਾਵਾਂ', 'بنگلورو خدمات'],
  'travel-hub': ['प्रवास बुकिंग', 'ভ্রমণ বুকিং', 'পর্যটন', 'મુસાફરી બુકિંગ', 'પ્રવાસન', 'ਯਾਤਰਾ ਬੁਕਿੰਗ', 'ਸੈਰ ਸਪਾਟਾ', 'سفر کی بکنگ', 'سیاحت'],
  'regional-status': ['प्रादेशिक स्थिती', 'प्रदेशाची माहिती', 'আঞ্চলিক অবস্থা', 'অঞ্চলের তথ্য', 'પ્રાદેશિક સ્થિતિ', 'પ્રદેશની માહિતી', 'ਖੇਤਰੀ ਸਥਿਤੀ', 'ਇਲਾਕੇ ਦੀ ਜਾਣਕਾਰੀ', 'علاقائی صورتحال', 'علاقے کی معلومات'],
}

const commandVerbs = [
  'open', 'show', 'take me', 'go to', 'navigate to', 'bring up', 'view',
  'ತೆರೆ', 'ತೆರೆಯಿರಿ', 'ತೋರಿಸು', 'ತೋರಿಸಿ', 'ಗೆ ಹೋಗಿ',
  'खोलो', 'खोलिए', 'दिखाओ', 'दिखाइए', 'ले चलो', 'पर जाएं',
  'திற', 'திறக்கவும்', 'காட்டு', 'காண்பி', 'செல்',
  'తెరువు', 'తెరవండి', 'చూపించు', 'చూపండి', 'వెళ్ళు',
  'തുറക്കൂ', 'തുറക്കുക', 'കാണിക്കൂ', 'കാണിക്കുക', 'പോകൂ',
  'उघडा', 'दाखवा', 'जा', 'খুলুন', 'দেখান', 'যান', 'ખોલો', 'બતાવો', 'જાઓ',
  'ਖੋਲ੍ਹੋ', 'ਦਿਖਾਓ', 'ਜਾਓ', 'کھولیں', 'دکھائیں', 'جائیں',
]

const commandPattern = new RegExp(
  `(?:^|\\s)(?:${commandVerbs.map(escapeRegExp).join('|')})(?:\\s|$)`,
  'iu',
)

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeText(value) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[.,!?;:"“”'’()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesPhrase(text, phrase) {
  const normalizedPhrase = normalizeText(phrase)
  if (!normalizedPhrase) return false
  const escaped = escapeRegExp(normalizedPhrase).replace(/\s+/g, '\\s+')
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'iu').test(text)
}

export function resolveVoiceNavigation(text, navigationItems) {
  const normalized = normalizeText(text)
  if (!normalized) return { type: 'none' }
  const actionRequested = commandPattern.test(normalized)

  if (actionRequested) {
    const portal = portalDirectory
      .map((item) => ({ ...item, match: item.aliases.find((alias) => matchesPhrase(normalized, alias)) }))
      .filter((item) => item.match)
      .sort((left, right) => right.match.length - left.match.length)[0]
    if (portal) return { type: 'portal', id: portal.id, label: portal.label, href: portal.href }
  }

  const registry = navigationItems.map((item) => ({
    ...item,
    aliases: [
      item.label,
      ...(navigationAliases[item.id] || []),
      ...(localizedAliases[item.id] || []),
      ...(additionalLocalizedAliases[item.id] || []),
    ],
  }))

  if (!actionRequested) {
    const exactMatch = registry.find((item) => item.aliases.some((phrase) => normalized === normalizeText(phrase)))
    if (exactMatch) return { type: 'navigate', id: exactMatch.id, label: exactMatch.label }
    return { type: 'none' }
  }

  const matches = registry.flatMap((item) => item.aliases
    .filter((phrase) => matchesPhrase(normalized, phrase))
    .map((phrase) => ({ id: item.id, label: item.label, phrase: normalizeText(phrase).length })))
    .sort((left, right) => right.phrase - left.phrase)

  if (matches.length) {
    const best = matches[0]
    const conflicting = matches.some((item) => item.id !== best.id && item.phrase === best.phrase)
    if (conflicting) return { type: 'clarify', candidates: [...new Set(matches.filter((item) => item.phrase === best.phrase).map((item) => item.label))] }
    return { type: 'navigate', id: best.id, label: best.label }
  }

  const authDestination = /\b(register|registration|sign up|create an account)\b|ಖಾತೆ ತೆರೆಯಿರಿ|नोंदणी|खाता बनाएं|নিবন্ধন করুন|নવું ખાતું બનાવો|ਰਜਿਸਟਰ ਕਰੋ|اکاؤنٹ بنائیں|பதிவு செய்ய|నమోదు చేయ|രജിസ്റ്റർ ചെയ്യ/iu.test(normalized)
    ? 'register'
    : /\b(login|log in|sign in)\b|ಲಾಗಿನ್|लॉगिन|साइन इन|লগইন|লগ ইন|લૉગિન|ਸਾਈਨ ਇਨ|لاگ ان|உள்நுழை|లాగిన్|ലോഗിൻ/iu.test(normalized)
      ? 'login'
      : null
  const localizedRegistration = /ನೋಂದಣಿ|رجسٹر کریں/iu.test(normalized)
  if ((authDestination || localizedRegistration) && commandPattern.test(normalized)) {
    return { type: 'auth', mode: authDestination || 'register' }
  }

  if (!actionRequested) return { type: 'none' }
  if (/\b(profile|my account|account settings)\b|ಪ್ರೊಫೈಲ್|प्रोफ़ाइल|প্রোফাইল|પ્રોફાઇલ|ਪ੍ਰੋਫਾਈਲ|پروفائل|சுயவிவரம்|ప్రొఫైల్|പ്രൊഫൈൽ/iu.test(normalized)) {
    return { type: 'profile' }
  }
  if (/\bgovernment services\b|सरकारी सेवाएं|அரசு சேவைகள்|ప్రభుత్వ సేవలు|സർക്കാർ സേവനങ്ങൾ/iu.test(normalized)) {
    return { type: 'navigate', id: 'janavani', label: registry.find((item) => item.id === 'janavani')?.label || 'Janavani AI' }
  }

  const routeTerms = registry.flatMap((item) => item.aliases.map((phrase) => normalizeText(phrase)))
  if (/\b(route|page|section|portal|service|dashboard)\b|ಪುಟ|पेज|பக்கம்|పేజీ|പേജ്/iu.test(normalized)
      || routeTerms.some((phrase) => normalized.includes(phrase))) {
    return { type: 'clarify', candidates: registry.map((item) => item.label) }
  }
  return { type: 'none' }
}
