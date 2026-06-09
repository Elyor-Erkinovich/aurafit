/* AuraFit — Advanced Ultimate Bulletproof PWA Application Logic */

// --- GLOBAL VARIABLES & STATE ---
const STATE = {
  profile: null,            // User profile metrics
  diary: [],               // Today's consumed food logs
  workouts: [],            // Today's exercise logs
  water: 0,                // Today's water consumed in ml
  weightHistory: [],       // Historical weight entries
  calorieHistory: [],      // Historical calorie balances
  chatHistory: [],         // Chat conversation log
  activeTab: 'screen-dashboard',
  activeScannerTab: 'scanner-vision-panel',
  activeChatTab: 'chat-message-panel',
  selectedImageBase64: null,
  selectedImageMime: null,
  activeAiScanResult: null,
  activeAiChefRecipe: null,  // Cached generated recipe
  barcodeScannerInstance: null,
  waterTimerSecondsLeft: 7200, // 2 hours default countdown timer
  waterAlarmIntervalId: null,
  activeChefMealType: 'Breakfast',
  selectedCoach: 'dietitian',  // Active AI Coach (dietitian or trainer)
  chatIsThinking: false,        // AI Thinking lock state
  activeWorkoutTab: 'workout-log-panel',
  selectedWorkoutCategory: 'all',
  selectedAnatomyMuscle: null,
  workoutSubTabsInitialized: false
};

// SVG Progress Ring Constants
const PROGRESS_RING_RADIUS = 95;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS; // ~596.9

// MET Factors for scientifically backed workouts
const MET_FACTORS = {
  '8.0': 'Yugurish (Running)',
  '6.0': 'Suzish (Swimming)',
  '5.0': 'Kuch mashqlari (Strength Training)',
  '5.5': 'Velosiped haydash (Cycling)',
  '3.8': 'Tez yurish (Fast Walking)',
  '2.5': 'Yoga va cho\'zilish (Yoga/Stretching)',
  '4.5': 'Raqs tushish (Dancing)'
};

// --- OFFLINE WORKOUTS & ANATOMY DATABASES ---
const EXERCISES_DATABASE = [
  {
    id: 'pushups',
    category: 'chest',
    name: "Otjimaniya (Push-Ups)",
    desc: "Tana og'irligi yordamida ko'krak, yelka oldi va triceps mushaklarini rivojlantiruvchi asosiy mashq.",
    unsplashId: "photo-1571019614242-c5c5dee9f50b",
    sets: "3-4 set x 12-15 marta",
    steps: "1. Qo'llarni yelka kengligida polga qo'ying. 2. Tanani to'g'ri chiziq bo'ylab ushlab, ko'krak erga teyguncha pastga tushing. 3. Nafas chiqarib, boshlang'ich holatga qayting.",
    biomechanicsTip: "Tirsaklarni yon tomonga juda yoyib yubormang (45 gradus burchak ostida saqlang), bu yelka bo'g'imlarini jarohatlanishdan asraydi."
  },
  {
    id: 'benchpress',
    category: 'chest',
    name: "Shtangani yotgan holda ko'tarish (Bench Press)",
    desc: "Ko'krak mushaklarini massasi va kuchini oshirish uchun eng asosiy baza mashqi.",
    unsplashId: "photo-1534438327276-14e5300c3a48",
    sets: "4 set x 8-10 marta",
    steps: "1. Skameykaga yoting, shtangani yelkadan kengroq ushlang. 2. Shtangani ko'krak o'rtasiga sekin tushiring. 3. Kuchli harakat bilan shtangani yuqoriga ko'taring.",
    biomechanicsTip: "Oyoqlaringiz erga mahkam tayanib tursin. Harakat davomida ko'krak qafasini biroz yuqoriga ko'taring (ko'prik qiling) va kuraklarni birlashtiring."
  },
  {
    id: 'chest_dips',
    category: 'chest',
    name: "Brusda tortilish (Chest Dips)",
    desc: "Ko'krakning pastki qismi va tricepsni ajoyib shakllantiruvchi mashq.",
    unsplashId: "photo-1581009146145-b5ef050c2e1e",
    sets: "3 set x 10-12 marta",
    steps: "1. Brusga chiqing. 2. Tanani biroz oldinga egib, tirsaklarni 90 darajagacha buking va pastga tushing. 3. Qo'llarni to'g'rilab yuqoriga ko'taring.",
    biomechanicsTip: "Tirsaklar chetga qarab ketmasin va tanani o'ta ko'p silkintirmang."
  },
  {
    id: 'pullups',
    category: 'back',
    name: "Turnikda tortilish (Pull-Ups)",
    desc: "Keng orqa mushaklari (qanotlar) va bicepsni rivojlantiruvchi eng samarali mashq.",
    unsplashId: "photo-1526506118085-60ce8714f8c5",
    sets: "4 set x 8-12 marta",
    steps: "1. Turnikdan yelkadan kengroq ushlab osiling. 2. Kuraklarni birlashtirib, iyak turnik to'sinidan o'tguncha tanangizni yuqoriga torting. 3. Sekin va nazorat ostida pastga tushing.",
    biomechanicsTip: "Faqat qo'l bilan emas, orqa mushaklari bilan tortilishga e'tibor bering. Yelkalarni yuqorida qisib qolishiga yo'l qo'ymang."
  },
  {
    id: 'dumbbell_row',
    category: 'back',
    name: "Gantelni egilgan holda tortish (Dumbbell Row)",
    desc: "Har bir orqa tomonni alohida ishlash va mushaklar simmetriyasini yaxshilash uchun ajoyib mashq.",
    unsplashId: "photo-1605296867304-46d5465a25f1",
    sets: "3 set x 10-12 marta",
    steps: "1. Bir tizza va qo'l bilan skameykaga tayaning, ikkinchi qo'lda gantel bo'lsin. 2. Gantelni bel tomonga torting (tirsakni yuqoriga ko'taring). 3. Gantelni sekin pastga tushiring.",
    biomechanicsTip: "Harakatning eng yuqori nuqtasida orqa mushagini 1 soniya davomida siqib turing."
  },
  {
    id: 'squats',
    category: 'legs',
    name: "Shtanga bilan o'tirib-turish (Barbell Squats)",
    desc: "Kvadritseps, dumba va boldir mushaklarini rivojlantiruvchi barcha mashqlar qiroli.",
    unsplashId: "photo-1574680096145-d05b474e2155",
    sets: "4 set x 10-12 marta",
    steps: "1. Shtangani yelka ortiga qo'yib, oyoqlarni yelka kengligida turing. 2. Dumbingizni orqaga chiqarib, tizzalar 90 daraja burchak hosil qilguncha o'tiring. 3. Oyoqlar bilan erdan itarilib, tik turing.",
    biomechanicsTip: "O'tirganda tizzalaringiz oyoq uchi chizig'idan o'tib ketmasligiga e'tibor bering. Orqangizni doimo tekis ushlang."
  },
  {
    id: 'lunges',
    category: 'legs',
    name: "Oyoq oldinga tashlash (Lunges)",
    desc: "Son mushaklari va dumbani alohida ishlash hamda muvozanatni yaxshilash mashqi.",
    unsplashId: "photo-1507398941214-572c25f4b1dc",
    sets: "3 set x 12 marta (har bir oyoqqa)",
    steps: "1. Tik turing, bir oyoq bilan oldinga katta qadam tashlang. 2. Orqa tizza erga tegguncha pastga tushing. 3. Oldingi oyoq yordamida boshlang'ich holatga qayting.",
    biomechanicsTip: "Tana doimo tik tursin, oldinga egilib ketmang."
  },
  {
    id: 'bicep_curls',
    category: 'arms',
    name: "Biceps uchun gantel ko'tarish (Bicep Curls)",
    desc: "Qo'lning oldingi qismini (biceps) izolyatsiya qilingan holda rivojlantirish mashqi.",
    unsplashId: "photo-1581009146145-b5ef050c2e1e",
    sets: "3-4 set x 12-15 marta",
    steps: "1. Gantellarni yoningizda ushlab turing. 2. Tirsaklarni qo'zg'atmasdan, gantellarni yelkaga qarab ko'taring. 3. Sekin boshlang'ich holatga tushiring.",
    biomechanicsTip: "Harakat davomida tirsaklaringizni oldinga yoki orqaga qimirlatmang, ularni tanangizga mahkamlang."
  },
  {
    id: 'tricep_pushdowns',
    category: 'arms',
    name: "Triceps blokida qo'llarni to'g'rilash (Tricep Pushdowns)",
    desc: "Qo'l orqasi (triceps) mushaklarini shakllantiruvchi eng ommabop mashq.",
    unsplashId: "photo-1541534741688-6078c6bfb5c5",
    sets: "3 set x 12-15 marta",
    steps: "1. Blok arqonini ushlang, tirsaklar tanaga yopishgan bo'lsin. 2. Arqonni tirsaklarni to'liq ochib, pastga bosing. 3. Arqonni ko'krak darajasigacha sekin qaytaring.",
    biomechanicsTip: "Harakat faqat tirsak bo'g'imida bo'lishi kerak. Yelkalaringizni qimirlatmang."
  },
  {
    id: 'dumbbell_press',
    category: 'arms',
    name: "Yelka uchun gantel ko'tarish (Shoulder Press)",
    desc: "Yelka (deltoid) mushaklarini kengaytirish va kuchaytirish uchun ajoyib mashq.",
    unsplashId: "photo-1574680100466-9a2c3a7a92fb",
    sets: "3 set x 10-12 marta",
    steps: "1. Skameykaga o'tiring, gantellarni quloq ro'parasida ushlang. 2. Gantellarni tepaga, bir-biriga yaqinlashtirib ko'taring. 3. Sekin quloq ro'parasiga qaytaring.",
    biomechanicsTip: "Orqangiz skameykaga mahkam tegib tursin, belingizni haddan tashqari bukib yubormang."
  },
  {
    id: 'crunches',
    category: 'core',
    name: "Press ko'tarish (Crunches)",
    desc: "Qorin mushaklari (abdominal press) yuqori qismini mustahkamlash mashqi.",
    unsplashId: "photo-1517838277536-f5f99be501cd",
    sets: "4 set x 15-20 marta",
    steps: "1. Orqa bilan yerga yoting, tizzalarni buking. 2. Qo'llarni bosh ortiga qo'yib, faqat kuraklarni yerdan uzib ko'taring. 3. Qorin mushaklarini siqib, sekin yerga qayting.",
    biomechanicsTip: "Boshni qo'llar bilan tortmang, butun kuch qorin mushaklariga tushishi kerak."
  },
  {
    id: 'plank',
    category: 'core',
    name: "Planka (Plank)",
    desc: "Butun tana va qorin markaziy (core) mushaklarini statik kuchini oshiruvchi universal mashq.",
    unsplashId: "photo-1571019613576-2b22c76fd955",
    sets: "3 set x 60 soniya",
    steps: "1. Tirsaklar va oyoq uchlariga tayanib turing. 2. Tana boshdan to tovongacha tekis to'g'ri chiziq hosil qilishi lozim. 3. Usbhu holatda qorinni qattiq tortib ushlang.",
    biomechanicsTip: "Belingiz pastga tushib ketmasligiga yoki dumbangiz juda ko'tarilib ketmasligiga e'tibor bering."
  },
  {
    id: 'neck_extension',
    category: 'back',
    name: "Bo'yin mushaklarini chiniqtirish (Neck Extension)",
    desc: "Bo'yin orqa va yon mushaklarini kuchaytiruvchi va umurtqa pog'onasini himoyalovchi maxsus mashq.",
    unsplashId: "photo-1544367567-0f2fcb009e0b",
    sets: "3 set x 12-15 marta",
    steps: "1. Qo'llaringizni orqaga yoki peshonaga tayab, boshni sekin qarshilik bilan oldinga-orqaga harakatlantiring. 2. Harakatni o'ta sekin va nazorat ostida bajaring.",
    biomechanicsTip: "Haddan tashqari keskin harakatlar qilmang. Bo'yin umurtqalari juda nozik bo'lgani sababli, yuklamani o'ta ehtiyotkorlik bilan berish lozim."
  },
  {
    id: 'calf_raises',
    category: 'legs',
    name: "Boldir mushaklarini ko'tarish (Calf Raises)",
    desc: "Boldirning gastroknemius va soleus mushaklarini rivojlantiruvchi eng samarali mashq.",
    unsplashId: "photo-1596464716127-f2a82984de30",
    sets: "4 set x 15-20 marta",
    steps: "1. Biror balandlik chetida turing (tovonlar osilib tursin). 2. Oyoq uchlarida iloji boricha yuqoriga ko'taring. 3. Tovonlarni maksimal pastga tushirib boldirni cho'zing.",
    biomechanicsTip: "Harakatning eng yuqori nuqtasida boldirlarni 1 soniya qisib turing. Pastga tushayotganda sekin, sakrashlarsiz nazorat bilan tushing."
  }
];

