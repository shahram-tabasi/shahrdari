/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PROJECT DATASET — pilot seed data.
 *
 * !! THIS IS ILLUSTRATIVE SEED DATA, NOT MUNICIPAL RECORD. !!
 * In the operational system every field below arrives from the project-record
 * and data-quality modules and carries its own provenance. Replace this file
 * with a database-backed repository before go-live; see
 * `repositories/decision.repository.js`, which is the seam for that swap.
 *
 * FIELD GROUPS (each mirrors a section of the directive's data model):
 *
 *   classification    Project class, mission domain, nature category and
 *                     decision unit. Drives which comparison matrix the
 *                     project lands in — see `data/project-classes.js`.
 *
 *   mandatory         Answers to the filter-1 pass/fail gates. Keys must match
 *                     the codes in `data/criteria.js`. A MISSING key means
 *                     REJECTED, not "assumed compliant".
 *
 *   scores            Dimension-level scores (the 8 dimensions).
 *
 *   criterionScores   Criterion-level scores (codes T1..C2). Sparse on purpose.
 *                     A criterion absent here falls back to its dimension score
 *                     and the fallback is RECORDED in the data-quality report,
 *                     never silently hidden.
 *
 *   lifecycle         Inputs required to evaluate an in-progress project on
 *                     future cost and benefit. Mandatory for the `inProgress`
 *                     class; a missing field is a blocking finding.
 *
 *   finance           Annual cash flow, future commitments and funding mix.
 *                     `cashFlow` keys are Persian calendar years and should sum
 *                     to roughly `lifecycle.costToComplete` — the data-quality
 *                     engine warns when they drift apart by more than 5%.
 *
 *   dependencies      Prerequisites, mutual exclusions and "at least one of"
 *                     groups. Referenced ids must exist or screening fails.
 *
 *   readiness         Document, permit and land-acquisition readiness. Feeds
 *                     the delivery-capacity constraints.
 *
 * Persian strings here are user-visible content (names, districts, rationale
 * text), not comments.
 */

const projects = [
  {
    id: "P-1041",
    name: "تقاطع غیرهمسطح بلوار جمهوری",
    district: "منطقه ۲",
    category: "حمل‌ونقل",
    status: "در حال اجرا",
    budget: 940,
    score: 92,
    justice: 0.74,
    risk: 34,
    deviation: 12,
    progress: 46,
    aiRecommended: true,
    beneficiaries: 82000,
    lat: 30.2925,
    lng: 57.0555,
    classification: {
      projectClass: "inProgress",
      missionDomain: "infrastructure",
      natureCategory: "construction",
      decisionUnit: "project",
      megaProject: true,
      neighborhoodScale: false,
      lowImpact: false
    },
    mandatory: {
      M1: true, M2: true, M3: true, M4: true, M5: true,
      "M6-A": true, "M6-B": true, "M6-C": true, "M6-D": true,
      "M6-E": true, "M6-F": true, "M6-G": true
    },
    scores: {
      social: 88, financial: 58, environmental: 44, technical: 86,
      economic: 81, organizational: 90, risk: 34, competitive: 78
    },
    criterionScores: {
      T4: 62, T6: 46, T8: 95, T10: 25, S3: 84, S5: 74, F1: 88, E: 44
    },
    lifecycle: {
      physicalProgressPercent: 46,
      financialProgressPercent: 41,
      costToComplete: 508,
      monthsToComplete: 20,
      contractualCommitments: 470,
      terminationCost: 130,
      potentialDamages: 90,
      depreciationRisk: 0.35,
      monthsToBenefit: 22,
      realizableBenefits: 1450,
      phaseable: true,
      annualOperatingCost: 18
    },
    finance: {
      cashFlow: { 1405: 340, 1406: 380, 1407: 220 },
      futureCommitments: 600,
      internalSharePercent: 78,
      externalSharePercent: 22,
      earmarkedFund: { key: "publicTransportFund", draw: 280 }
    },
    dependencies: { requires: [], conflictsWith: ["P-1091"], group: null },
    readiness: {
      hasExecutivePlan: true,
      landAcquisitionComplete: false,
      permitsReady: true
    },
    explain:
      "این پروژه به دلیل ترکیب بهینه فوریت فنی و جمعیت بهره‌مند روزانه (بیش از ۸۰ هزار سفر)، بالاتر از پروژه پارک شهروند قرار گرفته است. حساسیت رتبه آن به وزن معیار «فوریت فنی» بالاست."
  },
  {
    id: "P-1052",
    name: "بازآفرینی بافت تاریخی محله شهر",
    district: "منطقه ۱",
    category: "زیرساخت",
    status: "تایید شده",
    budget: 610,
    score: 88,
    justice: 0.91,
    risk: 41,
    deviation: 4,
    progress: 22,
    aiRecommended: true,
    beneficiaries: 21400,
    lat: 30.2848,
    lng: 57.0785,
    classification: {
      projectClass: "newDevelopment",
      missionDomain: "urbanism",
      natureCategory: "development",
      decisionUnit: "project",
      megaProject: true,
      neighborhoodScale: true,
      lowImpact: false
    },
    mandatory: {
      M1: true, M2: true, M3: true, M4: true, M5: true,
      "M6-A": true, "M6-B": true, "M6-C": true, "M6-D": true,
      "M6-E": true, "M6-F": true, "M6-G": true
    },
    scores: {
      social: 92, financial: 64, environmental: 71, technical: 76,
      economic: 68, organizational: 86, risk: 41, competitive: 72
    },
    criterionScores: {
      S1: 78, S2: 88, S3: 74, S4: 90, S5: 91, S6: 86,
      O1: 89, O2: 88, E: 71, F5: 74
    },
    lifecycle: {
      physicalProgressPercent: 22,
      financialProgressPercent: 19,
      costToComplete: 476,
      monthsToComplete: 30,
      contractualCommitments: 180,
      terminationCost: 40,
      potentialDamages: 25,
      depreciationRisk: 0.22,
      monthsToBenefit: 32,
      realizableBenefits: 980,
      phaseable: true,
      annualOperatingCost: 12
    },
    finance: {
      cashFlow: { 1405: 220, 1406: 240, 1407: 150 },
      futureCommitments: 390,
      internalSharePercent: 62,
      externalSharePercent: 38,
      earmarkedFund: null
    },
    dependencies: { requires: [], conflictsWith: [], group: "historicCore" },
    readiness: {
      hasExecutivePlan: true,
      landAcquisitionComplete: true,
      permitsReady: true
    },
    explain:
      "ارزش استراتژیک پنهان: بالاترین ضریب عدالت فضایی سبد را دارد و همزمان سه هدف برنامه ۵ ساله را پوشش می‌دهد؛ با کاهش وزن اقتصادی رتبه آن به یک ارتقا می‌یابد."
  },
  {
    id: "P-1068",
    name: "کمربند سبز جنوبی کرمان",
    district: "منطقه ۴",
    category: "فضای سبز",
    status: "در حال اجرا",
    budget: 480,
    score: 84,
    justice: 0.68,
    risk: 26,
    deviation: 18,
    progress: 61,
    aiRecommended: false,
    beneficiaries: 46000,
    lat: 30.2571,
    lng: 57.0692,
    classification: {
      projectClass: "inProgress",
      missionDomain: "environment",
      natureCategory: "development",
      decisionUnit: "phase",
      megaProject: false,
      neighborhoodScale: false,
      lowImpact: false
    },
    mandatory: { M1: true, M2: true, M3: true, M4: true, M5: true },
    scores: {
      social: 79, financial: 70, environmental: 94, technical: 74,
      economic: 72, organizational: 88, risk: 26, competitive: 58
    },
    criterionScores: { E: 94, T5: 88, T6: 61, S2: 82, F6: 46 },
    lifecycle: {
      physicalProgressPercent: 61,
      financialProgressPercent: 57,
      costToComplete: 187,
      monthsToComplete: 14,
      contractualCommitments: 210,
      terminationCost: 55,
      potentialDamages: 30,
      depreciationRisk: 0.4,
      monthsToBenefit: 15,
      realizableBenefits: 620,
      phaseable: true,
      annualOperatingCost: 26
    },
    finance: {
      cashFlow: { 1405: 187, 1406: 90, 1407: 60 },
      futureCommitments: 150,
      internalSharePercent: 85,
      externalSharePercent: 15,
      earmarkedFund: null
    },
    dependencies: { requires: [], conflictsWith: [], group: null },
    readiness: {
      hasExecutivePlan: true,
      landAcquisitionComplete: true,
      permitsReady: true
    },
    explain:
      "امتیاز آن عمدتاً از انطباق استراتژیک (شهر سبز) تامین می‌شود؛ فوریت فنی پایین باعث شده از پروژه‌های ترافیکی عقب بماند."
  },
  {
    id: "P-1073",
    name: "مرکز فرهنگی محله سرآسیاب",
    district: "منطقه ۳",
    category: "فرهنگی",
    status: "مطالعه",
    budget: 220,
    score: 81,
    justice: 0.88,
    risk: 22,
    deviation: 2,
    progress: 8,
    aiRecommended: true,
    beneficiaries: 33800,
    lat: 30.3062,
    lng: 57.0341,
    classification: {
      projectClass: "newDevelopment",
      missionDomain: "social",
      natureCategory: "construction",
      decisionUnit: "project",
      megaProject: false,
      neighborhoodScale: true,
      lowImpact: false
    },
    mandatory: { M1: true, M2: true, M3: true, M4: true, M5: true },
    scores: {
      social: 86, financial: 76, environmental: 58, technical: 78,
      economic: 61, organizational: 78, risk: 22, competitive: 46
    },
    criterionScores: { S2: 90, S4: 84, S5: 88, S6: 92, F1: 24, T7: 86 },
    lifecycle: {
      physicalProgressPercent: 8,
      financialProgressPercent: 6,
      costToComplete: 202,
      monthsToComplete: 18,
      contractualCommitments: 30,
      terminationCost: 8,
      potentialDamages: 4,
      depreciationRisk: 0.1,
      monthsToBenefit: 20,
      realizableBenefits: 505,
      phaseable: false,
      annualOperatingCost: 9
    },
    finance: {
      cashFlow: { 1405: 120, 1406: 100, 1407: 0 },
      futureCommitments: 100,
      internalSharePercent: 55,
      externalSharePercent: 45,
      earmarkedFund: null
    },
    dependencies: { requires: [], conflictsWith: [], group: null },
    readiness: {
      hasExecutivePlan: true,
      landAcquisitionComplete: true,
      permitsReady: false
    },
    explain:
      "با هزینه پایین، بیشترین اثر عدالت‌محور را در محله‌ای با ضریب محرومیت ۰.۸ ایجاد می‌کند؛ بازده هر میلیارد تومان آن ۲.۳ برابر میانگین سبد است."
  },
  {
    id: "P-1080",
    name: "شبکه جمع‌آوری آب‌های سطحی شرق",
    district: "منطقه ۳",
    category: "زیرساخت",
    status: "در حال اجرا",
    budget: 720,
    score: 79,
    justice: 0.72,
    risk: 52,
    deviation: 26,
    progress: 35,
    aiRecommended: false,
    beneficiaries: 58000,
    lat: 30.2989,
    lng: 57.1042,
    classification: {
      projectClass: "statutory",
      missionDomain: "safety",
      natureCategory: "construction",
      decisionUnit: "project",
      megaProject: true,
      neighborhoodScale: false,
      lowImpact: false
    },
    mandatory: {
      M1: true, M2: true, M3: true, M4: true, M5: true,
      "M6-A": true, "M6-B": true, "M6-C": true, "M6-D": true,
      "M6-E": true, "M6-F": true, "M6-G": true
    },
    scores: {
      social: 74, financial: 48, environmental: 66, technical: 68,
      economic: 66, organizational: 70, risk: 52, competitive: 40
    },
    criterionScores: { S3: 95, T10: 12, T12: 58, R1: 56, R2: 48, F1: 76 },
    lifecycle: {
      physicalProgressPercent: 35,
      financialProgressPercent: 30,
      costToComplete: 468,
      monthsToComplete: 24,
      contractualCommitments: 300,
      terminationCost: 110,
      potentialDamages: 140,
      depreciationRisk: 0.5,
      monthsToBenefit: 26,
      realizableBenefits: 1120,
      phaseable: true,
      annualOperatingCost: 21
    },
    finance: {
      cashFlow: { 1405: 260, 1406: 208, 1407: 120 },
      futureCommitments: 328,
      internalSharePercent: 70,
      externalSharePercent: 30,
      earmarkedFund: { key: "resilienceFund", draw: 240 }
    },
    dependencies: { requires: [], conflictsWith: [], group: null },
    readiness: {
      hasExecutivePlan: true,
      landAcquisitionComplete: false,
      permitsReady: true
    },
    explain:
      "فوریت فنی بسیار بالا اما ریسک اجرایی و انحراف بودجه ۲۶٪ رتبه آن را پایین کشیده است؛ نیازمند بازنگری پیمان."
  },
  {
    id: "P-1091",
    name: "پارکینگ طبقاتی میدان مشتاق",
    district: "منطقه ۲",
    category: "حمل‌ونقل",
    status: "مطالعه",
    budget: 350,
    score: 74,
    justice: 0.44,
    risk: 38,
    deviation: 6,
    progress: 12,
    aiRecommended: false,
    beneficiaries: 28100,
    lat: 30.2872,
    lng: 57.0619,
    classification: {
      projectClass: "revenue",
      missionDomain: "revenue",
      natureCategory: "construction",
      decisionUnit: "project",
      megaProject: false,
      neighborhoodScale: false,
      lowImpact: false
    },
    mandatory: { M1: true, M2: true, M3: true, M4: true, M5: true },
    scores: {
      social: 66, financial: 82, environmental: 38, technical: 72,
      economic: 84, organizational: 62, risk: 38, competitive: 66
    },
    criterionScores: { EC: 84, F5: 90, F7: 78, S5: 44, E: 38 },
    lifecycle: {
      physicalProgressPercent: 12,
      financialProgressPercent: 9,
      costToComplete: 318,
      monthsToComplete: 20,
      contractualCommitments: 45,
      terminationCost: 12,
      potentialDamages: 6,
      depreciationRisk: 0.15,
      monthsToBenefit: 22,
      realizableBenefits: 940,
      phaseable: false,
      annualOperatingCost: 14
    },
    finance: {
      cashFlow: { 1405: 180, 1406: 138, 1407: 0 },
      futureCommitments: 138,
      internalSharePercent: 35,
      externalSharePercent: 65,
      earmarkedFund: null
    },
    dependencies: { requires: [], conflictsWith: ["P-1041"], group: null },
    readiness: {
      hasExecutivePlan: false,
      landAcquisitionComplete: true,
      permitsReady: false
    },
    explain:
      "توجیه اقتصادی قوی (درآمد پایدار) اما تمرکز آن بر محله‌ای برخوردار است و ضریب عدالت پایینی دارد."
  },
  {
    id: "P-1096",
    name: "بهسازی معابر محله خواجو",
    district: "منطقه ۳",
    category: "خدمات شهری",
    status: "در حال اجرا",
    budget: 185,
    score: 72,
    justice: 0.83,
    risk: 19,
    deviation: 9,
    progress: 54,
    aiRecommended: true,
    beneficiaries: 14600,
    lat: 30.2708,
    lng: 57.0975,
    classification: {
      projectClass: "maintenance",
      missionDomain: "environment",
      natureCategory: "development",
      decisionUnit: "workPackage",
      megaProject: false,
      neighborhoodScale: true,
      lowImpact: false
    },
    mandatory: { M1: true, M2: true, M3: true, M4: true, M5: true },
    scores: {
      social: 78, financial: 84, environmental: 54, technical: 82,
      economic: 58, organizational: 56, risk: 19, competitive: 32
    },
    criterionScores: { S5: 83, T4: 22, T7: 90, R1: 18, F1: 18 },
    lifecycle: {
      physicalProgressPercent: 54,
      financialProgressPercent: 51,
      costToComplete: 85,
      monthsToComplete: 8,
      contractualCommitments: 70,
      terminationCost: 15,
      potentialDamages: 8,
      depreciationRisk: 0.3,
      monthsToBenefit: 9,
      realizableBenefits: 310,
      phaseable: true,
      annualOperatingCost: 6
    },
    finance: {
      cashFlow: { 1405: 85, 1406: 0, 1407: 0 },
      futureCommitments: 0,
      internalSharePercent: 92,
      externalSharePercent: 8,
      earmarkedFund: null
    },
    dependencies: { requires: [], conflictsWith: [], group: null },
    readiness: {
      hasExecutivePlan: true,
      landAcquisitionComplete: true,
      permitsReady: true
    },
    explain:
      "کم‌ریسک‌ترین پروژه سبد با اثر مستقیم بر ۱۴ هزار ساکن؛ AI اجرای آن را در سناریوی انقباضی توصیه می‌کند."
  },
  {
    id: "P-1104",
    name: "هوشمندسازی روشنایی معابر",
    district: "منطقه ۱",
    category: "خدمات شهری",
    status: "تایید شده",
    budget: 260,
    score: 69,
    justice: 0.57,
    risk: 24,
    deviation: 3,
    progress: 30,
    aiRecommended: false,
    beneficiaries: 30500,
    lat: 30.294,
    lng: 57.0705,
    classification: {
      projectClass: "newDevelopment",
      missionDomain: "smart",
      natureCategory: "equipment",
      decisionUnit: "contract",
      megaProject: false,
      neighborhoodScale: false,
      lowImpact: false
    },
    mandatory: { M1: true, M2: true, M3: true, M4: true, M5: true },
    scores: {
      social: 62, financial: 80, environmental: 76, technical: 84,
      economic: 79, organizational: 81, risk: 24, competitive: 54
    },
    criterionScores: { E: 76, EC: 79, F6: 22, T4: 18, T9: 82, O1: 84 },
    lifecycle: {
      physicalProgressPercent: 30,
      financialProgressPercent: 28,
      costToComplete: 182,
      monthsToComplete: 10,
      contractualCommitments: 120,
      terminationCost: 25,
      potentialDamages: 10,
      depreciationRisk: 0.2,
      monthsToBenefit: 11,
      realizableBenefits: 640,
      phaseable: true,
      annualOperatingCost: 5
    },
    finance: {
      cashFlow: { 1405: 182, 1406: 0, 1407: 0 },
      futureCommitments: 0,
      internalSharePercent: 60,
      externalSharePercent: 40,
      earmarkedFund: null
    },
    dependencies: { requires: [], conflictsWith: [], group: null },
    readiness: {
      hasExecutivePlan: true,
      landAcquisitionComplete: true,
      permitsReady: true
    },
    explain:
      "صرفه‌جویی انرژی ۳۱٪ اما اثر اجتماعی محسوس کمتری دارد؛ در سناریوی توسعه سریع وارد سبد می‌شود."
  },
  {
    id: "P-1112",
    name: "ایستگاه آتش‌نشانی منطقه ۴",
    district: "منطقه ۴",
    category: "ایمنی",
    status: "مطالعه",
    budget: 300,
    score: 66,
    justice: 0.76,
    risk: 29,
    deviation: 0,
    progress: 4,
    aiRecommended: false,
    beneficiaries: 39000,
    lat: 30.2489,
    lng: 57.0421,
    classification: {
      projectClass: "statutory",
      missionDomain: "safety",
      natureCategory: "construction",
      decisionUnit: "project",
      megaProject: false,
      neighborhoodScale: false,
      lowImpact: false
    },
    mandatory: { M1: true, M2: true, M3: true, M4: true, M5: true },
    scores: {
      social: 70, financial: 62, environmental: 46, technical: 74,
      economic: 52, organizational: 68, risk: 29, competitive: 30
    },
    criterionScores: { S3: 96, S5: 76, T10: 20, EC: 52 },
    lifecycle: {
      physicalProgressPercent: 4,
      financialProgressPercent: 3,
      costToComplete: 288,
      monthsToComplete: 22,
      contractualCommitments: 20,
      terminationCost: 6,
      potentialDamages: 3,
      depreciationRisk: 0.08,
      monthsToBenefit: 24,
      realizableBenefits: 720,
      phaseable: false,
      annualOperatingCost: 16
    },
    finance: {
      cashFlow: { 1405: 150, 1406: 138, 1407: 0 },
      futureCommitments: 138,
      internalSharePercent: 88,
      externalSharePercent: 12,
      earmarkedFund: { key: "resilienceFund", draw: 160 }
    },
    dependencies: { requires: [], conflictsWith: [], group: null },
    readiness: {
      hasExecutivePlan: true,
      landAcquisitionComplete: false,
      permitsReady: true
    },
    explain:
      "پوشش پدافند غیرعامل جنوب شهر را کامل می‌کند؛ امتیاز اقتصادی پایین آن مانع ورود به ۵ رتبه اول شده است."
  },
  {
    id: "P-1118",
    name: "پارک محله‌ای شهرک الغدیر",
    district: "منطقه ۴",
    category: "فضای سبز",
    status: "مطالعه",
    budget: 140,
    score: 63,
    justice: 0.79,
    risk: 17,
    deviation: 1,
    progress: 0,
    aiRecommended: false,
    beneficiaries: 12700,
    lat: 30.2645,
    lng: 57.1188,
    classification: {
      projectClass: "newDevelopment",
      missionDomain: "environment",
      natureCategory: "construction",
      decisionUnit: "project",
      megaProject: false,
      neighborhoodScale: true,
      lowImpact: true
    },
    mandatory: { M1: true, M2: true, M3: true, M4: true, M5: true },
    scores: {
      social: 68, financial: 86, environmental: 82, technical: 76,
      economic: 49, organizational: 61, risk: 17, competitive: 24
    },
    criterionScores: { S2: 84, S5: 79, E: 82, F1: 14, EC: 49 },
    lifecycle: {
      physicalProgressPercent: 0,
      financialProgressPercent: 0,
      costToComplete: 140,
      monthsToComplete: 12,
      contractualCommitments: 0,
      terminationCost: 0,
      potentialDamages: 0,
      depreciationRisk: 0,
      monthsToBenefit: 13,
      realizableBenefits: 290,
      phaseable: false,
      annualOperatingCost: 8
    },
    finance: {
      cashFlow: { 1405: 140, 1406: 0, 1407: 0 },
      futureCommitments: 0,
      internalSharePercent: 80,
      externalSharePercent: 20,
      earmarkedFund: null
    },
    dependencies: { requires: [], conflictsWith: [], group: null },
    readiness: {
      hasExecutivePlan: false,
      landAcquisitionComplete: true,
      permitsReady: true
    },
    explain:
      "کم‌هزینه و کم‌ریسک؛ در تحلیل حساسیت با افزایش وزن عدالت فضایی سه رتبه صعود می‌کند."
  },
  {
    id: "P-1125",
    name: "خط دوم اتوبوس تندرو (BRT)",
    district: "منطقه ۲",
    category: "حمل‌ونقل",
    status: "متوقف",
    budget: 1250,
    score: 58,
    justice: 0.61,
    risk: 68,
    deviation: 34,
    progress: 18,
    aiRecommended: false,
    beneficiaries: 95000,
    lat: 30.3005,
    lng: 57.0498,
    classification: {
      projectClass: "inProgress",
      missionDomain: "infrastructure",
      natureCategory: "construction",
      decisionUnit: "phase",
      megaProject: true,
      neighborhoodScale: false,
      lowImpact: false
    },
    mandatory: {
      M1: true, M2: true, M3: true, M4: true, M5: true,
      "M6-A": true, "M6-B": true, "M6-C": true, "M6-D": true,
      "M6-E": false, "M6-F": true, "M6-G": true
    },
    scores: {
      social: 84, financial: 36, environmental: 78, technical: 58,
      economic: 62, organizational: 84, risk: 68, competitive: 86
    },
    criterionScores: {
      T12: 74, T6: 18, R1: 72, R2: 64, R3: 68, F1: 96, F8: 82, C1: 88
    },
    lifecycle: {
      physicalProgressPercent: 18,
      financialProgressPercent: 24,
      costToComplete: 1025,
      monthsToComplete: 40,
      contractualCommitments: 640,
      terminationCost: 290,
      potentialDamages: 210,
      depreciationRisk: 0.62,
      monthsToBenefit: 44,
      realizableBenefits: 2100,
      phaseable: true,
      annualOperatingCost: 48
    },
    finance: {
      cashFlow: { 1405: 380, 1406: 400, 1407: 245 },
      futureCommitments: 1020,
      internalSharePercent: 66,
      externalSharePercent: 34,
      earmarkedFund: { key: "publicTransportFund", draw: 300 }
    },
    dependencies: { requires: ["P-1041"], conflictsWith: [], group: null },
    readiness: {
      hasExecutivePlan: true,
      landAcquisitionComplete: false,
      permitsReady: false
    },
    explain:
      "بالاترین اثر بالقوه سبد اما ریسک تملک و انحراف بودجه ۳۴٪ آن را به وضعیت هشدار برده است."
  },
  {
    id: "P-1131",
    name: "سالن ورزشی محله ابوذر",
    district: "منطقه ۳",
    category: "فرهنگی",
    status: "متوقف",
    budget: 165,
    score: 51,
    justice: 0.7,
    risk: 57,
    deviation: 29,
    progress: 26,
    aiRecommended: false,
    beneficiaries: 18900,
    lat: 30.3128,
    lng: 57.0902,
    classification: {
      projectClass: "inProgress",
      missionDomain: "social",
      natureCategory: "construction",
      decisionUnit: "project",
      megaProject: false,
      neighborhoodScale: true,
      lowImpact: true
    },
    mandatory: { M1: true, M2: true, M3: true, M4: false, M5: true },
    scores: {
      social: 61, financial: 44, environmental: 40, technical: 52,
      economic: 44, organizational: 48, risk: 57, competitive: 20
    },
    criterionScores: { T12: 66, R1: 60, R2: 54, F8: 70, S2: 68 },
    lifecycle: {
      physicalProgressPercent: 26,
      financialProgressPercent: 33,
      costToComplete: 122,
      monthsToComplete: 16,
      contractualCommitments: 95,
      terminationCost: 38,
      potentialDamages: 22,
      depreciationRisk: 0.55,
      monthsToBenefit: 18,
      realizableBenefits: 210,
      phaseable: true,
      annualOperatingCost: 7
    },
    finance: {
      cashFlow: { 1405: 70, 1406: 52, 1407: 0 },
      futureCommitments: 52,
      internalSharePercent: 90,
      externalSharePercent: 10,
      earmarkedFund: null
    },
    dependencies: { requires: [], conflictsWith: [], group: null },
    readiness: {
      hasExecutivePlan: false,
      landAcquisitionComplete: true,
      permitsReady: false
    },
    explain:
      "توقف پیمان و انحراف بودجه ۲۹٪ امتیاز آن را کاهش داده؛ پیشنهاد AI بازتعریف دامنه پروژه است."
  }
];

/**
 * "At least one of" dependency groups: at least one member of the group must
 * appear in the portfolio. Referenced from each project's `dependencies.group`.
 */
export const dependencyGroups = [
  {
    key: "historicCore",
    label: "احیای هسته تاریخی",
    rule: "atLeastOne",
    members: ["P-1052"]
  }
];

export const categoryColors = {
  "حمل‌ونقل": "#2979FF",
  "فضای سبز": "#00A86B",
  "خدمات شهری": "#8E24AA",
  "فرهنگی": "#FF8F00",
  "زیرساخت": "#00838F",
  "ایمنی": "#C62828"
};

export default projects;
