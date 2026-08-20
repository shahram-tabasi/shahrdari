/**
 * Global constants shared across
 * Excel, PDF and PowerPoint builders.
 */

export const APP_INFO = Object.freeze({

    name: "Municipality AI Decision Support System",

    shortName: "MAIDS",

    company: "Municipality",

    version: "1.0.0"

});

export const EXPORT = Object.freeze({

    author: "Municipality AI",

    subject: "Decision Support Report",

    creator: "Municipality AI Platform",

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

export const PPT = Object.freeze({

    layout: "LAYOUT_WIDE",

    author: "Municipality AI",

    company: "Municipality",

    subject: "Executive Report",

    title: "Municipality Report"

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