const ANATOMY_DATABASE = {
  chest: {
    name: "Ko'krak mushaklari",
    latin: "Pectoralis Major & Minor",
    func: "Qo'llarni gorizontal bo'ylab oldinga olib kelish, ularni ichkariga burish va tana markaziga yaqinlashtirish.",
    lever: "Uchinchi turdagi dastalash (Third-class lever). Bunda kuch bo'g'imga yaqin joyda qo'llaniladi, bu tez va katta harakat amplitudasini beradi.",
    do: "Kuraklarni orqaga qisib, ko'krakni baland ko'taring. Harakatning eng yuqori nuqtasida ko'krak mushagini qattiq siqing.",
    dont: "Yelkalarni oldinga chiqarib yubormang. Bu yuklamani ko'krakdan olib yelka oldi bo'g'imiga tushiradi va jarohatga sabab bo'ladi.",
    exercises: ['pushups', 'benchpress', 'chest_dips']
  },
  shoulders: {
    name: "Yelka mushaklari",
    latin: "Deltoideus (Anterior, Lateral, Posterior)",
    func: "Qo'lni barcha yo'nalishlarda (oldinga, yonga, orqaga) ko'tarish va rotatsiya qilish.",
    lever: "Uchinchi turdagi dastalash (Third-class lever). Yelka bo'g'imi eng harakatchan va ayni paytda eng beqaror bo'g'im hisoblanadi.",
    do: "Gantelni ko'targanda elkalarni pastda saqlang va faqat yelka mushaklari kuchi yordamida ko'taring.",
    dont: "Haddan tashqari og'ir yuk ishlatib, tanangiz bilan tebranmang. Yelka bo'g'imi nozik, shuning uchun nazorat ostida ishlang.",
    exercises: ['dumbbell_press']
  },
  biceps: {
    name: "Ikki boshli qo'l mushagi (Biceps)",
    latin: "Biceps Brachii",
    func: "Tirsak bo'g'imini bukish va bilakni tashqi tomonga burish (supinatsiya).",
    lever: "Uchinchi turdagi dastalash (Third-class lever). Kuch tirsak bo'g'imidan bir necha sm pastda qo'llaniladi.",
    do: "Tirsaklaringizni tanangiz yonida mahkam ushlang. Harakatni faqat bilakni bukish orqali bajaring.",
    dont: "Tirsaklarni oldinga ko'tarmang. Bu holda yuklama oldingi yelka (deltoid) mushagiga o'tib ketadi.",
    exercises: ['bicep_curls']
  },
  triceps: {
    name: "Uch boshli qo'l mushagi (Triceps)",
    latin: "Triceps Brachii",
    func: "Tirsak bo'g'imini yozish (to'g'rilash) va qo'lni orqaga harakatlantirish.",
    lever: "Birinchi turdagi dastalash (First-class lever) - tayanch nuqtasi (tirsak) kuch va yuklama o'rtasida joylashgan.",
    do: "Harakat oxirida tirsaklarni to'liq to'g'rilav, tricepsni qattiq siqing.",
    dont: "Tirsaklarni ikki tomonga yoyib yubormang. Tirsaklar tanaga parallel va yaqin bo'lishi shart.",
    exercises: ['tricep_pushdowns', 'chest_dips']
  },
  abs: {
    name: "Qorin mushaklari (Press)",
    latin: "Rectus Abdominis & Obliques",
    func: "Umurtqani egish (tanani bukish), qorin ichki bosimini saqlash va tana muvozanatini ushlash.",
    lever: "Moslashuvchan ko'p bo'g'imli dastalash. Butun umurtqa pog'onasi harakat o'qi bo'lib xizmat qiladi.",
    do: "Tanani ko'targanda qorinni ichkariga torting va umurtqani yumaloq ko'rinishda buking (eging).",
    dont: "Oyoqlarni to'g'ri ushlab yoki bo'yinni qo'l bilan qattiq tortib mashq qilmang. Bu bel va bo'yinga zarar etkazadi.",
    exercises: ['crunches', 'plank']
  },
  quads: {
    name: "Sonning oldingi to'rt boshli mushagi (Kvadritseps)",
    latin: "Quadriceps Femoris",
    func: "Tizza bo'g'imini yozish (to'g'rilash) va sonni tos suyagi tomonga bukish.",
    lever: "Uchinchi turdagi dastalash (Third-class lever). Patella (tizza qopqog'i) biomekanik blok vazifasini o'taydi.",
    do: "Squat (o'tirganda) og'irlikni tovonlarga bering va tizzalarni barmoqlar uchi yo'nalishida yoying.",
    dont: "O'tirib turganda tizzalaringiz ichkariga qarab bukilib ketmasin. Bu tizza paylariga o'ta xavfli bosim beradi.",
    exercises: ['squats', 'lunges']
  },
  traps: {
    name: "Trapetsiyasimon mushak (Yelka orqasi)",
    latin: "Trapezius",
    func: "Kuraklarni ko'tarish, orqaga tortish va pastga tushirish.",
    lever: "Uchinchi turdagi dastalash. Bo'yin va orqaning yuqori qismini barqaror ushlab turadi.",
    do: "Kuraklarni maksimal darajada orqaga va tepaga tortib, orqa mushaklarni qattiq qising.",
    dont: "Harakatni tez va boshqaruvsiz bajarmang. Bo'yin umurtqasini zo'riqtirib qo'yishingiz mumkin.",
    exercises: ['pullups', 'dumbbell_row']
  },
  lats: {
    name: "Keng orqa mushaklari",
    latin: "Latissimus Dorsi",
    func: "Qo'llarni tanaga yaqinlashtirish (adduksiya), orqaga tortish va ichkariga burish.",
    lever: "Uchinchi turdagi dastalash. Tana skeletining eng katta mushaklaridan biri.",
    do: "Tortishish harakatida tirsaklaringiz orqa tomonga qarab yo'naltirilsin va kuraklarni pastga birlashtiring.",
    dont: "Harakatni faqat biceps (qo'l) kuchi bilan tortmang. Harakatni tirsakdan boshlab orqa mushak bilan bajaring.",
    exercises: ['pullups', 'dumbbell_row']
  },
  glutes: {
    name: "Dumba mushaklari",
    latin: "Gluteus Maximus",
    func: "Tos bo'g'imini yozish (oyoqni orqaga cho'zish) va sonni tashqariga burish.",
    lever: "Uchinchi turdagi dastalash. Tik yurish va yugurishda eng asosiy energiya generatori.",
    do: "Squat yoki lunges harakatida dumbani to'liq orqaga chiqaring va ko'tarilganda dumba mushagini qattiq siqing.",
    dont: "Yuklamani belingizga tushirmang. Tos sohasini haddan tashqari oldinga chiqarib, belni zo'riqtirmang.",
    exercises: ['squats', 'lunges']
  },
  hamstrings: {
    name: "Son orqasi va boldir mushaklari",
    latin: "Hamstrings & Gastrocnemius",
    func: "Tizzani bukish va son bo'g'imini yozish hamda tovonni ko'tarish.",
    lever: "Uchinchi turdagi dastalash. Oyoqning orqa qismini barqarorlashtirish va harakatlanish (yugurish) uchun javobgar.",
    do: "Squat mashqida son parallel chiziqdan pastroqqa tushganda son orqasi maksimal darajada cho'ziladi va ishga tushadi.",
    dont: "Oyoqlarni to'liq to'g'rilab og'irlik ko'targanda belingizni bukib ketishiga yo'l qo'ymang.",
    exercises: ['squats', 'lunges']
  },
  neck: {
    name: "Bo'yin mushaklari",
    latin: "Splenius capitis & Sternocleidomastoideus",
    func: "Boshni burish, egish, tik ushlab turish va bo'yin umurtqasini himoya qilish.",
    lever: "Birinchi turdagi dastalash (First-class lever) - boshning og'irlik markazi va bo'yin mushaklari muvozanat nuqtasi atrofida ishlaydi.",
    do: "Mashqlarni sekin bajarib, boshni orqaga cho'zayotganda ehtiyot bo'ling. Doimo bo'yinni tekis ushlang.",
    dont: "Katlarni tez va siltab bajarmang, boshni orqaga keskin tashlamang (bu bo'yin nervlarini siqib qo'yishi mumkin).",
    exercises: ['neck_extension']
  },
  calves: {
    name: "Boldir mushaklari",
    latin: "Gastrocnemius & Soleus",
    func: "Tovonni ko'tarish, tizzani bukishda yordam berish va sakrash/yugurish harakatlarini ta'minlash.",
    lever: "Ikkinchi turdagi dastalash (Second-class lever) - og'irlik markazi tayanch (oyoq uchi) va kuch (axill payi) o'rtasida joylashgan. Bu juda kuchli mexanik ustunlik beradi.",
    do: "Harakat amplitudasini to'liq qiling - tovonni maksimal pastga tushiring va yuqorida boldirni to'liq qising.",
    dont: "Mashqni tez-tez va sakrab-sakrab bajarmang, chunki bu holda yuklama mushakka emas, balki axill payiga tushadi.",
    exercises: ['calf_raises']
  }
};

// --- DOM ELEMENTS ---
const DOM = {
  // Wizard / Onboarding
  welcomeWizard: document.getElementById('welcome-wizard'),
  wizardProgressBar: document.getElementById('wizard-progress-bar'),
  wizardSteps: document.querySelectorAll('.wizard-step'),
  wizardApiKey: document.getElementById('wizard-api-key'),
  toggleWizardKey: document.getElementById('toggle-wizard-key'),
  wizardAge: document.getElementById('wizard-age'),
  wizardWeight: document.getElementById('wizard-weight'),
  wizardHeight: document.getElementById('wizard-height'),
  wizardActivity: document.getElementById('wizard-activity'),
  genderBtns: document.querySelectorAll('.gender-btn'),
  goalBtns: document.querySelectorAll('.goal-btn'),
  finishWizardBtn: document.getElementById('finish-wizard'),

  // App Layout Shell
  appContainer: document.getElementById('app-container'),
  currentDate: document.getElementById('current-date'),
  headerGoalBadge: document.getElementById('header-goal-badge'),
  navItems: document.querySelectorAll('.nav-item'),
  screens: document.querySelectorAll('.app-screen'),

  // Dashboard Basic UI
  calRemainingVal: document.getElementById('cal-remaining-val'),
  calConsumedVal: document.getElementById('cal-consumed-val'),
  calTargetVal: document.getElementById('cal-target-val'),
  calorieProgressBar: document.getElementById('calorie-progress-bar'),
  pCurrent: document.getElementById('p-current'),
  pTarget: document.getElementById('p-target'),
  pBarFill: document.getElementById('p-bar-fill'),
  fCurrent: document.getElementById('f-current'),
  fTarget: document.getElementById('f-target'),
  fBarFill: document.getElementById('f-bar-fill'),
  cCurrent: document.getElementById('c-current'),
  cTarget: document.getElementById('c-target'),
  cBarFill: document.getElementById('c-bar-fill'),
  waterCurrentVal: document.getElementById('water-current-val'),
  waterTargetVal: document.getElementById('water-target-val'),
  waterCupFill: document.getElementById('water-cup-fill'),
  waterPercentTxt: document.getElementById('water-percent-txt'),
  btnTriggerAddFood: document.getElementById('btn-trigger-add-food'),
  btnTriggerAiCamera: document.getElementById('btn-trigger-ai-camera'),
  btnWaterQuick: document.querySelectorAll('.btn-water-quick'),
  resetWaterBtn: document.getElementById('reset-water'),
  btnRequestNotifications: document.getElementById('btn-request-notifications'),
  dashExerciseBanner: document.getElementById('dash-exercise-banner'),
  dashBurnedCalLbl: document.getElementById('dash-burned-cal-lbl'),
  waterTimerClockVal: document.getElementById('water-timer-clock-val'),

  // Dashboard Progress Trends UI
  inputQuickWeight: document.getElementById('input-quick-weight'),
  btnSaveQuickWeight: document.getElementById('btn-save-quick-weight'),
  btnShowWeightChart: document.getElementById('btn-show-weight-chart'),
  btnShowCalChart: document.getElementById('btn-show-cal-chart'),
  weightChartBox: document.getElementById('weight-chart-box'),
  calChartBox: document.getElementById('cal-chart-box'),

  // Screen Scanner Panels Toggles
  tabBtnVision: document.getElementById('tab-btn-vision'),
  tabBtnBarcode: document.getElementById('tab-btn-barcode'),
  scannerPanels: document.querySelectorAll('.scanner-panel'),
  scannerTabBtns: document.querySelectorAll('.scanner-tab-btn'),

  // Vision scanner
  cameraDropzone: document.getElementById('camera-dropzone'),
  cameraFileInput: document.getElementById('camera-file-input'),
  dropzonePrompt: document.getElementById('dropzone-prompt'),
  imagePreviewBox: document.getElementById('image-preview-box'),
  capturedImageView: document.getElementById('captured-image-view'),
  btnRemovePreview: document.getElementById('btn-remove-preview'),
  apiKeyMissingWarning: document.getElementById('api-key-missing-warning'),
  linkToSettingsKey: document.getElementById('link-to-settings-key'),
  btnSelectFile: document.getElementById('btn-select-file'),
  btnStartAnalysis: document.getElementById('btn-start-analysis'),
  analysisLoadingBox: document.getElementById('analysis-loading-box'),
  loadingStatusMsg: document.getElementById('loading-status-msg'),
  scannerActionsRow: document.getElementById('scanner-actions-row'),

  // Barcode scanner
  btnToggleBarcodeScanner: document.getElementById('btn-toggle-barcode-scanner'),
  inputManualBarcode: document.getElementById('input-manual-barcode'),
  btnSubmitManualBarcode: document.getElementById('btn-submit-manual-barcode'),
  barcodeLoadingIndicator: document.getElementById('barcode-loading-indicator'),

  // AI Chat & AI Chef Toggles
  chatTabBtnMessage: document.getElementById('chat-tab-btn-message'),
  chatTabBtnChef: document.getElementById('chat-tab-btn-chef'),
  chatPanels: document.querySelectorAll('.chat-panel'),
  chatTabBtns: document.querySelectorAll('.chat-tab-btn'),

  // Messenger block
  chatMessagesContainer: document.getElementById('chat-messages-container'),
  chatInputText: document.getElementById('chat-input-text'),
  btnSendChatMsg: document.getElementById('btn-send-chat-msg'),
  btnResetChatHistory: document.getElementById('btn-reset-chat-history'),

  // AI Chef & Meal Planner block
  chefMealsSelectorBtns: document.querySelectorAll('.chef-meals-selector .btn'),
  btnGenerateAiRecipe: document.getElementById('btn-generate-ai-recipe'),
  inputFridgeIngredients: document.getElementById('input-fridge-ingredients'),
  btnGenerateFridgeRecipe: document.getElementById('btn-generate-fridge-recipe'),
  chefRecipeLoader: document.getElementById('chef-recipe-loader'),
  chefLoaderStatusTxt: document.getElementById('chef-loader-status-txt'),
  chefRecipeOutputBox: document.getElementById('chef-recipe-output-box'),
  recipeOutTitle: document.getElementById('recipe-out-title'),
  recipeOutCal: document.getElementById('recipe-out-cal'),
  recipeOutP: document.getElementById('recipe-out-p'),
  recipeOutF: document.getElementById('recipe-out-f'),
  recipeOutC: document.getElementById('recipe-out-c'),
  recipeOutIngredientsList: document.getElementById('recipe-out-ingredients-list'),
  recipeOutInstructionsTxt: document.getElementById('recipe-out-instructions-txt'),
  btnLogChefRecipeToDiary: document.getElementById('btn-log-chef-recipe-to-diary'),

  // Workouts
  workoutTotalBurnedVal: document.getElementById('workout-total-burned-val'),
  workoutSelectType: document.getElementById('workout-select-type'),
  workoutInputDuration: document.getElementById('workout-input-duration'),
  workoutBurnPreview: document.getElementById('workout-burn-preview'),
  formLogWorkout: document.getElementById('form-log-workout'),
  workoutEmptyState: document.getElementById('workout-empty-state'),
  workoutItemsContainer: document.getElementById('workout-items-container'),

  // Diary (Combined into Settings Screen)
  diarySumCal: document.getElementById('diary-sum-cal'),
  diarySumP: document.getElementById('diary-sum-p'),
  diarySumF: document.getElementById('diary-sum-f'),
  diarySumC: document.getElementById('diary-sum-c'),
  diaryEmptyState: document.getElementById('diary-empty-state'),
  diaryMealsListContainer: document.getElementById('diary-meals-list-container'),
  btnClearDiaryToday: document.getElementById('btn-clear-diary-today'),

  // Profile & Settings
  profileNameTxt: document.getElementById('profile-name-txt'),
  profileGoalTxt: document.getElementById('profile-goal-txt'),
  profileHeightTxt: document.getElementById('profile-height-txt'),
  profileWeightTxt: document.getElementById('profile-weight-txt'),
  profileTdeeTxt: document.getElementById('profile-tdee-txt'),
  btnEditProfile: document.getElementById('btn-edit-profile'),
  settingsApiKey: document.getElementById('settings-api-key'),
  toggleSettingsKey: document.getElementById('toggle-settings-key'),
  btnSaveSettingsKey: document.getElementById('btn-save-settings-key'),
  apiKeyStatusIndicator: document.getElementById('api-key-status-indicator'),
  btnResetApp: document.getElementById('btn-reset-app'),

  // NEW: BMI & Ideal Weight
  profileBmiScoreVal: document.getElementById('profile-bmi-score-val'),
  profileBmiStatusTxt: document.getElementById('profile-bmi-status-txt'),
  profileIdealWeightRangeTxt: document.getElementById('profile-ideal-weight-range-txt'),
  profileBmiPointer: document.getElementById('profile-bmi-pointer'),

  // Modal Manual Add Food
  modalAddFood: document.getElementById('modal-add-food'),
  btnCloseAddFoodModal: document.getElementById('btn-close-add-food-modal'),
  btnCancelAddFood: document.getElementById('btn-cancel-add-food'),
  formManualAddFood: document.getElementById('form-manual-add-food'),
  foodInputName: document.getElementById('food-input-name'),
  foodInputCal: document.getElementById('food-input-cal'),
  foodInputWeight: document.getElementById('food-input-weight'),
  foodInputP: document.getElementById('food-input-p'),
  foodInputF: document.getElementById('food-input-f'),
  foodInputC: document.getElementById('food-input-c'),

  // Modal AI Result
  modalAiResult: document.getElementById('modal-ai-result'),
  btnCloseAiModal: document.getElementById('btn-close-ai-modal'),
  aiResultImageView: document.getElementById('ai-result-image-view'),
  aiFoodName: document.getElementById('ai-food-name'),
  aiCalories: document.getElementById('ai-calories'),
  aiProtein: document.getElementById('ai-protein'),
  aiFat: document.getElementById('ai-fat'),
  aiCarbs: document.getElementById('ai-carbs'),
  aiIngredientsList: document.getElementById('ai-ingredients-list'),
  aiHealthyTip: document.getElementById('ai-healthy-tip'),
  btnEditAiResult: document.getElementById('btn-edit-ai-result'),
  btnSaveAiResult: document.getElementById('btn-save-ai-result'),
};

