/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * Global constants shared across the Excel, PDF and PowerPoint builders.
 *
 * TO RE-BRAND: do not edit the strings here. `APP_INFO` and `EXPORT` are
 * derived from `config/branding.js`, which is the single place the company
 * and product names are defined. Everything below follows automatically.
 */

import branding, { company, product } from "../../config/branding.js";

/**
 * Identity shown on report covers and in document metadata.
 *
 * `company` is the vendor (us), `client` is the municipality the report is
 * produced for. Both appear on formal output, because a report has to say who
 * produced it as well as who it is for.
 */
export const APP_INFO = Object.freeze({

    name: product.fullFa,

    nameEn: product.fullEn,

    shortName: product.fa,

    company: company.fa,

    companyEn: company.en,

    client: branding.client.fa,

    clientEn: branding.client.en,

    version: product.version

});

/**
 * Document metadata embedded in the generated files (PDF properties, Excel
 * workbook properties, PowerPoint core properties). Some of these fields are
 * visible in a file's "Properties" dialog, so they carry the company name
 * rather than a generic platform label.
 */
export const EXPORT = Object.freeze({

    author: company.en,

    subject: "Project Portfolio Decision Support Report",

    creator: `${product.fullEn} — ${company.en}`,

    language: "fa",

    paper: "A4",

    orientation: "portrait"

});

export const PAGE = Object.freeze({

    width: 794,

    height: 1123,

    margin: 40,

    header: 80,

    footer: 45

});

export const EXCEL = Object.freeze({

    defaultFont: "Calibri",

    defaultFontSize: 11,

    rowHeight: 24,

    headerHeight: 30,

    titleHeight: 42,

    maxColumnWidth: 60,

    minColumnWidth: 10

});

export const PDF = Object.freeze({

    dpi: 300,

    scale: 1,

    format: "A4",

    printBackground: true,

    landscape: false

});

/**
 * PowerPoint deck metadata. Shown in the file's Properties dialog, so it
 * names the vendor and the client rather than a generic platform label.
 */
export const PPT = Object.freeze({

    layout: "LAYOUT_WIDE",

    author: company.en,

    company: company.en,

    subject: "Project Portfolio Executive Report",

    title: product.fullEn

});

export const CARD = Object.freeze({

    width: 180,

    height: 95,

    radius: 12

});

export const TABLE = Object.freeze({

    headerHeight: 34,

    rowHeight: 28,

    borderWidth: 1

});

export const CHART = Object.freeze({

    width: 700,

    height: 340,

    animation: false

});

export const KPI = Object.freeze({

    excellent: 90,

    good: 75,

    warning: 60,

    critical: 40

});

export const FILE = Object.freeze({

    pdf: "pdf",

    excel: "xlsx",

    ppt: "pptx"

});

export const ALIGN = Object.freeze({

    left: "left",

    center: "center",

    right: "right"

});