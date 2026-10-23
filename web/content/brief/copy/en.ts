import type { BriefCopy } from './types';
import { DATE_EN } from '@/components/ui/date-text';

/** 영어 문구 — 영어권 여러 나라(미국·영국·캐나다·호주)의 작은 가게 사장님(명세 2·7절).
 *  사장님에게는 you, 업체에게 가는 문서는 사장님이 쓰는 말(I/we). 과장·슬롭 낱말 없이 짧게. 이유 문장에 금액을 쓰지 않는다(배수는 2–4x만).
 *  한국 전용 서비스는 역할이 같은 영어권 서비스 이름으로(명세 3-2). 한글은 언어 바꾸기 링크 이름(switchTo.label) 하나뿐.
 *  모든 문구는 합치기 전에 사용자 확인(Task 9) */
const full = new Intl.DateTimeFormat('en', { dateStyle: 'full' });
const long = new Intl.DateTimeFormat('en', { dateStyle: 'long' });
/** 「2026-11-10」 → 「Tuesday, November 10, 2026」 — 숫자만 쓴 날짜는 나라마다 순서가 달라 쓰지 않는다 */
const dayEn = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return full.format(new Date(y, m - 1, d));
};
const dateEn = (d: Date) => long.format(d);

export const en: BriefCopy = {
  locale: 'en',
  q: {
    mode: { title: 'Are you building a new website or redoing the one you have?', opts: { new: 'Build a new website', renew: 'Redo my current website' } },
    renew: {
      title: 'About your current website',
      url: 'Current website address (optional)',
      pain: 'What bothers you most about it? (optional)',
      amountLabel: 'How much text and how many photos need to move over?',
      amount: { few: 'A little (10 pages or posts or fewer)', some: 'Some', many: 'A lot (over 100)', unknown: 'Not sure' },
      amountWhy: 'Each page and photo from the old site has to be moved by hand, so the price goes up.',
    },
    kind: {
      title: 'What kind of business is it?',
      help: 'Please pick one. It goes at the top of the brief.',
      opts: { shop: 'Shop (restaurant, café…)', appointment: 'Takes appointments (clinic, salon, tutoring…)', brand: 'Brand or product', office: 'Company or office', other: 'Something else' },
      otherLabel: 'What kind of business?',
      name: 'Business name (optional)',
      nameHelp: 'Only used in the brief. It is not sent anywhere.',
    },
    goal: {
      title: 'What is the one thing visitors must be able to do on your website?',
      help: 'Pick the most important one. You can add other things below.',
      opts: { call: 'Call us', inquire: 'Send an inquiry', book: 'Book', visit: 'Find and visit us', buy: 'Buy products', news: 'Read our news' },
      more: 'Anything else they should be able to do? (optional)',
    },
    audience: { title: 'Who visits the website most?', help: 'You can pick more than one.', opts: { new: 'New customers', regular: 'Regulars', business: 'Business clients', foreign: 'Visitors from abroad', unknown: 'Not sure' } },
    pages: {
      title: 'Which pages do you need?',
      help: 'Think of them as the names in your menu.',
      opts: { about: 'About', menu: 'Menu or services', pricing: 'Prices', location: 'Location', news: 'News', gallery: 'Photos or portfolio', reviews: 'Reviews', faq: 'FAQ', contact: 'Contact', careers: 'Careers' },
      extra: 'Other pages you need (separate with commas)',
      manyWhy: 'When each page has its own layout, there are more pages to build, so the price goes up.',
    },
    features: {
      title: 'Which features does the website need?',
      help: 'For each one you pick, say whether it must be there at launch or can come later.',
      opts: { inquiry: 'Inquiry form', booking: 'Online booking', payment: 'Online payment', members: 'Member accounts', multilang: 'Pages in other languages', posts: 'Post updates yourself (news, notices)', chat: 'Chat button (WhatsApp, Messenger…)' },
      must: 'At launch', later: 'Later',
      unknown: 'I am not sure which features I need',
      extra: 'Other features you need',
      extraHelp: 'Anything not on the list. e.g. gift cards, a waitlist',
      why: {
        booking: 'Taking bookings on the website itself means building date and time picking and double-booking checks. Linking a booking app like Calendly or Square keeps the cost much lower.',
        payment: 'Taking payments on the website itself means connecting a payment service and building order screens. Linking a store elsewhere keeps the cost lower.',
        members: 'Logins also need sign-up, password reset and safe storage of personal data, so the price goes up.',
        multilang: 'Each extra language needs another copy of every page and text, so the price goes up.',
      },
      foreignSuggest: 'You said visitors from abroad use the site. Pick this if you need it.',
      booking: { label: 'How will you take bookings?', opts: { service: 'Link a booking app (Calendly, Square Appointments, OpenTable…)', builtin: 'On the website itself', unknown: 'Not sure' } },
      shopCount: { label: 'About how many products?', opts: { upTo10: '10 or fewer', upTo50: '50 or fewer', more: 'More than 50', unknown: 'Not sure' } },
      shopHow: { label: 'Where will you take payments?', opts: { store: 'A store elsewhere is enough (Etsy, Amazon, Shopify…)', builtin: 'On the website itself', unknown: 'Not sure' } },
      member: { label: 'Who will log in?', opts: { social: 'Sign in with Google or Apple', email: 'Sign up with email', adminOnly: 'Only admins', unknown: 'Not sure' } },
      langs: { label: 'Which languages do you need?', other: 'Other languages' },
    },
    links: {
      title: 'Do you use anything now that should connect to the website?',
      opts: { map: 'Google Business Profile', chat: 'WhatsApp or Messenger', instagram: 'Instagram', store: 'Online store (Etsy, Amazon, Shopify…)', delivery: 'Delivery apps (Uber Eats, DoorDash…)', none: 'None' },
      manyWhy: 'Each service has to be connected separately, so the price goes up.',
    },
    content: {
      title: 'How will you get the text and photos?',
      copyLabel: 'Text', copy: { self: 'I will write it', write: 'I want it written for me', unknown: 'Not sure' },
      photoLabel: 'Photos', photo: { have: 'I have them', none: 'I do not have them', unknown: 'Not sure' },
      by: 'If you are preparing them, by when can you send them? (optional)',
      why: 'Writing is often quoted separately from building the site.',
    },
    brand: {
      title: 'Do you have any design material already?',
      opts: { logo: 'Logo source file', colors: 'Set colors and fonts', print: 'Business cards, flyers or other print', none: 'None' },
      noneWhy: 'Designing a new logo costs extra.',
    },
    design: {
      title: 'How should the design be done?',
      opts: { template: 'A template is fine', custom: 'I want a custom design', existing: 'I already have a design', unknown: 'Not sure' },
      customWhy: 'A custom design usually costs about 2–4x a template.',
      refsLabel: 'Websites you like (up to 3, optional)',
      refUrl: (n) => `Website ${n} address`,
      likesLabel: 'What you like about it',
      likes: { color: 'Colors and mood', layout: 'Layout', content: 'Text and photos', motion: 'Motion', features: 'Features' },
      memo: 'Short note (optional)',
      dislikes: 'Anything you do not want (optional)',
    },
    ops: {
      title: 'After launch, what would you like to add or change yourself?',
      help: 'If you pick anything, the brief will say you need an admin page.',
      opts: { news: 'News and notices', photos: 'Photos', menu: 'Menu and prices', none: 'Nothing (the vendor can do it all)' },
    },
    own: {
      title: 'Whose name should the website be in?',
      help: 'Decide this up front so you keep your website even if you switch vendors or lose touch with them.',
      domain: { label: 'Domain (your website address)', why: 'If the vendor buys it in their name, you may not be able to take the address with you.', opts: { mine: 'In my name', vendor: 'Leave it to the vendor', unknown: 'Not sure' } },
      hosting: { label: 'Hosting account (the server your site runs on)', why: 'With your own account you can see the monthly cost and renewals yourself.', opts: { mine: 'In my name', vendor: 'Leave it to the vendor', unknown: 'Not sure' } },
      admin: { label: 'Admin account', why: 'You keep the main account and give the vendor a separate account for their work.', opts: { mine: 'I keep the main account', vendor: 'Leave it to the vendor', unknown: 'Not sure' } },
      source: { label: 'Source and design files', why: 'If you get them at launch, another vendor can pick up the work later.', opts: { get: 'Hand them over at launch', skip: 'Not needed', unknown: 'Not sure' } },
    },
    scope: {
      title: 'Want to agree on scope and costs up front?',
      revisionsLabel: 'Rounds of changes included', revisions: { '2': '2', '3': '3 (typical)', '5': '5', vendor: 'Let the vendor suggest' },
      careLabel: 'Care after launch', care: { monthly: 'Monthly plan', asNeeded: 'Only when needed', self: 'I will do it myself' },
      monthly: 'Ask for every monthly cost',
    },
    when: {
      title: 'Timing, budget and who decides',
      date: 'Launch date you want', dateUnknown: 'Not sure yet',
      fixedLabel: 'Does it have to launch on that date?', fixed: { must: 'Yes, it must launch on that date', wish: 'It is a target date' },
      budget: { kind: 'text', label: 'Your budget (optional)', hint: 'Write the amount and currency, e.g. $3,000 or £2,500.' },
      budgetIn: 'Put the budget in the brief',
      budgetHelp: 'If you share a budget, quotes sometimes rise to meet it.',
      deciderLabel: 'Who makes the final decision?', decider: { solo: 'Just me', group: 'Several people' },
      rushWhy: 'If the schedule has to be squeezed to hit the date, it can cost extra.',
    },
  },
  ui: {
    date: DATE_EN, sheetClose: 'Close',
    impactBadge: 'Big effect on price',
    dunno: 'Not sure',
    required: 'Please pick one',
    multiHint: '· You can pick more than one',
    prev: 'Back', next: 'Next', stepNext: 'Next question', toResult: 'Back to results', makeBrief: 'Make my brief',
    preview: 'Brief preview',
    phases: ['Your website', 'What you need', 'Content and design', 'Agreements'],
    phaseOf: (n, total) => `step ${n} of ${total}`,
    noStore: 'This browser cannot save your answers, so they will be lost if you reload.',
    previewEmpty: 'Your answers will show up here',
    langName: (c) => new Intl.DisplayNames('en', { type: 'language' }).of(c) ?? c,
  },
  intro: {
    title: 'Website Brief Builder',
    lead: 'Answer a few questions and get a brief you can send to any web designer. Then you can compare their quotes on the same terms.',
    promises: ['About 5 minutes', 'No sign-up or contact details', 'Answers stay on this device'],
    neutral: 'We do not recommend or refer you to any vendor.',
    start: 'Start',
    sampleCaption: 'A sample brief · made-up shop',
    stamp: 'Sample',
    rest: 'Cut short here · it goes on to timing, budget and questions for vendors',
    sampleName: 'Wren Hollow Bakery',   // Maple Lane Bakery 는 같은 이름의 실제 회사가 있어 바꿈(2026-10-23 검색)
    switchTo: { href: '/tools/brief', label: '한국어', lang: 'ko' },
  },
  doc: {
    title: (name) => `Website brief · ${name}`,
    untitled: 'Untitled',
    subtitle: (mode, today) => `${mode === 'renew' ? 'Website redesign' : 'New website'} · Written ${dateEn(today)}`,
    sections: {
      purpose: 'Purpose', renew: 'Current website', pages: 'Pages', features: 'Features', links: 'Services to connect', content: 'Text and photos', brand: 'Design material',
      design: 'Design', ops: 'After launch', own: 'Ownership', scope: 'Scope', when: 'Timing and decisions', budget: 'Budget', unknown: 'What I would like you to suggest',
    },
    rows: {
      kind: 'Business type', goalMain: 'Main thing visitors should do', goalMore: 'Other things visitors should do', audience: 'Main visitors',
      renewUrl: 'Address', renewPain: 'Problems', renewAmount: 'Content to move',
      pages: (n) => `${n} ${n === 1 ? 'page' : 'pages'}`, featuresExtra: 'Other', links: 'In use',
      copy: 'Text', photo: 'Photos', contentBy: 'Material ready by', brand: 'What I have',
      design: 'Approach', ref: (n) => `Reference site ${n}`, refLikes: (n) => `Site ${n}: what I like`, refMemo: (n) => `Site ${n}: note`, dislikes: 'What to avoid',
      opsWhat: 'What I will add or change myself', opsAdmin: 'Admin page',
      own: { domain: 'Domain', hosting: 'Hosting account', admin: 'Admin account', source: 'Source and design files' },
      revisions: 'Rounds of changes', care: 'Care after launch', openDate: 'Launch date', decider: 'Final decision', budget: 'Budget',
    },
    values: {
      goal: { call: 'Call us', inquire: 'Send an inquiry', book: 'Book', visit: 'Visit in person', buy: 'Buy products', news: 'Read our news' },
      amount: { few: 'Small (10 or fewer)', some: 'Medium (10–100)', many: 'Large (over 100)' },
      copy: { self: 'I will provide it', write: 'Please write it' },
      photo: { have: 'I have them', none: 'None yet' },
      design: { template: 'A template is fine', custom: 'Custom design', existing: 'Existing design (please follow it)' },
      own: {
        domain: { mine: 'In my name', vendor: 'Vendor handles it' },
        hosting: { mine: 'In my name', vendor: 'Vendor handles it' },
        admin: { mine: 'I keep the main account', vendor: 'Vendor handles it' },
        source: { get: 'Handed over at launch', skip: 'Not needed' },
      },
      care: { monthly: 'Monthly plan', asNeeded: 'Only when needed', self: 'I will do it myself' },
      decider: { solo: 'Me alone', group: 'Several people together' },
      brandNone: 'None',
      revisions: { '2': '2', '3': '3', '5': '5' },
      shopCount: { upTo10: 'Up to 10 products', upTo50: 'Up to 50 products', more: 'More than 50 products' },
      none: 'None', needed: 'Needed', noneAll: 'None (vendor handles everything)', openMust: ', must launch on this date', openWish: ', target date',
    },
    tags: { must: 'Needed at launch', later: 'Later' },
    unknown: {
      renewAmount: 'Content to move', audience: 'Main visitors', pages: 'Pages', features: 'Features', links: 'Services to connect', copy: 'Text', photo: 'Photos',
      brand: 'Design material', design: 'Design approach', ops: 'After launch', domain: 'Domain', hosting: 'Hosting account', admin: 'Admin account', source: 'Source and design files',
      revisions: 'Rounds of changes', care: 'Care after launch', openDate: 'Launch timing',
    },
    vendorLead: 'When you send your quote, please also answer these questions.',
    qPrefix: (n) => `Q${n}.`,
    formatDay: dayEn,
    formatToday: dateEn,
  },
  impact: {
    renewMany: 'A lot of content to move',
    pages: (n) => `${n} pages`,
    feature: (name, must) => `${name} (${must ? 'needed at launch' : 'later'})`,
    multilang: (n) => `Pages in other languages (${n} ${n === 1 ? 'language' : 'languages'})`,
    links: (n) => `${n} services to connect`,
    copyWrite: 'Text written for you',
    noLogo: 'No logo',
    custom: 'Custom design',
    rush: 'Must launch on a set date',
    bookingService: 'Linking a booking app keeps the cost lower. Building bookings into the website itself raises the price a lot.',
  },
  vendor: {
    revisions: 'How many rounds of changes are included?',
    monthly: 'Which costs will I pay each month after launch, and how much is each?',
    contact: 'If something needs fixing after launch, who do I contact, and how long does it usually take?',
    admin: 'What will I be able to change myself in the admin page?',
    bookingService: 'How would you connect the booking app?',
    bookingOther: 'How would you build the booking feature?',
    payment: 'What are the payment fees, and who signs up for the payment service?',
    translate: 'Is translating the text included?',
    existingDesign: 'Will you follow my existing design (colors, fonts, layout rules) as it is?',
    copyCost: 'Is writing the text included in the quote?',
    migrate: 'Is moving the text and photos from my current website included?',
    deadline: 'Can you launch by this date? What happens if it is late?',
  },
  summary: {
    mode: { new: 'New website', renew: 'Website redesign' },
    kind: 'Business type', name: 'Name', goal: 'Main thing visitors should do', must: 'Features needed at launch', extra: 'Other features',
    pages: (n) => `${n} ${n === 1 ? 'page' : 'pages'}`,
    open: 'Launch date', written: 'Written',
  },
  result: {
    impactTitle: 'What moves the price most',
    impactLegend: 'Rows marked like this in the brief are these items',
    impactNone: 'Nothing here moves the price much.',
    edit: 'Edit',
    editAria: (label) => `Edit ${label}`,
    vendorTitle: 'Questions to ask every vendor',
    vendorPrintLead: 'When you send your quote for this brief, please also answer these questions.',
    compareTitle: 'Compare the quotes you get',
    comparePrice: 'Quoted price',
    compareRows: { features: 'Includes must-have features', domain: 'Domain in my name', source: 'I get the source files', revisions: 'Rounds of changes', monthly: 'Monthly cost', openBy: 'Can launch by' },
    vendorName: (i) => `Vendor ${'ABC'[i]}`,   // i 는 0부터
    nameAria: (i) => `Vendor ${i + 1} name`,   // i 는 0부터
    cellAria: (vendor, row, value) => (value ? `${vendor} ${row}: ${value}` : `${vendor} ${row}`),
    yn: { yes: 'Yes', no: 'No', unset: '—', unsetAria: 'not set' },
    compareNote: 'This table is saved only on this device. It is not part of the brief you send.',
    pdf: 'Save as PDF', copy: 'Copy as text', share: 'Share', editAll: 'Edit answers', reset: 'Clear all',
    resetConfirm: 'Clear all your answers and the comparison table?',
    copied: 'Copied',
    inAppHint: 'Open this page in Safari or Chrome to save it as a PDF.',
    printFailed: 'The print window did not open. Open this page in Safari or Chrome to save a PDF, or copy the text below and send that.',
    copyBoxHelp: 'Press and hold to copy',
    privacy: 'What you enter stays on this device. We do not ask for contact details. We do not recommend or refer you to any vendor.',
  },
  end: {
    kind: 'mail', madeBy: 'Made by Prologue&', send: 'Send this brief to Prologue& too →', hint: 'Save the PDF first, then attach it to the email.',
    note: 'Opens your email app. Nothing is sent until you press send.',
    attachLine: '(Please attach the PDF you saved from the brief page before sending.)', toOwnership: 'Already have a website? Website Ownership Check →',
  },
  /* 한 줄 글자 수 — 실측(2026-10-23): 영어판 RICH·MID·MAX·MIN(tests/brief-ko.ts 세트의 자유 입력을 영어로) 넷을 두 가지로 —
     옮긴 말(대개 더 길다)과 한국어와 같은 글자 수(짧은 영어 답) — /en/tools/brief 에 채우고, 인쇄 미디어에서 용지 폭(A4 794px·Letter 816px)의
     문서 높이로 남는 px 와 page.pdf 쪽 수를 쟀다. 짧은 답일수록 줄 수 어림이 작아 덜 줄어든다. 가장 빠듯한 것은 RICH 같은 글자 수의 Letter:
     20 이면 -14px(두 쪽), 19 는 -3px(두 쪽), 18 은 12px, 17 은 37px. 15px 넘게 남는 가장 큰 값 17.
     17 에서 남는 px(A4/Letter) — 옮긴 말: RICH 132/65, MID 345/278, MAX 292/225(0.6배 하한), MIN 586/519 ·
     같은 글자 수: RICH 89/37, MID 309/242, MAX 292/225(0.6배 하한), MIN 586/519. 영어 글이 한국어보다 길어 한국어 26 보다 작다 */
  print: { lineChars: 17 },
};