// Wizard State Data
const wizardData = {
  gender: 'male',
  goal: 'maintain'
};

// Global chart handles
let weightChartInstance = null;
let calorieChartInstance = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Register PWA Service Worker defensively
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker registered successfully!', reg.scope))
        .catch(err => console.log('Service Worker registration failed:', err));
    }
  } catch (e) {
    console.warn("Service worker register error", e);
  }

  try {
    // Initialize Lucide Icons
    lucide.createIcons();
  } catch (e) {
    console.warn("Lucide load error", e);
  }
  
  // Set Date
  updateCurrentDate();
  
  // Load State Safely
  loadStateFromLocalStorage();

  // Check Onboarding
  if (!STATE.profile) {
    try {
      showWizard();
    } catch (e) {
      console.warn("Wizard initialization error", e);
    }
  } else {
    try { hideWizard(); } catch (e) { console.warn("hideWizard error", e); }
    try { setupDashboard(); } catch (e) { console.warn("setupDashboard error", e); }
    try { setupDiary(); } catch (e) { console.warn("setupDiary error", e); }
    try { setupWorkouts(); } catch (e) { console.warn("setupWorkouts error", e); }
    try { initWorkoutSubTabs(); } catch (e) { console.warn("initWorkoutSubTabs error", e); }
    try { setupChatScreen(); } catch (e) { console.warn("setupChatScreen error", e); }
    try { setupProfileScreen(); } catch (e) { console.warn("setupProfileScreen error", e); }
    try { setupBmiAndIdealWeight(); } catch (e) { console.warn("setupBmiAndIdealWeight error", e); }
    
    // Draw initial progress charts safely
    setTimeout(() => {
      try { renderWeightTrendChart(); } catch (e) { console.warn("renderWeightTrendChart error", e); }
      try { renderCalorieHistoryChart(); } catch (e) { console.warn("renderCalorieHistoryChart error", e); }
    }, 300);
  }

  // Start Smart Water Alarm Countdown
  try {
    startWaterAlarmTimer();
  } catch (e) {
    console.warn("Alarm timer startup error", e);
  }

  // Setup Event Listeners
  try {
    setupEventListeners();
  } catch (e) {
    console.error("Critical: Event listeners setup failed", e);
  }
  
  // Update Exercise Burn Estimate
  try {
    updateWorkoutCaloriePreview();
  } catch (e) {
    console.warn("updateWorkoutCaloriePreview error", e);
  }
});

// --- HELPER FUNCTIONS ---

function updateCurrentDate() {
  const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  
  const today = new Date();
  const dayName = days[today.getDay()];
  const dateNum = today.getDate();
  const monthName = months[today.getMonth()];
  
  DOM.currentDate.textContent = `${dayName}, ${dateNum}-${monthName}`;
}

function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// HTML тегларини зарарсизлантириш (XSS ҳимояси)
function escapeHTML(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// АИ жавобларини хавфсиз форматлаш (фақат қалин, курсив, расмлар ва янги қатор)
function formatAiResponse(text) {
  if (!text) return '';
  let safe = escapeHTML(text);
  
  // Convert Markdown Images ![caption](url) to safe <img> tags (strictly allowing only Unsplash images for security)
  safe = safe.replace(/!\[(.*?)\]\((https:\/\/images\.unsplash\.com\/[^\s\)]+)\)/g, '<img src="$2" alt="$1" class="chat-embedded-img" style="border-radius:12px; margin-top:8px; margin-bottom:8px; width:100%; max-height:180px; object-fit:cover; display:block; border:1px solid rgba(255,255,255,0.08);">');

  // **қалин** -> <b>қалин</b>
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  // *курсив* -> <i>курсив</i>
  safe = safe.replace(/\*(.*?)\*/g, '<i>$1</i>');
  // _курсив_ -> <i>курсив</i>
  safe = safe.replace(/_(.*?)_/g, '<i>$1</i>');
  // Янги қатор -> <br>
  safe = safe.replace(/\n/g, '<br>');
  return safe;
}

function loadStateFromLocalStorage() {
  const todayStr = getTodayDateKey();
  
  // Load Profile Safely
  try {
    const savedProfile = localStorage.getItem('aurafit_profile');
    if (savedProfile) {
      STATE.profile = JSON.parse(savedProfile);
    }
  } catch (e) {
    console.error("Profile parse error", e);
  }

  // Load Today's Diary Safely
  try {
    const savedDiary = localStorage.getItem(`aurafit_diary_${todayStr}`);
    if (savedDiary) {
      STATE.diary = JSON.parse(savedDiary);
    } else {
      STATE.diary = [];
    }
  } catch (e) {
    STATE.diary = [];
  }

  // Load Today's Workouts Safely
  try {
    const savedWorkouts = localStorage.getItem(`aurafit_workouts_${todayStr}`);
    if (savedWorkouts) {
      STATE.workouts = JSON.parse(savedWorkouts);
    } else {
      STATE.workouts = [];
    }
  } catch (e) {
    STATE.workouts = [];
  }

  // Load Today's Water
  const savedWater = localStorage.getItem(`aurafit_water_${todayStr}`);
  if (savedWater) {
    STATE.water = parseInt(savedWater, 10) || 0;
  } else {
    STATE.water = 0;
  }

  // Load Weight History Safely
  try {
    const savedWeightHist = localStorage.getItem('aurafit_weight_history');
    if (savedWeightHist) {
      STATE.weightHistory = JSON.parse(savedWeightHist);
    }
  } catch (e) {
    STATE.weightHistory = [];
  }

  if (STATE.weightHistory.length === 0 && STATE.profile) {
    const mockHist = [];
    const w = STATE.profile.weight || 70;
    const isLose = STATE.profile.goal === 'lose';
    const isGain = STATE.profile.goal === 'gain';
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      
      let variance = 0;
      if (isLose) variance = (i * 0.15) + (Math.random() * 0.2 - 0.1);
      else if (isGain) variance = -(i * 0.12) + (Math.random() * 0.2 - 0.1);
      else variance = (Math.random() * 0.3 - 0.15);
      
      mockHist.push({
        date: dateKey,
        weight: Math.round((w + variance) * 10) / 10
      });
    }
    STATE.weightHistory = mockHist;
    localStorage.setItem('aurafit_weight_history', JSON.stringify(mockHist));
  }

  // Load Calorie history safely
  try {
    const savedCalHist = localStorage.getItem('aurafit_calorie_history');
    if (savedCalHist) {
      STATE.calorieHistory = JSON.parse(savedCalHist);
    }
  } catch (e) {
    STATE.calorieHistory = [];
  }

  if (STATE.calorieHistory.length === 0 && STATE.profile) {
    const goals = calculateNutritionGoals(STATE.profile);
    const mockCal = [];
    for (let i = 6; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      
      const cons = Math.round(goals.targetCalories + (Math.random() * 400 - 200));
      const burn = Math.random() > 0.4 ? Math.round(150 + Math.random() * 200) : 0;
      
      mockCal.push({
        date: dateKey,
        consumed: cons,
        target: goals.targetCalories,
        burned: burn
      });
    }
    STATE.calorieHistory = mockCal;
    localStorage.setItem('aurafit_calorie_history', JSON.stringify(mockCal));
  }

  // Load Chat history safely
  try {
    const savedChat = localStorage.getItem('aurafit_chat_history');
    if (savedChat) {
      STATE.chatHistory = JSON.parse(savedChat);
    } else {
      STATE.chatHistory = [];
    }
  } catch (e) {
    STATE.chatHistory = [];
  }
  
  // Load Water Timer countdown safely
  const savedSeconds = localStorage.getItem(`aurafit_water_seconds_${todayStr}`);
  if (savedSeconds) {
    STATE.waterTimerSecondsLeft = parseInt(savedSeconds, 10) || 7200;
  } else {
    STATE.waterTimerSecondsLeft = 7200;
  }
}

function saveStateToLocalStorage() {
  const todayStr = getTodayDateKey();
  
  try {
    if (STATE.profile) {
      localStorage.setItem('aurafit_profile', JSON.stringify(STATE.profile));
    }
    localStorage.setItem(`aurafit_diary_${todayStr}`, JSON.stringify(STATE.diary));
    localStorage.setItem(`aurafit_workouts_${todayStr}`, JSON.stringify(STATE.workouts));
    localStorage.setItem(`aurafit_water_${todayStr}`, STATE.water.toString());
    localStorage.setItem(`aurafit_water_seconds_${todayStr}`, STATE.waterTimerSecondsLeft.toString());
    localStorage.setItem('aurafit_weight_history', JSON.stringify(STATE.weightHistory));
    localStorage.setItem('aurafit_calorie_history', JSON.stringify(STATE.calorieHistory));
    localStorage.setItem('aurafit_chat_history', JSON.stringify(STATE.chatHistory));
  } catch (e) {
    console.warn("Storage save failed", e);
  }
}

// Mifflin-St Jeor Formula
function calculateNutritionGoals(profile) {
  const weight = parseFloat(profile.weight) || 70;
  const height = parseFloat(profile.height) || 175;
  const age = parseInt(profile.age, 10) || 25;
  const activity = parseFloat(profile.activity) || 1.55;

  let bmr = 0;
  if (profile.gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const tdee = Math.round(bmr * activity);
  let targetCalories = tdee;
  
  if (profile.goal === 'lose') {
    targetCalories = Math.round(tdee * 0.85); // -15%
  } else if (profile.goal === 'gain') {
    targetCalories = Math.round(tdee * 1.15); // +15%
  } else if (profile.goal === 'recomp') {
    targetCalories = Math.round(tdee * 0.95); // -5% slight deficit for recomposition
  }

  let proteinRatio = 1.8;
  if (profile.goal === 'gain') proteinRatio = 2.0;
  if (profile.goal === 'lose') proteinRatio = 1.8;
  if (profile.goal === 'maintain') proteinRatio = 1.5;
  if (profile.goal === 'recomp') proteinRatio = 2.2; // 2.2g per kg body weight!

  const targetProtein = Math.round(weight * proteinRatio);
  const targetFat = Math.round((targetCalories * 0.25) / 9);
  const targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4);

  return {
    bmr: Math.round(bmr),
    tdee: tdee,
    targetCalories: targetCalories,
    targetProtein: targetProtein,
    targetFat: targetFat,
    targetCarbs: targetCarbs
  };
}

// --- ONBOARDING WIZARD LOGIC ---

function showWizard() {
  DOM.welcomeWizard.classList.remove('hidden');
  DOM.appContainer.classList.add('hidden');
  setWizardStep(1);
}

function hideWizard() {
  DOM.welcomeWizard.classList.add('hidden');
  DOM.appContainer.classList.remove('hidden');
}

function setWizardStep(stepNum) {
  DOM.wizardSteps.forEach(step => {
    if (parseInt(step.dataset.step, 10) === stepNum) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });

  const totalSteps = DOM.wizardSteps.length;
  const percent = (stepNum / totalSteps) * 100;
  DOM.wizardProgressBar.style.width = `${percent}%`;
}

// --- DASHBOARD UI UPDATING ---

function setupDashboard() {
  if (!STATE.profile) return;

  const goals = calculateNutritionGoals(STATE.profile);
  
  let goalText = 'Вазнни Сақлаш';
  let badgeClass = 'maintain';
  let badgeIcon = 'scale';

  if (STATE.profile.goal === 'lose') {
    goalText = 'Соғлом Озиш';
    badgeClass = 'lose';
    badgeIcon = 'trending-down';
  } else if (STATE.profile.goal === 'gain') {
    goalText = 'Соғлом Семириш';
    badgeClass = 'gain';
    badgeIcon = 'trending-up';
  } else if (STATE.profile.goal === 'recomp') {
    goalText = 'Тана Рекомпозицияси';
    badgeClass = 'recomp';
    badgeIcon = 'zap';
  }

  DOM.headerGoalBadge.className = `header-badge ${badgeClass}`;
  DOM.headerGoalBadge.innerHTML = `<i data-lucide="${badgeIcon}"></i> <span>${goalText}</span>`;
  lucide.createIcons();

  let consumedCal = 0;
  let consumedP = 0;
  let consumedF = 0;
  let consumedC = 0;

  STATE.diary.forEach(meal => {
    consumedCal += parseInt(meal.calories, 10) || 0;
    consumedP += parseFloat(meal.proteins) || 0;
    consumedF += parseFloat(meal.fats) || 0;
    consumedC += parseFloat(meal.carbs) || 0;
  });

  let burnedCal = 0;
  STATE.workouts.forEach(ex => {
    burnedCal += parseInt(ex.caloriesBurned, 10) || 0;
  });

  consumedP = Math.round(consumedP * 10) / 10;
  consumedF = Math.round(consumedF * 10) / 10;
  consumedC = Math.round(consumedC * 10) / 10;

  const targetCal = goals.targetCalories;
  // Formula: Target + Exercise - Consumed = Remaining
  const remainingCal = Math.max(0, (targetCal + burnedCal) - consumedCal);

  DOM.calRemainingVal.textContent = remainingCal.toLocaleString();
  DOM.calConsumedVal.textContent = consumedCal.toLocaleString();
  DOM.calTargetVal.textContent = targetCal.toLocaleString();

  if (burnedCal > 0) {
    DOM.dashExerciseBanner.style.display = 'flex';
    DOM.dashBurnedCalLbl.textContent = `+${burnedCal} ккал`;
  } else {
    DOM.dashExerciseBanner.style.display = 'none';
  }

  const totalCalBudget = targetCal + burnedCal;
  const fraction = Math.min(1, consumedCal / totalCalBudget);
  const strokeOffset = PROGRESS_RING_CIRCUMFERENCE - (fraction * PROGRESS_RING_CIRCUMFERENCE);
  
  DOM.calorieProgressBar.style.strokeDasharray = `${PROGRESS_RING_CIRCUMFERENCE} ${PROGRESS_RING_CIRCUMFERENCE}`;
  DOM.calorieProgressBar.style.strokeDashoffset = strokeOffset;

  if (STATE.profile.goal === 'lose') {
    DOM.calorieProgressBar.setAttribute('stroke', 'url(#green-gradient)');
  } else if (STATE.profile.goal === 'gain') {
    DOM.calorieProgressBar.setAttribute('stroke', 'url(#orange-gradient)');
  } else if (STATE.profile.goal === 'recomp') {
    DOM.calorieProgressBar.setAttribute('stroke', 'url(#purple-gradient)');
  } else {
    DOM.calorieProgressBar.setAttribute('stroke', 'url(#blue-gradient)');
  }

  DOM.pCurrent.textContent = consumedP;
  DOM.pTarget.textContent = goals.targetProtein;
  const pPercent = Math.min(100, (consumedP / goals.targetProtein) * 100);
  DOM.pBarFill.style.width = `${pPercent}%`;

  DOM.fCurrent.textContent = consumedF;
  DOM.fTarget.textContent = goals.targetFat;
  const fPercent = Math.min(100, (consumedF / goals.targetFat) * 100);
  DOM.fBarFill.style.width = `${fPercent}%`;

  DOM.cCurrent.textContent = consumedC;
  DOM.cTarget.textContent = goals.targetCarbs;
  const cPercent = Math.min(100, (consumedC / goals.targetCarbs) * 100);
  DOM.cBarFill.style.width = `${cPercent}%`;

  const waterTarget = 2500;
  DOM.waterCurrentVal.textContent = STATE.water;
  DOM.waterTargetVal.textContent = waterTarget;
  
  const waterPercent = Math.min(100, Math.round((STATE.water / waterTarget) * 100));
  DOM.waterCupFill.style.height = `${waterPercent}%`;
  DOM.waterPercentTxt.textContent = `${waterPercent}%`;

  if (!STATE.profile.geminiApiKey) {
    DOM.apiKeyMissingWarning.classList.remove('hidden');
  } else {
    DOM.apiKeyMissingWarning.classList.add('hidden');
  }

  syncTodayInCalorieHistory(consumedCal, targetCal, burnedCal);
}

