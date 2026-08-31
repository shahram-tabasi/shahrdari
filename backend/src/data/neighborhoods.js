/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * NEIGHBOURHOOD DATASET — inputs for the spatial-equity analysis.
 *
 * `deprivation` is kept as a stored value for backward compatibility with the
 * existing dashboard, but it is no longer the authority: the equity engine
 * recomputes the deprivation index from `indicators` using the ten indicators
 * the directive proposes, so the number is reproducible and auditable rather
 * than a magic constant.
 *
 * Every indicator is recorded on a 0..100 raw scale. The engine — not the data
 * — applies the direction (`provision` values are inverted, `deprivation`
 * values are not), so a data-entry clerk never has to pre-invert anything.
 */

const neighborhoods = [
  {
    id: "N1",
    name: "محله شهر (بافت تاریخی)",
    district: "منطقه ۱",
    deprivation: 0.86,
    projects: 2,
    population: 21400,
    lat: 30.2851,
    lng: 57.0788,
    indicators: {
      householdIncome: 24, publicTransportAccess: 38, greenSpacePerCapita: 12,
      urbanServiceAccess: 30, roadQuality: 22, wornOutFabric: 94,
      populationDensity: 88, safetyRisk: 82, socialVulnerability: 79,
      distanceToCoreServices: 46
    }
  },
  {
    id: "N2",
    name: "سرآسیاب فرسنگی",
    district: "منطقه ۳",
    deprivation: 0.81,
    projects: 1,
    population: 33800,
    lat: 30.3068,
    lng: 57.0335,
    indicators: {
      householdIncome: 28, publicTransportAccess: 32, greenSpacePerCapita: 18,
      urbanServiceAccess: 34, roadQuality: 30, wornOutFabric: 76,
      populationDensity: 81, safetyRisk: 74, socialVulnerability: 84,
      distanceToCoreServices: 72
    }
  },
  {
    id: "N3",
    name: "خواجو",
    district: "منطقه ۳",
    deprivation: 0.74,
    projects: 1,
    population: 14600,
    lat: 30.2712,
    lng: 57.0968,
    indicators: {
      householdIncome: 35, publicTransportAccess: 41, greenSpacePerCapita: 24,
      urbanServiceAccess: 40, roadQuality: 33, wornOutFabric: 68,
      populationDensity: 62, safetyRisk: 66, socialVulnerability: 70,
      distanceToCoreServices: 64
    }
  },
  {
    id: "N4",
    name: "ابوذر",
    district: "منطقه ۳",
    deprivation: 0.69,
    projects: 1,
    population: 18900,
    lat: 30.3132,
    lng: 57.0898,
    indicators: {
      householdIncome: 40, publicTransportAccess: 46, greenSpacePerCapita: 28,
      urbanServiceAccess: 45, roadQuality: 38, wornOutFabric: 58,
      populationDensity: 66, safetyRisk: 60, socialVulnerability: 64,
      distanceToCoreServices: 58
    }
  },
  {
    id: "N5",
    name: "شهرک الغدیر",
    district: "منطقه ۴",
    deprivation: 0.62,
    projects: 0,
    population: 12700,
    lat: 30.2649,
    lng: 57.1181,
    indicators: {
      householdIncome: 46, publicTransportAccess: 30, greenSpacePerCapita: 20,
      urbanServiceAccess: 38, roadQuality: 44, wornOutFabric: 32,
      populationDensity: 48, safetyRisk: 52, socialVulnerability: 55,
      distanceToCoreServices: 81
    }
  },
  {
    id: "N6",
    name: "ارتش جنوبی",
    district: "منطقه ۴",
    deprivation: 0.48,
    projects: 2,
    population: 26300,
    lat: 30.2519,
    lng: 57.0455,
    indicators: {
      householdIncome: 55, publicTransportAccess: 58, greenSpacePerCapita: 41,
      urbanServiceAccess: 56, roadQuality: 54, wornOutFabric: 34,
      populationDensity: 52, safetyRisk: 46, socialVulnerability: 44,
      distanceToCoreServices: 48
    }
  },
  {
    id: "N7",
    name: "جمهوری",
    district: "منطقه ۲",
    deprivation: 0.34,
    projects: 3,
    population: 41200,
    lat: 30.2931,
    lng: 57.0559,
    indicators: {
      householdIncome: 68, publicTransportAccess: 78, greenSpacePerCapita: 56,
      urbanServiceAccess: 74, roadQuality: 71, wornOutFabric: 22,
      populationDensity: 64, safetyRisk: 38, socialVulnerability: 30,
      distanceToCoreServices: 22
    }
  },
  {
    id: "N8",
    name: "هفت‌باغ (شمال)",
    district: "منطقه ۱",
    deprivation: 0.22,
    projects: 4,
    population: 30500,
    lat: 30.3175,
    lng: 57.0621,
    indicators: {
      householdIncome: 82, publicTransportAccess: 70, greenSpacePerCapita: 84,
      urbanServiceAccess: 80, roadQuality: 84, wornOutFabric: 8,
      populationDensity: 38, safetyRisk: 24, socialVulnerability: 18,
      distanceToCoreServices: 26
    }
  },
  {
    id: "N9",
    name: "مشتاق",
    district: "منطقه ۲",
    deprivation: 0.17,
    projects: 4,
    population: 28100,
    lat: 30.2869,
    lng: 57.0625,
    indicators: {
      householdIncome: 86, publicTransportAccess: 84, greenSpacePerCapita: 74,
      urbanServiceAccess: 88, roadQuality: 86, wornOutFabric: 6,
      populationDensity: 46, safetyRisk: 20, socialVulnerability: 14,
      distanceToCoreServices: 14
    }
  },
  {
    id: "N10",
    name: "بلوار جهاد",
    district: "منطقه ۲",
    deprivation: 0.28,
    projects: 3,
    population: 35400,
    lat: 30.2978,
    lng: 57.0721,
    indicators: {
      householdIncome: 74, publicTransportAccess: 76, greenSpacePerCapita: 62,
      urbanServiceAccess: 78, roadQuality: 76, wornOutFabric: 14,
      populationDensity: 58, safetyRisk: 30, socialVulnerability: 24,
      distanceToCoreServices: 20
    }
  }
];

export default neighborhoods;