// --- DYNAMIC CHART.JS GRAPHIC TRENDS ---

function syncTodayInCalorieHistory(consumed, target, burned) {
  const todayStr = getTodayDateKey();
  const index = STATE.calorieHistory.findIndex(h => h.date === todayStr);

  if (index !== -1) {
    STATE.calorieHistory[index].consumed = consumed;
    STATE.calorieHistory[index].target = target;
    STATE.calorieHistory[index].burned = burned;
  } else {
    STATE.calorieHistory.push({
      date: todayStr,
      consumed: consumed,
      target: target,
      burned: burned
    });
    if (STATE.calorieHistory.length > 7) {
      STATE.calorieHistory.shift();
    }
  }
  localStorage.setItem('aurafit_calorie_history', JSON.stringify(STATE.calorieHistory));
}

function renderWeightTrendChart() {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js is not loaded yet.");
    return;
  }
  
  const boxEl = document.getElementById('weight-chart-box');
  if (!boxEl || boxEl.classList.contains('hidden')) {
    if (weightChartInstance) {
      weightChartInstance.destroy();
      weightChartInstance = null;
    }
    return;
  }

  const canvasEl = document.getElementById('weight-trend-canvas');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  
  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  const last7Days = STATE.weightHistory.slice(-7);
  const labels = last7Days.map(item => {
    const parts = item.date.split('-');
    return `${parts[2]}-${parts[1]}`;
  });
  const data = last7Days.map(item => item.weight);

  try {
    weightChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Vazn (kg)',
          data: data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#10b981',
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: { color: '#94a3b8' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  } catch (e) {
    console.warn("Chart.js draw failed", e);
  }
}

function renderCalorieHistoryChart() {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js is not loaded yet.");
    return;
  }

  const boxEl = document.getElementById('cal-chart-box');
  if (!boxEl || boxEl.classList.contains('hidden')) {
    if (calorieChartInstance) {
      calorieChartInstance.destroy();
      calorieChartInstance = null;
    }
    return;
  }

  const canvasEl = document.getElementById('cal-trend-canvas');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  
  if (calorieChartInstance) {
    calorieChartInstance.destroy();
  }

  const last7Days = STATE.calorieHistory.slice(-7);
  const labels = last7Days.map(item => {
    const parts = item.date.split('-');
    return `${parts[2]}-${parts[1]}`;
  });
  
  const consumedData = last7Days.map(item => item.consumed);
  const burnedData = last7Days.map(item => item.burned);

  try {
    calorieChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Iste\'mol (Kcal)',
            data: consumedData,
            backgroundColor: 'rgba(56, 189, 248, 0.65)',
            borderColor: '#38bdf8',
            borderWidth: 1.5,
            borderRadius: 5
          },
          {
            label: 'Sarf (Kcal)',
            data: burnedData,
            backgroundColor: 'rgba(168, 85, 247, 0.65)',
            borderColor: '#a855f7',
            borderWidth: 1.5,
            borderRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f8fafc', font: { family: 'Plus Jakarta Sans', size: 10 } }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: { color: '#94a3b8' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  } catch (e) {
    console.warn("Chart.js draw failed", e);
  }
}

function logQuickWeight() {
  const weightVal = parseFloat(DOM.inputQuickWeight.value);
  if (!weightVal || weightVal < 30 || weightVal > 250) {
    alert("Ilтимос, вазнни тўғри киритинг (30 - 250 кг)!");
    return;
  }

  const todayStr = getTodayDateKey();
  
  if (STATE.profile) {
    STATE.profile.weight = weightVal;
  }

  const index = STATE.weightHistory.findIndex(h => h.date === todayStr);
  if (index !== -1) {
    STATE.weightHistory[index].weight = weightVal;
  } else {
    STATE.weightHistory.push({
      date: todayStr,
      weight: weightVal
    });
    if (STATE.weightHistory.length > 30) {
      STATE.weightHistory.shift();
    }
  }

  saveStateToLocalStorage();
  setupDashboard();
  setupProfileScreen();
  setupBmiAndIdealWeight();
  renderWeightTrendChart();
  
  DOM.inputQuickWeight.value = '';
  alert("Бугунги вазн муваффақиятли сақланди!");
}

// --- DIARY LOGS SUMMARY LOGIC ---

function setupDiary() {
  let sumCal = 0;
  let sumP = 0;
  let sumF = 0;
  let sumC = 0;

  DOM.diaryMealsListContainer.innerHTML = '';

  if (STATE.diary.length === 0) {
    DOM.diaryEmptyState.classList.remove('hidden');
    DOM.diaryMealsListContainer.classList.add('hidden');
  } else {
    DOM.diaryEmptyState.classList.add('hidden');
    DOM.diaryMealsListContainer.classList.remove('hidden');

    STATE.diary.forEach((meal, index) => {
      sumCal += parseInt(meal.calories, 10) || 0;
      sumP += parseFloat(meal.proteins) || 0;
      sumF += parseFloat(meal.fats) || 0;
      sumC += parseFloat(meal.carbs) || 0;

      const mealElement = document.createElement('div');
      mealElement.className = 'meal-item';
      
      const proteinsStr = meal.proteins ? `${meal.proteins}г` : '-';
      const fatsStr = meal.fats ? `${meal.fats}г` : '-';
      const carbsStr = meal.carbs ? `${meal.carbs}г` : '-';
      const weightStr = meal.weight ? ` (${meal.weight}г)` : '';

      mealElement.innerHTML = `
        <div class="meal-details-left">
          <span class="meal-name">${escapeHTML(meal.name)}${weightStr}</span>
          <div class="meal-macro-dots">
            <span><span class="dot dot-protein" style="display:inline-block"></span> P: ${proteinsStr}</span>
            <span><span class="dot dot-fat" style="display:inline-block"></span> F: ${fatsStr}</span>
            <span><span class="dot dot-carb" style="display:inline-block"></span> C: ${carbsStr}</span>
          </div>
        </div>
        <div class="meal-details-right">
          <span class="meal-calories-lbl">${meal.calories} ккал</span>
          <button class="btn-delete-meal" data-index="${index}" title="Ўчириш">
            <i data-lucide="trash"></i>
          </button>
        </div>
      `;
      DOM.diaryMealsListContainer.appendChild(mealElement);
    });

    lucide.createIcons();

    // Attach deletion handlers
    document.querySelectorAll('.btn-delete-meal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        deleteMeal(idx);
      });
    });
  }

  // Update Diary Summary
  DOM.diarySumCal.innerHTML = `${sumCal} <small>ккал</small>`;
  DOM.diarySumP.innerHTML = `${Math.round(sumP * 10) / 10}<small>г</small>`;
  DOM.diarySumF.innerHTML = `${Math.round(sumF * 10) / 10}<small>г</small>`;
  DOM.diarySumC.innerHTML = `${Math.round(sumC * 10) / 10}<small>г</small>`;
}

function addMealToDiary(meal) {
  STATE.diary.push(meal);
  saveStateToLocalStorage();
  setupDashboard();
  setupDiary();
}

function deleteMeal(index) {
  STATE.diary.splice(index, 1);
  saveStateToLocalStorage();
  setupDashboard();
  setupDiary();
}

function clearDiaryToday() {
  if (confirm("Бугунги барча овқатлар рўйхатини тозаламоқчимисиз?")) {
    STATE.diary = [];
    saveStateToLocalStorage();
    setupDashboard();
    setupDiary();
  }
}

// --- WORKOUTS LOGGER LOGIC ---

function updateWorkoutCaloriePreview() {
  if (!STATE.profile) return;
  const met = parseFloat(DOM.workoutSelectType.value);
  const duration = parseInt(DOM.workoutInputDuration.value, 10) || 0;
  
  if (duration <= 0) {
    DOM.workoutBurnPreview.textContent = `~0 ккал`;
    return;
  }
  
  // Scientific MET Burn Formula
  // Calories Burned = MET * 3.5 * weight_kg / 200 * duration_mins
  const weight = parseFloat(STATE.profile.weight) || 70;
  const burned = Math.round(met * 3.5 * weight / 200 * duration);
  DOM.workoutBurnPreview.textContent = `~${burned} ккал`;
}

function setupWorkouts() {
  DOM.workoutItemsContainer.innerHTML = '';
  let totalBurned = 0;

  if (STATE.workouts.length === 0) {
    DOM.workoutEmptyState.classList.remove('hidden');
    DOM.workoutItemsContainer.classList.add('hidden');
  } else {
    DOM.workoutEmptyState.classList.add('hidden');
    DOM.workoutItemsContainer.classList.remove('hidden');

    STATE.workouts.forEach((ex, index) => {
      totalBurned += parseInt(ex.caloriesBurned, 10) || 0;

      const item = document.createElement('div');
      item.className = 'workout-item';
      item.innerHTML = `
        <div class="workout-details-left">
          <span class="workout-name-lbl">${escapeHTML(ex.name)}</span>
          <span class="workout-sub-lbl">
            <i data-lucide="clock" style="width:12px;height:12px"></i> ${ex.duration} minut
          </span>
        </div>
        <div class="workout-details-right">
          <span class="workout-cal-burned">-${ex.caloriesBurned} ккал</span>
          <button class="btn-delete-workout" data-index="${index}" title="Ўчириш">
            <i data-lucide="trash"></i>
          </button>
        </div>
      `;
      DOM.workoutItemsContainer.appendChild(item);
    });

    lucide.createIcons();

    document.querySelectorAll('.btn-delete-workout').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        deleteWorkout(idx);
      });
    });
  }

  DOM.workoutTotalBurnedVal.textContent = totalBurned;
}

function addWorkout(exercise) {
  STATE.workouts.push(exercise);
  saveStateToLocalStorage();
  setupDashboard();
  setupWorkouts();
}

function deleteWorkout(index) {
  STATE.workouts.splice(index, 1);
  saveStateToLocalStorage();
  setupDashboard();
  setupWorkouts();
}

// --- WORKOUT SUB-TABS, OFFLINE GUIDE & SVG ANATOMICAL MAP LOGIC ---

function initWorkoutSubTabs() {
  if (STATE.workoutSubTabsInitialized) {
    // Just refresh the active view without duplicate event binding
    switchWorkoutTab(STATE.activeWorkoutTab);
    return;
  }

  // 1. Bind Sub-Tab navigation buttons
  document.querySelectorAll('.workout-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchWorkoutTab(btn.dataset.target);
    });
  });

  // 2. Bind Category Filter Chips
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      STATE.selectedWorkoutCategory = chip.dataset.category;
      renderWorkoutGuide();
    });
  });

  // 3. Bind SVG Muscle Hotspots
  document.querySelectorAll('.muscle-group').forEach(group => {
    group.addEventListener('click', () => {
      document.querySelectorAll('.muscle-group').forEach(g => g.classList.remove('selected'));
      
      const muscleId = group.dataset.muscle;
      
      // Select corresponding groups in BOTH Front and Back SVGs if they exist
      document.querySelectorAll(`.muscle-group[data-muscle="${muscleId}"]`).forEach(g => {
        g.classList.add('selected');
      });
      
      STATE.selectedAnatomyMuscle = muscleId;
      renderAnatomyProfile();
      
      // Scroll smoothly to results card on mobile
      const resultBox = document.getElementById('anatomy-result-box');
      if (resultBox) {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // 4. Bind Front/Back 3D anatomical view card flip switchers
  const btnFront = document.getElementById('btn-anatomy-front');
  const btnBack = document.getElementById('btn-anatomy-back');
  const cardInner = document.getElementById('anatomy-card-inner');
  
  if (btnFront && btnBack && cardInner) {
    btnFront.addEventListener('click', () => {
      btnFront.classList.add('active');
      btnBack.classList.remove('active');
      cardInner.classList.remove('flipped');
    });

    btnBack.addEventListener('click', () => {
      btnBack.classList.add('active');
      btnFront.classList.remove('active');
      cardInner.classList.add('flipped');
    });

    // Touch swipe gesture logic for buttery smooth mobile mannequin spinning
    let startX = 0;
    const swipeContainer = document.querySelector('.anatomy-maps-container');
    if (swipeContainer) {
      swipeContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true });

      swipeContainer.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diffX = endX - startX;
        
        // Swipe threshold is 50 pixels
        if (Math.abs(diffX) > 50) {
          const isCurrentlyFlipped = cardInner.classList.contains('flipped');
          if (diffX > 0) {
            // Swipe Right -> Show Front (remove flipped class)
            if (isCurrentlyFlipped) {
              cardInner.classList.remove('flipped');
              btnFront.classList.add('active');
              btnBack.classList.remove('active');
            }
          } else {
            // Swipe Left -> Show Back (add flipped class)
            if (!isCurrentlyFlipped) {
              cardInner.classList.add('flipped');
              btnBack.classList.add('active');
              btnFront.classList.remove('active');
            }
          }
        }
      }, { passive: true });
    }
  }

  // Bind Biomechanics tip modal trigger on click for both guide and anatomy views
  const tipClickHandler = (e) => {
    const tipBtn = e.target.closest('.btn-bio-tip');
    if (tipBtn) {
      const name = tipBtn.dataset.name;
      const tip = tipBtn.dataset.tip;
      showBioTipModal(name, tip);
    }
  };

  const guideContainer = document.getElementById('exercise-guide-container');
  if (guideContainer) guideContainer.addEventListener('click', tipClickHandler);

  const anatomyResultBox = document.getElementById('anatomy-result-box');
  if (anatomyResultBox) anatomyResultBox.addEventListener('click', tipClickHandler);

  // Draw initial guide/anatomy views
  STATE.workoutSubTabsInitialized = true;
  switchWorkoutTab(STATE.activeWorkoutTab);
}

function showBioTipModal(exerciseName, tipContent) {
  const existing = document.getElementById('modal-dynamic-bio-tip');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-dynamic-bio-tip';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-container card" style="max-height: 80vh;">
      <div class="modal-header">
        <h3 class="modal-title title-gradient" style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="shield-alert" style="color:var(--accent-green)"></i> Biomekanika Maslahati
        </h3>
        <button class="modal-close" onclick="document.getElementById('modal-dynamic-bio-tip').remove()"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <h4 style="margin-bottom: 12px; color: var(--primary); font-size: 1.05rem;">${exerciseName}</h4>
        <p style="background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255,255,255,0.04); padding: 16px; border-radius: 12px; color: var(--text-sub); line-height: 1.6; font-size: 0.9rem;">
          ${tipContent}
        </p>
      </div>
      <div class="modal-footer" style="padding-top: 10px;">
        <button class="btn btn-accent flex-1" onclick="document.getElementById('modal-dynamic-bio-tip').remove()">Tushunarli <i data-lucide="check"></i></button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
}

function switchWorkoutTab(targetTabId) {
  STATE.activeWorkoutTab = targetTabId;

  // Toggle active sub-tab nav button
  document.querySelectorAll('.workout-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === targetTabId);
  });

  // Toggle visible panels
  document.querySelectorAll('.workout-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === targetTabId);
    panel.classList.toggle('hidden', panel.id !== targetTabId);
  });

  if (targetTabId === 'workout-guide-panel') {
    renderWorkoutGuide();
  } else if (targetTabId === 'workout-anatomy-panel') {
    setupAnatomyView();
  }
}

function renderWorkoutGuide() {
  const container = document.getElementById('exercise-guide-container');
  if (!container) return;

  container.innerHTML = '';
  const filtered = STATE.selectedWorkoutCategory === 'all'
    ? EXERCISES_DATABASE
    : EXERCISES_DATABASE.filter(ex => ex.category === STATE.selectedWorkoutCategory);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Ushbu kategoriya bo'yicha mashqlar topilmadi.</p></div>`;
    return;
  }

  filtered.forEach(ex => {
    const card = document.createElement('div');
    card.className = 'card guide-card';
    
    // Convert English category tag to display name
    let catUzbek = "Mashq";
    if (ex.category === 'chest') catUzbek = "Ko'krak";
    else if (ex.category === 'back') catUzbek = "Orqa";
    else if (ex.category === 'legs') catUzbek = "Oyoq";
    else if (ex.category === 'arms') catUzbek = "Qo'l & Yelka";
    else if (ex.category === 'core') catUzbek = "Qorin";

    card.innerHTML = `
      <div class="guide-card-img-wrapper">
        <span class="guide-card-badge">${catUzbek}</span>
        <img src="https://images.unsplash.com/${ex.unsplashId}?auto=format&fit=crop&w=400&q=80" alt="${ex.name}" class="guide-card-img" onerror="this.src='icons/icon-192.png'">
      </div>
      <div class="guide-card-content">
        <h4 class="guide-card-title">${ex.name}</h4>
        <p class="guide-card-desc">${ex.desc}</p>
        <div class="guide-card-desc" style="font-size:0.76rem;background:rgba(255,255,255,0.015);padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.03);line-height:1.45;">
          <strong style="color:var(--primary);">Bajarish texnikasi:</strong><br>${ex.steps}
        </div>
        <div class="guide-card-meta">
          <span class="guide-meta-item" title="Tavsiya etilgan yuklama"><i data-lucide="repeat"></i> <span class="guide-meta-val">${ex.sets}</span></span>
          <span class="guide-meta-item btn-bio-tip" style="cursor:pointer;color:var(--accent-green);font-weight:600;" data-name="${escapeHTML(ex.name)}" data-tip="${escapeHTML(ex.biomechanicsTip)}"><i data-lucide="shield-alert"></i> Bio-Maslahat</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();
}

function setupAnatomyView() {
  // Sync selected visual class highlights
  document.querySelectorAll('.muscle-group').forEach(g => g.classList.remove('selected'));
  if (STATE.selectedAnatomyMuscle) {
    document.querySelectorAll(`.muscle-group[data-muscle="${STATE.selectedAnatomyMuscle}"]`).forEach(g => {
      g.classList.add('selected');
    });
  }
  renderAnatomyProfile();
}

function renderAnatomyProfile() {
  const resultBox = document.getElementById('anatomy-result-box');
  if (!resultBox) return;

  if (!STATE.selectedAnatomyMuscle) {
    resultBox.innerHTML = `
      <div class="result-placeholder">
        <i data-lucide="info" class="placeholder-icon"></i>
        <p>Tahlil olish uchun tana sxemasidan biror muskulni bosing...</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const profile = ANATOMY_DATABASE[STATE.selectedAnatomyMuscle];
  if (!profile) return;

  // Build targeted exercises cards list
  let exercisesHtml = '';
  profile.exercises.forEach(exId => {
    const ex = EXERCISES_DATABASE.find(e => e.id === exId);
    if (ex) {
      exercisesHtml += `
        <div class="anatomy-exercise-card">
          <img src="https://images.unsplash.com/${ex.unsplashId}?auto=format&fit=crop&w=120&q=80" alt="${ex.name}" class="anatomy-exercise-img" onerror="this.src='icons/icon-192.png'">
          <div class="anatomy-exercise-details">
            <span class="anatomy-exercise-name">${ex.name}</span>
            <span class="anatomy-exercise-sets">${ex.sets}</span>
            <span class="anatomy-exercise-tip"><strong style="color:var(--accent-green)">Texnika:</strong> ${ex.biomechanicsTip}</span>
          </div>
        </div>
      `;
    }
  });

  resultBox.innerHTML = `
    <div class="anatomy-result-content">
      <div class="anatomy-header">
        <div class="anatomy-title-row">
          <h3>${profile.name}</h3>
          <span class="anatomy-latin">${profile.latin}</span>
        </div>
        <p class="anatomy-function"><strong>Asosiy funksiyasi:</strong> ${profile.func}</p>
      </div>

      <div class="biomechanics-lever-info">
        <i data-lucide="git-branch"></i>
        <span><strong>Biomekanik kuch leveri:</strong> ${profile.lever}</span>
      </div>

      <div class="biomechanics-box">
        <div class="correct-box">
          <span class="box-title"><i data-lucide="check-circle"></i> To'g'ri bajarish (DO)</span>
          <span class="box-txt">${profile.do}</span>
        </div>
        <div class="error-box">
          <span class="box-title"><i data-lucide="alert-triangle"></i> Xato bajarish (DON'T)</span>
          <span class="box-txt">${profile.dont}</span>
        </div>
      </div>

      <div class="anatomy-exercises-section">
        <h4><i data-lucide="dumbbell"></i> Tavsiya etilgan mashqlar:</h4>
        <div class="anatomy-exercises-list">
          ${exercisesHtml || '<p class="box-txt">Ushbu guruh uchun mashqlar ro\'yxati tuzilmagan.</p>'}
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}


// --- BMI AND IDEAL WEIGHT ANALYZER (WHO Standards) ---

function setupBmiAndIdealWeight() {
  if (!STATE.profile) return;

  const weight = parseFloat(STATE.profile.weight) || 70;
  const height = parseFloat(STATE.profile.height) || 175;
  const hMeter = height / 100;
  
  const bmi = Math.round((weight / (hMeter * hMeter)) * 10) / 10;
  
  DOM.profileBmiScoreVal.textContent = bmi;

  // Calculate healthy limits (BMI 18.5 - 24.9)
  const minIdeal = Math.round((18.5 * hMeter * hMeter) * 10) / 10;
  const maxIdeal = Math.round((24.9 * hMeter * hMeter) * 10) / 10;
  
  DOM.profileIdealWeightRangeTxt.textContent = `${minIdeal} - ${maxIdeal} кг`;

  // Categorize
  let status = "Оптимал вазн";
  let ptrLeftPercent = 50; 
  let scaleColor = 'var(--accent-green)';

  if (bmi < 18.5) {
    status = "Кам вазн (Underweight)";
    scaleColor = '#38bdf8';
    ptrLeftPercent = Math.max(5, (bmi / 18.5) * 25);
  } else if (bmi >= 18.5 && bmi < 25.0) {
    status = "Нормал вазн (Healthy)";
    scaleColor = 'var(--accent-green)';
    ptrLeftPercent = 25 + (((bmi - 18.5) / 6.5) * 25);
  } else if (bmi >= 25.0 && bmi < 30.0) {
    status = "Ортиқча вазн (Overweight)";
    scaleColor = 'var(--accent-orange)';
    ptrLeftPercent = 50 + (((bmi - 25.0) / 5) * 25);
  } else {
    status = "Семириш (Obese)";
    scaleColor = 'var(--danger)';
    ptrLeftPercent = 75 + Math.min(20, ((bmi - 30.0) / 15) * 20);
  }

  DOM.profileBmiStatusTxt.textContent = status;
  DOM.profileBmiStatusTxt.style.color = scaleColor;
  DOM.profileBmiScoreVal.style.color = scaleColor;
  DOM.profileBmiScoreVal.parentElement.style.borderColor = scaleColor;
  DOM.profileBmiScoreVal.parentElement.style.boxShadow = `0 0 15px ${scaleColor}40`;
  
  DOM.profileBmiPointer.style.left = `${ptrLeftPercent}%`;
  DOM.profileBmiPointer.querySelector('.pointer-arrow').style.borderTopColor = scaleColor;
  DOM.profileBmiPointer.querySelector('.pointer-glow').style.backgroundColor = scaleColor;
  DOM.profileBmiPointer.querySelector('.pointer-glow').style.boxShadow = `0 0 8px ${scaleColor}`;
}

// --- SMART WATER COUNTDOWN ALARM TIMER (Web Audio Water-Drop Synth) ---

function startWaterAlarmTimer() {
  if (STATE.waterAlarmIntervalId) {
    clearInterval(STATE.waterAlarmIntervalId);
  }

  STATE.waterAlarmIntervalId = setInterval(() => {
    if (STATE.waterTimerSecondsLeft > 0) {
      STATE.waterTimerSecondsLeft--;
    } else {
      triggerWaterAlarmNotification();
      STATE.waterTimerSecondsLeft = 7200; // Reset countdown to 2 hours
    }
    
    updateWaterTimerUI();
    
    if (STATE.waterTimerSecondsLeft % 60 === 0) {
      const todayStr = getTodayDateKey();
      localStorage.setItem(`aurafit_water_seconds_${todayStr}`, STATE.waterTimerSecondsLeft.toString());
    }
  }, 1000);
}

function updateWaterTimerUI() {
  if (!DOM.waterTimerClockVal) return;
  const hrs = Math.floor(STATE.waterTimerSecondsLeft / 3600);
  const mins = Math.floor((STATE.waterTimerSecondsLeft % 3600) / 60);
  const secs = STATE.waterTimerSecondsLeft % 60;

  const hStr = hrs.toString().padStart(2, '0');
  const mStr = mins.toString().padStart(2, '0');
  const sStr = secs.toString().padStart(2, '0');

  DOM.waterTimerClockVal.textContent = `${hStr}:${mStr}:${sStr}`;
}

// Client-side Web Audio Synth Water drop beep
function playWaterAlarmSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); 
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.error("Web Audio failed", e);
  }
}

function triggerWaterAlarmNotification() {
  playWaterAlarmSound();

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification('Сув Баланси Эслатмаси 💧', {
            body: 'Бир стакан сув ичиш вақти келди! Организмни намлик билан бойитинг.',
            icon: 'icons/icon-192.png',
            vibrate: [200, 100, 200]
          });
        });
      } else {
        new Notification('Сув Баланси Эслатмаси 💧', {
          body: 'Бир стакан сув ичиш вақти келди!',
          icon: 'icons/icon-192.png'
        });
      }
    } catch (e) {
      console.warn("Notification trigger failed", e);
    }
  }

  alert("💧 СУВ ВАҚТИ!\nОрганизм намлигини ошириш ва соғлом калория метаболизми учун ҳозир 1 стакан (250мл) сув ичишни тавсия қиламан.");
}

// --- PROFILE SCREEN SETUP ---

function setupProfileScreen() {
  if (!STATE.profile) return;
  const goals = calculateNutritionGoals(STATE.profile);

  DOM.profileNameTxt.textContent = STATE.profile.name || "Фойдаланувчи";
  
  let goalText = 'Вазнни Сақлаш';
  if (STATE.profile.goal === 'lose') goalText = 'Соғлом Озиш';
  if (STATE.profile.goal === 'gain') goalText = 'Соғлом Семириш';
  if (STATE.profile.goal === 'recomp') goalText = 'Тана Рекомпозицияси';
  DOM.profileGoalTxt.textContent = `Мақсад: ${goalText}`;

  DOM.profileHeightTxt.innerHTML = `${STATE.profile.height} <small>см</small>`;
  DOM.profileWeightTxt.innerHTML = `${STATE.profile.weight} <small>кг</small>`;
  DOM.profileTdeeTxt.innerHTML = `${goals.tdee} <small>ккал</small>`;

  if (STATE.profile.geminiApiKey) {
    DOM.settingsApiKey.value = STATE.profile.geminiApiKey;
    DOM.apiKeyStatusIndicator.className = 'key-status-indicator text-success';
    DOM.apiKeyStatusIndicator.innerHTML = '<span class="status-dot"></span> Созланган';
  } else {
    DOM.settingsApiKey.value = '';
    DOM.apiKeyStatusIndicator.className = 'key-status-indicator text-danger';
    DOM.apiKeyStatusIndicator.innerHTML = '<span class="status-dot"></span> Киритилмаган';
  }
}

// --- LIVE BARCODE SCANNING & OPEN FOOD FACTS ---

function toggleBarcodeCamera() {
  if (STATE.barcodeScannerInstance) {
    stopBarcodeScanner();
  } else {
    startBarcodeScanner();
  }
}

function startBarcodeScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    alert("Камера сканери кутубхонаси юкланмаган! Илтимос, интернет алоқасини текширинг.");
    return;
  }

  DOM.btnToggleBarcodeScanner.textContent = "Камерани Ўчириш";
  DOM.btnToggleBarcodeScanner.className = "btn btn-secondary btn-block";
  
  try {
    STATE.barcodeScannerInstance = new Html5Qrcode("barcode-reader-viewport");
    
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      stopBarcodeScanner();
      searchBarcodeInOpenFoodFacts(decodedText);
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 150 } };
    
    STATE.barcodeScannerInstance.start(
      { facingMode: "environment" },
      config,
      qrCodeSuccessCallback
    ).catch(err => {
      console.error("Camera access failed", err);
      alert("Камерага кириб бўлмади! Штрих-кодни қўлда ёзиб қидиришингиз мумкин.");
      stopBarcodeScanner();
    });
  } catch (e) {
    console.error("Barcode scanner setup failed", e);
    stopBarcodeScanner();
  }
}

function stopBarcodeScanner() {
  DOM.btnToggleBarcodeScanner.textContent = "Камерани Ёқиш";
  DOM.btnToggleBarcodeScanner.className = "btn btn-primary btn-block";
  
  if (STATE.barcodeScannerInstance) {
    try {
      STATE.barcodeScannerInstance.stop().then(() => {
        STATE.barcodeScannerInstance = null;
      }).catch(err => {
        console.error("Stop failed", err);
        STATE.barcodeScannerInstance = null;
      });
    } catch (e) {
      STATE.barcodeScannerInstance = null;
    }
  }
}

async function searchBarcodeInOpenFoodFacts(barcode) {
  if (!barcode) return;
  DOM.barcodeLoadingIndicator.classList.remove('hidden');

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    if (!response.ok) throw new Error("Тармоқ хатоси");
    
    const data = await response.json();
    
    if (data.status === 0 || !data.product) {
      alert(`Маҳсулот топилмади! Код: ${barcode}\nМаълумотларни қўлда киритинг.`);
      DOM.foodInputName.value = `Штрихкод: ${barcode}`;
      DOM.modalAddFood.classList.remove('hidden');
      return;
    }
    
    const product = data.product;
    const pName = product.product_name || product.product_name_uz || product.product_name_en || "Номаълум маҳсулот";
    const nutriments = product.nutriments || {};
    
    const calories = Math.round(nutriments['energy-kcal_100g'] || (nutriments['energy_100g'] / 4.184) || 0);
    const proteins = parseFloat(nutriments['proteins_100g'] || 0);
    const fats = parseFloat(nutriments['fat_100g'] || 0);
    const carbs = parseFloat(nutriments['carbohydrates_100g'] || 0);

    DOM.foodInputName.value = pName;
    DOM.foodInputCal.value = calories;
    DOM.foodInputWeight.value = 100;
    DOM.foodInputP.value = proteins;
    DOM.foodInputF.value = fats;
    DOM.foodInputC.value = carbs;
    
    DOM.modalAddFood.classList.remove('hidden');
    
  } catch (error) {
    console.error("Barcode lookup error", error);
    alert("Маълумот олишда хатолик юз берди.");
  } finally {
    DOM.barcodeLoadingIndicator.classList.add('hidden');
  }
}

// --- INTERACTIVE DIETICIAN AI CHAT (Gemini API with Profile Context) ---

function renderQuickPrompts() {
  const container = document.getElementById('chat-suggested-prompts-row');
  if (!container) return;

  container.innerHTML = '';
  
  const prompts = STATE.selectedCoach === 'trainer' ? [
    { text: "🏋️‍♂️ 3 кунлик машқ режаси", query: "Озиш ва жисмоний чидамлилик учун уй шароитида бажариладиган 3 кунлик тренировка режасини батафсил тузиб бер." },
    { text: "🔥 Уйда вазн ташлаш", query: "Уй шароитида ҳеч қандай анжомларсиз ёғ эритиш учун энг самарали кардио машқлар режасини расмлар билан кўрсат." },
    { text: "💪 Мушак ўстириш", query: "Куч тўплаш ва мушак массасини ошириш учун асосий куч машқлари режасини ва оқсилга бой овқатланиш маслаҳатларини бер." }
  ] : [
    { text: "🥗 Кунлик соғлом меню", query: "Бугунги қолган калория ва БЖУ балансимни инобатга олган ҳолда, мен учун соғлом ва мазали кунлик таомнома тавсия қил." },
    { text: "🍎 Тезироқ озиш диетаси", query: "Соғлом ва хавфсиз озиш учун қандай парҳез тутишим керак ва кундалик овқатланишда нималарга эътибор беришим лозим?" },
    { text: "🥑 БЖУ баланси нима?", query: "Оқсил, ёғ ва углеводлар (БЖУ) баланси соғлиқ учун нега муҳим ва уларни қандай тўғри тақсимлаш керак?" }
  ];

  prompts.forEach(p => {
    const chip = document.createElement('button');
    chip.className = 'prompt-chip';
    chip.textContent = p.text;
    chip.type = 'button';
    if (STATE.chatIsThinking) {
      chip.disabled = true;
    }
    chip.addEventListener('click', () => {
      if (STATE.chatIsThinking) return;
      DOM.chatInputText.value = p.query;
      DOM.btnSendChatMsg.disabled = false;
      sendChatMessage();
    });
    container.appendChild(chip);
  });
}

function setupChatScreen() {
  DOM.chatMessagesContainer.innerHTML = '';
  
  if (STATE.chatHistory.length === 0) {
    const welcomeBubble = document.createElement('div');
    welcomeBubble.className = 'chat-msg ai-msg';
    const coachName = STATE.selectedCoach === 'trainer' ? 'AuraFit АИ Мураббий' : 'AuraFit АИ Диетолог';
    const welcomeText = STATE.selectedCoach === 'trainer' 
      ? 'Ассалому алайкум! Мен сизнинг AuraFit шахсий спорт мураббийингизман. Машқлар режаси, тренировкалар, уй шароитида вазн ташлаш ёки мушак чиқариш бўйича исталган саволингизни беришингиз мумкин.'
      : 'Ассалому алайкум! Мен сизнинг AuraFit шахсий АИ диетологингизман. Соғлом овқатланиш, озиш, машқлар ёки кунлик таомлар рецепти ҳақида исталган саволингизни беришингиз мумкин.';
    
    welcomeBubble.innerHTML = `
      <div class="msg-bubble">
        <b>${coachName}:</b><br>${welcomeText}
      </div>
      <span class="msg-time">Ҳозир</span>
    `;
    DOM.chatMessagesContainer.appendChild(welcomeBubble);
  } else {
    STATE.chatHistory.forEach(msg => {
      const msgBubble = document.createElement('div');
      msgBubble.className = `chat-msg ${msg.role === 'user' ? 'user-msg' : 'ai-msg'}`;
      msgBubble.innerHTML = `
        <div class="msg-bubble">${msg.role === 'user' ? escapeHTML(msg.text) : formatAiResponse(msg.text)}</div>
        <span class="msg-time">${msg.time}</span>
      `;
      DOM.chatMessagesContainer.appendChild(msgBubble);
    });
    scrollToBottomChat();
  }

  // Populate dynamic quick prompts chips
  renderQuickPrompts();
}

function scrollToBottomChat() {
  DOM.chatMessagesContainer.scrollTop = DOM.chatMessagesContainer.scrollHeight;
}

async function sendChatMessage() {
  const userText = DOM.chatInputText.value.trim();
  if (!userText || STATE.chatIsThinking) return;

  const apiKey = STATE.profile.geminiApiKey;
  if (!apiKey) {
    alert("API калити созланмаган! Илтимос, созламалардан калитни киритинг.");
    return;
  }

  // Prevent multiple overlapping chat calls
  STATE.chatIsThinking = true;
  document.querySelectorAll('.prompt-chip').forEach(chip => chip.disabled = true);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-msg user-msg';
  userBubble.innerHTML = `
    <div class="msg-bubble">${escapeHTML(userText)}</div>
    <span class="msg-time">${timeStr}</span>
  `;
  DOM.chatMessagesContainer.appendChild(userBubble);
  scrollToBottomChat();

  STATE.chatHistory.push({ role: 'user', text: userText, time: timeStr });
  DOM.chatInputText.value = '';
  DOM.btnSendChatMsg.disabled = true;

  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-msg ai-msg';
  typingBubble.id = 'ai-typing-indicator';
  typingBubble.innerHTML = `
    <div class="msg-bubble" style="display:flex;align-items:center;gap:6px">
      <i data-lucide="loader" class="animate-spin" style="width:14px;height:14px"></i> Фикрламоқда...
    </div>
  `;
  DOM.chatMessagesContainer.appendChild(typingBubble);
  lucide.createIcons();
  scrollToBottomChat();

  try {
    const goals = calculateNutritionGoals(STATE.profile);
    
    let consumedCal = 0;
    let p = 0; let f = 0; let c = 0;
    STATE.diary.forEach(m => {
      consumedCal += parseInt(m.calories, 10) || 0;
      p += parseFloat(m.proteins) || 0;
      f += parseFloat(m.fats) || 0;
      c += parseFloat(m.carbs) || 0;
    });

    let burnedCal = 0;
    STATE.workouts.forEach(ex => {
      burnedCal += parseInt(ex.caloriesBurned, 10) || 0;
    });

    const userGoalTxt = STATE.profile.goal === 'lose' ? 'Соғлом Озиш' : STATE.profile.goal === 'gain' ? 'Соғлом Семириш' : STATE.profile.goal === 'recomp' ? 'Тана Рекомпозицияси' : 'Вазн Сақлаш';

    let chatSystemContext = "";
    if (STATE.selectedCoach === 'trainer') {
      chatSystemContext = `
        Сен профессионал АИ спорт мураббийси ва шахсий тренерисан. Исминг "AuraFit АИ Мураббий".
        Саволларни фақат ўзбек тилида лотин ёзувида жавоб қайтар.
        
        Ҳозирги фойдаланувчи ҳақида тизимли маълумотлар:
        - Жинси: ${STATE.profile.gender === 'male' ? 'Erkak' : 'Ayol'}
        - Ёши: ${STATE.profile.age} ёшда
        - Бўйи: ${STATE.profile.height} см
        - Вазни: ${STATE.profile.weight} кг
        - Асосий мақсади: ${userGoalTxt}
        
        Бугунги Кундалик овқатланиш ва машқлар баланси:
        - Кунлик оптимал калория меъёри (Мақсад): ${goals.targetCalories} ккал
        - Истеъмол қилди (Бугун ейилди): ${consumedCal} ккал
        - Машқларда сарфлади (Бажарилган спорт): ${burnedCal} ккал
        
        Фойдаланувчи сенга спорт машғулотлари, фитнес, тана рекомпозицияси, мушак чиқариш ва кунлик спорт режаси ҳақида савол бермоқда. 
        Суҳбатда юқоридаги шахсий кўрсаткичларни ва мақсадни доимо инобатга ол. Маслаҳатларинг спортга оид, қисқа, лўнда ва илмий бўлсин (4-5 та гапдан ошмасин).

        МУҲИМ: Ҳар сафар бирор машқ ёки спорт турини тавсия қилганингда, унга мос расмни мажбурий равишда Unsplash ҳаволаси орқали Маркдаун синтаксиси билан хабар ичига қўш: 
        \`![caption](https://images.unsplash.com/featured/300x200?<инглизча_машқ_ёки_спорт_калити>)\`
        Масалан: \`![pushups](https://images.unsplash.com/featured/300x200?pushups)\` ёки \`![running](https://images.unsplash.com/featured/300x200?running)\`. Фақат шу Unsplash форматидан фойдалан ва калит сўзни инглиз тилида ёз.
      `;
    } else {
      chatSystemContext = `
        Сен профессионал АИ диетолог ва нутрициологсан. Исминг "AuraFit АИ Диетолог".
        Саволларни фақат ўзбек тилида лотин ёзувида жавоб қайтар.
        
        Ҳозирги фойдаланувчи ҳақида тизимли маълумотлар:
        - Жинси: ${STATE.profile.gender === 'male' ? 'Erkak' : 'Ayol'}
        - Ёши: ${STATE.profile.age} ёшда
        - Бўйи: ${STATE.profile.height} см
        - Вазни: ${STATE.profile.weight} кг
        - Асосий мақсади: ${userGoalTxt}
        
        Бугунги Кундалик овқатланиш ва машқлар баланси:
        - Кунлик оптимал калория меъёри (Мақсад): ${goals.targetCalories} ккал
        - Истеъмол қилди (Бугун ейилди): ${consumedCal} ккал (Оқсил: ${Math.round(p)}г, Ёғ: ${Math.round(f)}г, Углевод: ${Math.round(c)}г)
        - Машқларда сарфлади (Бажарилган спорт): ${burnedCal} ккал
        - Кунлик меъёр учун оқсил режаси: ${goals.targetProtein}г, ёғ режаси: ${goals.targetFat}г, углевод режаси: ${goals.targetCarbs}г.
        
        Фойдаланувчи сенга овқатланиш, парҳез, калориялар, соғлом рецептлар ва нутрициология ҳақида савол бермоқда.
        Суҳбатда юқоридаги шахсий кўрсаткичларни ва овқатларни доимо инобатга ол. Маслаҳатларинг қисқа, лўнда ва илмий бўлсин (4-5 та гапдан ошмасин).

        МУҲИМ: Ҳар сафар бирор фойдали овқат, сабзавот, мева ёки соғлом маҳсулотни тавсия қилганингда, унга мос расмни мажбурий равишда Unsplash ҳаволаси орқали Маркдаун синтаксиси билан хабар ичига қўш: 
        \`![caption](https://images.unsplash.com/featured/300x200?<инглизча_овқат_ёки_маҳсулот_калити>)\`
        Масалан: \`![salad](https://images.unsplash.com/featured/300x200?salad)\` ёки \`![apple](https://images.unsplash.com/featured/300x200?apple)\`. Фақат шу Unsplash форматидан фойдалан ва калит сўзни инглиз тилида ёз.
      `;
    }

    // Strictly alternate roles walking backwards to construct bulletproof history
    const chatPromptContents = [];
    let expectedRole = 'user';
    for (let i = STATE.chatHistory.length - 1; i >= 0; i--) {
      const msg = STATE.chatHistory[i];
      const apiRole = msg.role === 'user' ? 'user' : 'model';
      if (apiRole === expectedRole) {
        chatPromptContents.unshift({
          role: apiRole,
          parts: [{ text: msg.text }]
        });
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
      if (chatPromptContents.length >= 6) {
        break;
      }
    }

    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: chatPromptContents,
        systemInstruction: {
          parts: [{ text: chatSystemContext }]
        }
      })
    });

    if (!response.ok) {
      let errText = "АИ алоқа хатолиги юз берди";
      try {
        const errorData = await response.json();
        errText = errorData.error?.message || errText;
      } catch (_) {}
      throw new Error(errText);
    }

    const data = await response.json();
    const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Саволингизни тушуна олмадим.";

    const indicator = document.getElementById('ai-typing-indicator');
    if (indicator) indicator.remove();

    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-msg ai-msg';
    aiBubble.innerHTML = `
      <div class="msg-bubble">${formatAiResponse(aiResponseText)}</div>
      <span class="msg-time">${timeStr}</span>
    `;
    DOM.chatMessagesContainer.appendChild(aiBubble);
    scrollToBottomChat();

    STATE.chatHistory.push({ role: 'model', text: aiResponseText, time: timeStr });
    saveStateToLocalStorage();

  } catch (error) {
    console.error("Chat API error:", error);
    
    // Clean up history and UI
    STATE.chatHistory.pop();
    saveStateToLocalStorage();

    const indicator = document.getElementById('ai-typing-indicator');
    if (indicator) indicator.remove();

    const bubbles = DOM.chatMessagesContainer.querySelectorAll('.chat-msg.user-msg');
    if (bubbles.length > 0) {
      bubbles[bubbles.length - 1].remove();
    }

    // Restore text for convenience
    DOM.chatInputText.value = userText;
    DOM.btnSendChatMsg.disabled = false;

    alert(`Хатолик юз берди: ${error.message}`);
  } finally {
    STATE.chatIsThinking = false;
    document.querySelectorAll('.prompt-chip').forEach(chip => chip.disabled = false);
  }
}

// --- AI CHEF MEAL PLANNER & PANTRY RECIPES ---

async function generateChefRecipe(isFridgeMode = false) {
  const apiKey = STATE.profile.geminiApiKey;
  if (!apiKey) {
    alert("API калити созланмаган! Илтимос, созламалардан калитни киритинг.");
    return;
  }

  const goals = calculateNutritionGoals(STATE.profile);
  let consumedCal = 0;
  let p = 0; let f = 0; let c = 0;
  STATE.diary.forEach(m => {
    consumedCal += parseInt(m.calories, 10) || 0;
    p += parseFloat(m.proteins) || 0;
    f += parseFloat(m.fats) || 0;
    c += parseFloat(m.carbs) || 0;
  });

  let burnedCal = 0;
  STATE.workouts.forEach(ex => {
    burnedCal += parseInt(ex.caloriesBurned, 10) || 0;
  });

  const remainingCal = Math.max(100, (goals.targetCalories + burnedCal) - consumedCal);
  const remainingP = Math.max(5, goals.targetProtein - p);
  const remainingF = Math.max(5, goals.targetFat - f);
  const remainingC = Math.max(10, goals.targetCarbs - c);

  DOM.chefRecipeLoader.classList.remove('hidden');
  DOM.chefRecipeOutputBox.classList.add('hidden');
  DOM.btnGenerateAiRecipe.disabled = true;
  DOM.btnGenerateFridgeRecipe.disabled = true;

  if (isFridgeMode) {
    DOM.chefLoaderStatusTxt.textContent = "АИ Ошпаз музлатгич маҳсулотларини таҳлил қилмоқда...";
  } else {
    DOM.chefLoaderStatusTxt.textContent = `АИ Ошпаз қолган ${Math.round(remainingCal)} ккал учун овқат режалаштирмоқда...`;
  }

  try {
    let prompt = "";
    
    if (isFridgeMode) {
      const ingredientsText = DOM.inputFridgeIngredients.value.trim();
      if (!ingredientsText) {
        alert("Илтимос, музлатгичда бор маҳсулотларни ёзинг!");
        DOM.chefRecipeLoader.classList.add('hidden');
        DOM.btnGenerateAiRecipe.disabled = false;
        DOM.btnGenerateFridgeRecipe.disabled = false;
        return;
      }
      
      prompt = `
        Сен профессионал диетолог ва моҳир ошпазсан.
        Фойдаланувчи уйида фақат мана бу маҳсулотлар борлигини айтди: "${ingredientsText}".
        Ушбу маҳсулотлардан фойдаланиб тайёрланиши мумкин бўлган битта СОҒЛОМ ВА ФОЙДАЛИ овқат рецептини ўзбек тилида лотин ёзувида ярат.
        Ушбу таомнинг умумий калорияси, оқсил, ёғ ва углеводларини ҳисобла.
        Бугун қолган максимал калория лимити: ${remainingCal} ккал.
      `;
    } else {
      prompt = `
        Сен соғлом турмуш тарзи бўйича моҳир ошпаз ва диетологсан.
        Фойдаланувчи бугун куннинг ушбу қисми учун рецепт сўрамоқда: "${STATE.activeChefMealType}".
        Бугун фойдаланувчи ейиши қолган кўрсаткичлар (бу таом тахминан шу балансга мос бўлиши кирак):
        - Қолган Калория: ${remainingCal} ккал
        - Қолган Оқсил: ${remainingP} г
        - Қолган Ёғ: ${remainingF} г
        - Қолган Углевод: ${remainingC} г
        
        Ушбу лимитлар ва меъёр оралиғига жуда яхши мос тушувчи битта миллий ёки замонавий соғлом овқат рецептини ўзбек тилида лотин ёзувида яратиб бер.
      `;
    }

    prompt += `
      Жавобни фақат мана бу СТРУКТУРАЛАШГАН JSON форматида қайтар (JSON дан бошқа қўшимча матн ёки markdown ёзма):
      {
        "recipe_name": "Таом номи (Масалан: Товуқли фитнес салат)",
        "calories": 310,
        "proteins": 22.5,
        "fats": 8.0,
        "carbs": 12.5,
        "weight_g": 250,
        "ingredients": [
          {"name": "Товуқ филеси (Chicken breast)", "weight_g": 120},
          {"name": "Помидор (Tomato)", "weight_g": 80}
        ],
        "instructions": "Маҳсулотларни қайнатинг ва тўғраб аралаштиринг..."
      }
    `;

    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      let errText = "АИ алоқа хатолиги юз берди";
      try {
        const errorData = await response.json();
        errText = errorData.error?.message || errText;
      } catch (_) {}
      throw new Error(errText);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error("АИ жавоб қайтармади");

    const resultJson = JSON.parse(resultText.trim());
    STATE.activeAiChefRecipe = resultJson;

    DOM.recipeOutTitle.textContent = resultJson.recipe_name || "Фитнес Таом";
    DOM.recipeOutCal.textContent = Math.round(resultJson.calories) || 0;
    DOM.recipeOutP.textContent = resultJson.proteins || 0;
    DOM.recipeOutF.textContent = resultJson.fats || 0;
    DOM.recipeOutC.textContent = resultJson.carbs || 0;

    DOM.recipeOutIngredientsList.innerHTML = '';
    if (resultJson.ingredients && resultJson.ingredients.length > 0) {
      resultJson.ingredients.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${escapeHTML(item.name)}</span> <span>~${escapeHTML(item.weight_g)} г</span>`;
        DOM.recipeOutIngredientsList.appendChild(li);
      });
    }

    DOM.recipeOutInstructionsTxt.textContent = resultJson.instructions || "Пишириш босқичлари ёзилмаган.";
    DOM.chefRecipeOutputBox.classList.remove('hidden');

    if (isFridgeMode) {
      DOM.inputFridgeIngredients.value = '';
    }

  } catch (error) {
    console.error("AI Chef error", error);
    alert(`Рецепт яратишда хатолик юз берди: ${error.message}`);
  } finally {
    DOM.chefRecipeLoader.classList.add('hidden');
    DOM.btnGenerateAiRecipe.disabled = false;
    DOM.btnGenerateFridgeRecipe.disabled = false;
  }
}

function logChefRecipeToDiary() {
  if (!STATE.activeAiChefRecipe) return;

  const meal = {
    name: STATE.activeAiChefRecipe.recipe_name || 'АИ Соғлом овқат',
    calories: Math.round(STATE.activeAiChefRecipe.calories) || 0,
    weight: STATE.activeAiChefRecipe.weight_g || null,
    proteins: STATE.activeAiChefRecipe.proteins || null,
    fats: STATE.activeAiChefRecipe.fats || null,
    carbs: STATE.activeAiChefRecipe.carbs || null,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  addMealToDiary(meal);
  
  DOM.chefRecipeOutputBox.classList.add('hidden');
  STATE.activeAiChefRecipe = null;
  
  switchTab('screen-dashboard');
  alert("АИ Рецепт кундаликка овқат сифатида муваффақиятли қўшилди!");
}

// --- GOOGLE GEMINI IMAGE ANALYSIS (VISION) ---

async function analyzeFoodImage() {
  if (!STATE.selectedImageBase64 || !STATE.selectedImageMime) {
    alert("Илтимос, овқат расмини юкланг!");
    return;
  }

  const apiKey = STATE.profile.geminiApiKey;
  if (!apiKey) {
    alert("API калити созланмаган! Илтимос, созламалардан калитни киритинг.");
    return;
  }

  DOM.analysisLoadingBox.classList.remove('hidden');
  DOM.scannerActionsRow.classList.add('hidden');
  DOM.btnRemovePreview.classList.add('hidden');

  const statusProgress = [
    "Сунъий интеллект расмни ўқимоқда...",
    "Овқат таркиби аниқланмоқда...",
    "Калория ва БЖУ миқдори ҳисобланмоқда...",
    "Шахсий диетолог тавсияси ёзилмоқда..."
  ];
  
  let statusIndex = 0;
  const statusInterval = setInterval(() => {
    if (statusIndex < statusProgress.length - 1) {
      statusIndex++;
      DOM.loadingStatusMsg.textContent = statusProgress[statusIndex];
    }
  }, 2200);

  try {
    const goals = calculateNutritionGoals(STATE.profile);
    const userGoalTxt = STATE.profile.goal === 'lose' ? 'озиш' : STATE.profile.goal === 'gain' ? 'семириш' : 'вазн сақлаш';
    
    const systemPrompt = `
      Сен профессионал диетолог ва нутрициологсан. Расмдаги овқатни таҳлил қил.
      Маҳсулотлар тури ва уларнинг грамм оғирликларини аниқла.
      Сўнгра ушбу таомнинг умумий Калорияси (ккал), Оқсил (Protein, г), Ёғ (Fat, г) ва Углевод (Carb, г) миқдорларини ҳисоблаб чиқ.
      Истеъмолчининг мақсади: ${userGoalTxt} (Кунлик мақсад калорияси: ${goals.targetCalories} ккал).
      Ушбу мақсадни инобатга олиб, фойдаланувчи учун фойдали 1-2 та тезкор қисқача маслаҳат ёз (соғлом овқатланиш борасида).
      Маслаҳат фақат ўзбек тилида лотин ёзувида бўлсин (ўта қисқа, 2 та гапдан ошмасин).
      
      Жавобни СТРУКТУРАЛАШГАН JSON форматида қайтар. Ушбу JSON қуйидаги майдонларни ИЧИГА ОЛИШИ КЕРАК:
      {
        "food_name": "Овқат номи (Ўзбек ва инглиз тилида, масалан: Osh (Pilaf))",
        "calories": 420,
        "proteins": 15.5,
        "fats": 12.0,
        "carbs": 58.2,
        "weight_g": 350,
        "ingredients": [
          {"name": "Гуруч (Rice)", "weight_g": 120},
          {"name": "Гўшт (Beef)", "weight_g": 80}
        ],
        "healthy_tip": "Маслаҳат матни бу ери..."
      }
      Нишон сифатида фақат ушбу JSON нинг ўзинигина қайтар, markdown ёки қўшимча сўзлар қўшма.
    `;

    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: STATE.selectedImageMime,
                data: STATE.selectedImageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Алоқа хатолиги");
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) throw new Error("АИ жавоб қайтармади.");

    const resultJson = JSON.parse(resultText.trim());
    STATE.activeAiScanResult = resultJson;
    showAiResultModal(resultJson);

  } catch (error) {
    console.error("AI Analysis Error:", error);
    alert(`Хатолик юз берди: ${error.message}`);
  } finally {
    clearInterval(statusInterval);
    DOM.analysisLoadingBox.classList.add('hidden');
    DOM.scannerActionsRow.classList.remove('hidden');
    DOM.btnRemovePreview.classList.remove('hidden');
  }
}

function showAiResultModal(result) {
  DOM.aiFoodName.textContent = result.food_name || "Номаълум таом";
  DOM.aiCalories.textContent = Math.round(result.calories) || 0;
  DOM.aiProtein.textContent = `${result.proteins || 0}г`;
  DOM.aiFat.textContent = `${result.fats || 0}г`;
  DOM.aiCarbs.textContent = `${result.carbs || 0}г`;

  DOM.aiResultImageView.src = DOM.capturedImageView.src;

  DOM.aiIngredientsList.innerHTML = '';
  if (result.ingredients && result.ingredients.length > 0) {
    result.ingredients.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHTML(item.name)}</span> <span>~${escapeHTML(item.weight_g)} г</span>`;
      DOM.aiIngredientsList.appendChild(li);
    });
  } else {
    DOM.aiIngredientsList.innerHTML = '<li><span>Аниқланмади</span> <span>-</span></li>';
  }

  DOM.aiHealthyTip.textContent = result.healthy_tip || "Соғлом овқатланинг.";
  DOM.modalAiResult.classList.remove('hidden');
}

function editAiResultValues() {
  if (!STATE.activeAiScanResult) return;
  DOM.modalAiResult.classList.add('hidden');
  
  DOM.foodInputName.value = STATE.activeAiScanResult.food_name || '';
  DOM.foodInputCal.value = Math.round(STATE.activeAiScanResult.calories) || '';
  DOM.foodInputWeight.value = STATE.activeAiScanResult.weight_g || '';
  DOM.foodInputP.value = STATE.activeAiScanResult.proteins || '';
  DOM.foodInputF.value = STATE.activeAiScanResult.fats || '';
  DOM.foodInputC.value = STATE.activeAiScanResult.carbs || '';
  
  DOM.modalAddFood.classList.remove('hidden');
}

// --- INTERACTIVE ACTIONS & NAVIGATION ---

function switchTab(targetScreenId) {
  STATE.activeTab = targetScreenId;

  if (targetScreenId !== 'screen-scanner') {
    stopBarcodeScanner();
  }

  DOM.screens.forEach(screen => {
    screen.classList.toggle('active', screen.id === targetScreenId);
  });

  DOM.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.target === targetScreenId);
  });

  if (targetScreenId === 'screen-dashboard') {
    setupDashboard();
    setTimeout(() => {
      renderWeightTrendChart();
      renderCalorieHistoryChart();
    }, 100);
  } else if (targetScreenId === 'screen-chat') {
    switchChatPanel('chat-message-panel');
    setupChatScreen();
  } else if (targetScreenId === 'screen-workout') {
    setupWorkouts();
  } else if (targetScreenId === 'screen-settings') {
    setupDiary();
    setupProfileScreen();
    setupBmiAndIdealWeight();
  }
}

function switchScannerPanel(targetPanelId) {
  STATE.activeScannerTab = targetPanelId;
  DOM.scannerPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === targetPanelId);
  });
  DOM.scannerTabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === targetPanelId);
  });
  if (targetPanelId !== 'scanner-barcode-panel') {
    stopBarcodeScanner();
  }
}

function switchChatPanel(targetPanelId) {
  STATE.activeChatTab = targetPanelId;
  DOM.chatPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === targetPanelId);
  });
  DOM.chatTabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === targetPanelId);
  });
}

function handleImageSelection(file) {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Илтимос, фақат расм танланг!');
    return;
  }

  // Show inline compression feedback inside the dropzone
  const originalPromptHtml = DOM.dropzonePrompt.innerHTML;
  DOM.dropzonePrompt.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--primary);padding:20px;">
      <i data-lucide="loader" class="animate-spin" style="width:28px;height:28px"></i>
      <span style="font-size:0.9rem;font-weight:600;">Расм сиқиляпти (Оптималлаштириш)...</span>
    </div>
  `;
  try {
    lucide.createIcons();
  } catch (e) {}

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // 1024px limit guarantees quick uploads, zero mobile lags, and 100% stable API payloads
      const maxDim = 1024;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      // Draw onto downscaled canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed 0.75-quality JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
      const splitData = compressedDataUrl.split(',');
      
      STATE.selectedImageMime = 'image/jpeg';
      STATE.selectedImageBase64 = splitData[1];

      DOM.capturedImageView.src = compressedDataUrl;
      DOM.imagePreviewBox.classList.remove('hidden');
      DOM.dropzonePrompt.classList.add('hidden');
      DOM.btnStartAnalysis.disabled = false;
      
      // Restore dropzone layout
      DOM.dropzonePrompt.innerHTML = originalPromptHtml;
      try {
        lucide.createIcons();
      } catch (e) {}
    };
    img.onerror = function() {
      alert("Расмни ўқишда хатолик юз берди.");
      DOM.dropzonePrompt.innerHTML = originalPromptHtml;
      try {
        lucide.createIcons();
      } catch (e) {}
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeSelectedImage() {
  STATE.selectedImageBase64 = null;
  STATE.selectedImageMime = null;
  DOM.capturedImageView.src = '';
  DOM.imagePreviewBox.classList.add('hidden');
  DOM.dropzonePrompt.classList.remove('hidden');
  DOM.btnStartAnalysis.disabled = true;
}

// --- LOCAL WEB NOTIFICATION SYSTEM ---

function requestLocalNotificationPermission() {
  if (!('Notification' in window)) {
    alert("Кечирасиз, ушбу браузер ёки телефон билдиришномаларни қўллаб-қувватламайди.");
    return;
  }

  try {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        alert("Билдиришномаларга рухсат берилди! Энди илова сизга сув ичиш ва овқатланишни эслатиб туради.");
        triggerLocalWelcomeNotification();
      } else {
        alert("Билдиришномалар рад этилди.");
      }
    });
  } catch (e) {
    console.warn("Notification request failed", e);
  }
}

function triggerLocalWelcomeNotification() {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('AuraFit — Фаол Эслатмалар', {
          body: 'Сув ичиш ва кундалик калорияларни ёзиб боришни унутманг! Соғлиқ ўз қўлингизда.',
          icon: 'icons/icon-192.png',
          badge: 'icons/icon-192.png',
          tag: 'aurafit-alert',
          vibrate: [100, 50, 100]
        });
      });
    } else {
      new Notification('AuraFit — Фаол Эслатмалар', {
        body: 'Сув ичиш ва кундалик калорияларни ёзишни унутманг!',
        icon: 'icons/icon-192.png'
      });
    }
  } catch (e) {
    console.warn("Local welcome alert failed", e);
  }
}

// --- EVENT LISTENERS REGISTRATION ---

function setupEventListeners() {
  
  // --- BOTTOM NAV TABS ---
  DOM.navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.target);
    });
  });

  // --- WELCOME WIZARD FLOW ---
  
  DOM.genderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.genderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      wizardData.gender = btn.dataset.gender;
    });
  });

  DOM.goalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.goalBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      wizardData.goal = btn.dataset.goal;
    });
  });

  document.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const currentActive = document.querySelector('.wizard-step.active');
      const currentStepNum = parseInt(currentActive.dataset.step, 10);
      
      if (currentStepNum === 3) {
        if (!DOM.wizardAge.value || !DOM.wizardWeight.value || !DOM.wizardHeight.value) {
          alert("Илтимос, кўрсаткичларни тўлиқ киритинг!");
          return;
        }
      }
      setWizardStep(currentStepNum + 1);
    });
  });

  document.querySelectorAll('.skip-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const currentActive = document.querySelector('.wizard-step.active');
      const currentStepNum = parseInt(currentActive.dataset.step, 10);
      setWizardStep(currentStepNum + 1);
    });
  });

  DOM.finishWizardBtn.addEventListener('click', () => {
    const age = parseInt(DOM.wizardAge.value, 10);
    const weight = parseFloat(DOM.wizardWeight.value);
    const height = parseFloat(DOM.wizardHeight.value);

    if (!age || !weight || !height) {
      alert("Маълумотлар тўлиқ эмас! 3-босқичга ўтиб тўлдиринг.");
      setWizardStep(3);
      return;
    }

    STATE.profile = {
      name: "Фойдаланувчи",
      gender: wizardData.gender,
      age: age,
      weight: weight,
      height: height,
      activity: DOM.wizardActivity.value,
      goal: wizardData.goal,
      geminiApiKey: DOM.wizardApiKey.value.trim()
    };

    const todayStr = getTodayDateKey();
    STATE.weightHistory.push({
      date: todayStr,
      weight: weight
    });

    saveStateToLocalStorage();
    hideWizard();
    setupDashboard();
    setupDiary();
    setupWorkouts();
    setupProfileScreen();
    setupBmiAndIdealWeight();
    initWorkoutSubTabs();
    switchTab('screen-dashboard');
  });

  DOM.toggleWizardKey.addEventListener('click', () => {
    const isPass = DOM.wizardApiKey.type === 'password';
    DOM.wizardApiKey.type = isPass ? 'text' : 'password';
    DOM.toggleWizardKey.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}"></i>`;
    lucide.createIcons();
  });

  DOM.toggleSettingsKey.addEventListener('click', () => {
    const isPass = DOM.settingsApiKey.type === 'password';
    DOM.settingsApiKey.type = isPass ? 'text' : 'password';
    DOM.toggleSettingsKey.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}"></i>`;
    lucide.createIcons();
  });

  // --- DASHBOARD DYNAMIC WEIGHT LOG & TOGGLES ---
  DOM.btnSaveQuickWeight.addEventListener('click', logQuickWeight);
  
  DOM.btnShowWeightChart.addEventListener('click', () => {
    DOM.btnShowWeightChart.classList.add('active');
    DOM.btnShowCalChart.classList.remove('active');
    DOM.weightChartBox.classList.remove('hidden');
    DOM.calChartBox.classList.add('hidden');
    renderWeightTrendChart();
  });

  DOM.btnShowCalChart.addEventListener('click', () => {
    DOM.btnShowCalChart.classList.add('active');
    DOM.btnShowWeightChart.classList.remove('active');
    DOM.calChartBox.classList.remove('hidden');
    DOM.weightChartBox.classList.add('hidden');
    renderCalorieHistoryChart();
  });

  // --- WATER EVENTS ---
  DOM.btnWaterQuick.forEach(btn => {
    btn.addEventListener('click', () => {
      const ml = parseInt(btn.dataset.ml, 10);
      STATE.water += ml;
      saveStateToLocalStorage();
      setupDashboard();
    });
  });

  DOM.resetWaterBtn.addEventListener('click', () => {
    if (confirm("Сув балансини нолламоқчимисиз?")) {
      STATE.water = 0;
      saveStateToLocalStorage();
      setupDashboard();
    }
  });

  DOM.btnRequestNotifications.addEventListener('click', requestLocalNotificationPermission);

  // --- MANUAL ADD FOOD MODAL FLOW ---
  DOM.btnTriggerAddFood.addEventListener('click', () => {
    DOM.formManualAddFood.reset();
    DOM.modalAddFood.classList.remove('hidden');
  });

  DOM.btnCloseAddFoodModal.addEventListener('click', () => DOM.modalAddFood.classList.add('hidden'));
  DOM.btnCancelAddFood.addEventListener('click', () => DOM.modalAddFood.classList.add('hidden'));

  DOM.formManualAddFood.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const meal = {
      name: DOM.foodInputName.value,
      calories: parseInt(DOM.foodInputCal.value, 10),
      weight: DOM.foodInputWeight.value ? parseInt(DOM.foodInputWeight.value, 10) : null,
      proteins: DOM.foodInputP.value ? parseFloat(DOM.foodInputP.value) : null,
      fats: DOM.foodInputF.value ? parseFloat(DOM.foodInputF.value) : null,
      carbs: DOM.foodInputC.value ? parseFloat(DOM.foodInputC.value) : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addMealToDiary(meal);
    DOM.modalAddFood.classList.add('hidden');
  });

  // --- SCANNER SCREEN SWITCH TAB PANELS ---
  DOM.tabBtnVision.addEventListener('click', () => switchScannerPanel('scanner-vision-panel'));
  DOM.tabBtnBarcode.addEventListener('click', () => switchScannerPanel('scanner-barcode-panel'));

  // --- AI SCANNER CAMERA EVENTS ---
  DOM.btnTriggerAiCamera.addEventListener('click', () => {
    switchTab('screen-scanner');
    switchScannerPanel('scanner-vision-panel');
  });

  DOM.cameraDropzone.addEventListener('click', (e) => {
    if (e.target.closest('#btn-remove-preview')) return;
    DOM.cameraFileInput.click();
  });

  DOM.cameraFileInput.addEventListener('change', (e) => {
    handleImageSelection(e.target.files[0]);
  });

  DOM.btnSelectFile.addEventListener('click', () => {
    DOM.cameraFileInput.click();
  });

  DOM.btnRemovePreview.addEventListener('click', (e) => {
    e.stopPropagation();
    removeSelectedImage();
  });

  DOM.btnStartAnalysis.addEventListener('click', analyzeFoodImage);

  // --- BARCODE SCANNER LOGIC ---
  DOM.btnToggleBarcodeScanner.addEventListener('click', toggleBarcodeCamera);
  
  DOM.btnSubmitManualBarcode.addEventListener('click', () => {
    const code = DOM.inputManualBarcode.value.trim();
    if (code) {
      searchBarcodeInOpenFoodFacts(code);
      DOM.inputManualBarcode.value = '';
    } else {
      alert("Илтимос, штрих-кодни киритинг!");
    }
  });

  DOM.inputManualBarcode.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      DOM.btnSubmitManualBarcode.click();
    }
  });

  // --- SCREEN CHAT TABS AND CHEF LOGIC ---
  DOM.chatTabBtnMessage.addEventListener('click', () => switchChatPanel('chat-message-panel'));
  DOM.chatTabBtnChef.addEventListener('click', () => switchChatPanel('chat-chef-panel'));

  DOM.chefMealsSelectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.chefMealsSelectorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeChefMealType = btn.dataset.mealType;
    });
  });

  DOM.btnGenerateAiRecipe.addEventListener('click', () => generateChefRecipe(false));
  DOM.btnGenerateFridgeRecipe.addEventListener('click', () => generateChefRecipe(true));
  DOM.btnLogChefRecipeToDiary.addEventListener('click', logChefRecipeToDiary);

  // --- AI RESULT MODAL EVENTS ---
  DOM.btnCloseAiModal.addEventListener('click', () => {
    DOM.modalAiResult.classList.add('hidden');
    removeSelectedImage();
  });

  DOM.btnEditAiResult.addEventListener('click', editAiResultValues);

  DOM.btnSaveAiResult.addEventListener('click', () => {
    if (!STATE.activeAiScanResult) return;
    
    const meal = {
      name: STATE.activeAiScanResult.food_name || 'Скан қилинган овқат',
      calories: Math.round(STATE.activeAiScanResult.calories) || 0,
      weight: STATE.activeAiScanResult.weight_g || null,
      proteins: STATE.activeAiScanResult.proteins || null,
      fats: STATE.activeAiScanResult.fats || null,
      carbs: STATE.activeAiScanResult.carbs || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addMealToDiary(meal);
    DOM.modalAiResult.classList.add('hidden');
    removeSelectedImage();
    switchTab('screen-dashboard');
  });

  // --- AI CHAT SCREEN EVENTS ---
  DOM.chatInputText.addEventListener('input', () => {
    DOM.btnSendChatMsg.disabled = DOM.chatInputText.value.trim() === '';
  });

  DOM.chatInputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  DOM.btnSendChatMsg.addEventListener('click', sendChatMessage);

  const selectAiCoach = document.getElementById('select-ai-coach');
  if (selectAiCoach) {
    selectAiCoach.addEventListener('change', (e) => {
      STATE.selectedCoach = e.target.value;
      const titleEl = document.getElementById('chat-ai-title');
      const subtitleEl = document.getElementById('chat-ai-subtitle');
      const avatarIconEl = document.getElementById('chat-ai-avatar-icon');
      
      if (STATE.selectedCoach === 'trainer') {
        if (titleEl) titleEl.textContent = 'AuraFit АИ Мураббий';
        if (subtitleEl) subtitleEl.textContent = 'Машқлар ва рекомпозиция бўйича мураббий';
        if (avatarIconEl) {
          avatarIconEl.innerHTML = '<i data-lucide="dumbbell"></i>';
          avatarIconEl.style.borderColor = 'rgba(168, 85, 247, 0.4)';
          avatarIconEl.style.color = 'var(--accent-purple)';
        }
        DOM.chatInputText.placeholder = "Мураббийга савол беринг...";
      } else {
        if (titleEl) titleEl.textContent = 'AuraFit АИ Диетолог';
        if (subtitleEl) subtitleEl.textContent = 'Нутрициолог ва овқатланиш бўйича маслаҳатчи';
        if (avatarIconEl) {
          avatarIconEl.innerHTML = '<i data-lucide="bot"></i>';
          avatarIconEl.style.borderColor = 'rgba(56, 189, 248, 0.4)';
          avatarIconEl.style.color = 'var(--primary)';
        }
        DOM.chatInputText.placeholder = "Диетологга савол беринг...";
      }
      lucide.createIcons();
      renderQuickPrompts();
    });
  }
  DOM.btnResetChatHistory.addEventListener('click', () => {
    if (confirm("Чат суҳбатлари тарихини бутунлай тозаламоқчимисиз?")) {
      STATE.chatHistory = [];
      saveStateToLocalStorage();
      setupChatScreen();
    }
  });

  // --- WORKOUT LOGGER EVENTS ---
  DOM.workoutSelectType.addEventListener('change', updateWorkoutCaloriePreview);
  DOM.workoutInputDuration.addEventListener('input', updateWorkoutCaloriePreview);

  DOM.formLogWorkout.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!STATE.profile) return;

    const met = parseFloat(DOM.workoutSelectType.value);
    const duration = parseInt(DOM.workoutInputDuration.value, 10);
    const name = MET_FACTORS[DOM.workoutSelectType.value] || 'Жисмоний машқ';

    const weight = parseFloat(STATE.profile.weight) || 70;
    const burned = Math.round(met * 3.5 * weight / 200 * duration);

    const exercise = {
      name: name,
      met: met,
      duration: duration,
      caloriesBurned: burned,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    addWorkout(exercise);
    DOM.workoutInputDuration.value = '';
    DOM.workoutBurnPreview.textContent = '~0 ккал';
    alert("Машқ муваффақиятли қўшилди!");
  });

  // --- PROFILE SCREEN CONFIG EVENTS ---
  DOM.btnEditProfile.addEventListener('click', () => {
    if (!STATE.profile) return;
    
    DOM.wizardAge.value = STATE.profile.age;
    DOM.wizardHeight.value = STATE.profile.height;
    DOM.wizardWeight.value = STATE.profile.weight;
    DOM.wizardApiKey.value = STATE.profile.geminiApiKey || '';
    DOM.wizardActivity.value = STATE.profile.activity;
    
    wizardData.gender = STATE.profile.gender;
    DOM.genderBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.gender === STATE.profile.gender);
    });

    wizardData.goal = STATE.profile.goal;
    DOM.goalBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.goal === STATE.profile.goal);
    });

    showWizard();
    setWizardStep(3);
  });

  try {
    document.querySelector('.setting-collapsible-header').addEventListener('click', () => {
      document.querySelector('.setting-collapsible').classList.toggle('open');
    });
  } catch (e) {
    console.warn("Collapsible header not found", e);
  }

  DOM.btnSaveSettingsKey.addEventListener('click', () => {
    if (!STATE.profile) return;

    STATE.profile.geminiApiKey = DOM.settingsApiKey.value.trim();
    saveStateToLocalStorage();
    setupProfileScreen();
    setupDashboard();
    setupBmiAndIdealWeight();
    alert("API калит муваффақиятли сақланди!");
    document.querySelector('.setting-collapsible').classList.remove('open');
  });

  DOM.btnClearDiaryToday.addEventListener('click', clearDiaryToday);

  DOM.btnResetApp.addEventListener('click', () => {
    if (confirm("ДИҚҚАТ! Иловадаги барча маълумотларингиз, вазн тарихи, графиклар ва чатлар бутунлай ўчирилади. Розимисиз?")) {
      localStorage.clear();
      STATE.profile = null;
      STATE.diary = [];
      STATE.workouts = [];
      STATE.water = 0;
      STATE.weightHistory = [];
      STATE.calorieHistory = [];
      STATE.chatHistory = [];
      removeSelectedImage();
      showWizard();
    }
  });

  // --- Drag and drop ---
  const dropzone = DOM.cameraDropzone;
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
        dropzone.style.background = 'rgba(56, 189, 248, 0.05)';
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        dropzone.style.background = 'rgba(0, 0, 0, 0.2)';
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleImageSelection(files[0]);
    });
  }

  // Bind the API key missing warning link to transition to Settings screen
  if (DOM.linkToSettingsKey) {
    DOM.linkToSettingsKey.addEventListener('click', () => {
      switchTab('screen-settings');
      const collapsible = document.querySelector('.setting-collapsible');
      if (collapsible) {
        collapsible.classList.add('open');
      }
    });
  }
}
