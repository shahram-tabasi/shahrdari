/**
 * PDF Theme
 *
 * This module contains every visual configuration
 * used by the PDF rendering engine.
 * Nothing inside this file should contain business logic.
 */

export const PAGE = Object.freeze({

    format: "A4",

    orientation: "portrait",

    marginTop: "18mm",

    marginBottom: "18mm",

    marginLeft: "16mm",

    marginRight: "16mm"

});

export const FONT = Object.freeze({

    family: "'Vazirmatn','Segoe UI','Tahoma',sans-serif",

    mono: "'Consolas',monospace",

    baseSize: "13px",

    small: "11px",

    large: "18px",

    title: "34px",

    subtitle: "18px",

    h1: "28px",

    h2: "22px",

    h3: "18px"

});

export const COLOR = Object.freeze({

    primary: "#0B3A53",

    secondary: "#2563EB",

    accent: "#0EA5E9",

    success: "#16A34A",

    warning: "#F59E0B",

    danger: "#DC2626",

    purple: "#7C3AED",

    text: "#1E293B",

    muted: "#64748B",

    border: "#CBD5E1",

    background: "#F8FAFC",

    white: "#FFFFFF"

});

export const CARD = Object.freeze({

    radius: "16px",

    padding: "20px",

    shadow: "0 8px 20px rgba(15,23,42,.08)",

    border: `1px solid ${COLOR.border}`

});

export const TABLE = Object.freeze({

    headerBackground: COLOR.primary,

    headerColor: COLOR.white,

    borderColor: COLOR.border,

    stripeColor: "#F8FAFC",

    rowHeight: "42px"

});

export const CHART = Object.freeze({

    width: 760,

    height: 380

});

export function buildThemeCSS() {

    return `

@page{

    size:${PAGE.format} ${PAGE.orientation};

    margin:${PAGE.marginTop}
           ${PAGE.marginRight}
           ${PAGE.marginBottom}
           ${PAGE.marginLeft};

}

*{

    box-sizing:border-box;

}

body{

    margin:0;

    padding:0;

    direction:rtl;

    background:${COLOR.background};

    color:${COLOR.text};

    font-family:${FONT.family};

    font-size:${FONT.baseSize};

}

.page{

    width:100%;

}

.cover{

    min-height:100vh;

    display:flex;

    flex-direction:column;

    justify-content:center;

    align-items:center;

    text-align:center;

}

.cover h1{

    font-size:${FONT.title};

    color:${COLOR.primary};

    margin-bottom:20px;

}

.cover h2{

    font-size:${FONT.subtitle};

    color:${COLOR.muted};

    font-weight:500;

}

.section{

    margin-top:28px;

}

.section-title{

    font-size:${FONT.h2};

    color:${COLOR.primary};

    font-weight:700;

    border-bottom:3px solid ${COLOR.secondary};

    padding-bottom:8px;

    margin-bottom:18px;

}

.card-grid{

    display:grid;

    grid-template-columns:repeat(4,1fr);

    gap:18px;

    margin-top:18px;

}

.card{

    background:${COLOR.white};

    border:${CARD.border};

    border-radius:${CARD.radius};

    padding:${CARD.padding};

    box-shadow:${CARD.shadow};

}

.card-title{

    font-size:13px;

    color:${COLOR.muted};

    margin-bottom:8px;

}

.card-value{

    font-size:28px;

    font-weight:700;

    color:${COLOR.primary};

}

table{

    width:100%;

    border-collapse:collapse;

    margin-top:16px;

}

thead{

    background:${TABLE.headerBackground};

    color:${TABLE.headerColor};

}

th{

    padding:12px;

    border:1px solid ${TABLE.borderColor};

    font-size:13px;

}

td{

    padding:10px;

    border:1px solid ${TABLE.borderColor};

    text-align:center;

    font-size:12px;

}

tbody tr:nth-child(even){

    background:${TABLE.stripeColor};

}

.badge{

    display:inline-block;

    padding:6px 12px;

    border-radius:20px;

    color:#fff;

    font-size:11px;

    font-weight:700;

}

.success{

    background:${COLOR.success};

}

.warning{

    background:${COLOR.warning};

}

.danger{

    background:${COLOR.danger};

}

.info{

    background:${COLOR.secondary};

}

.footer{

    margin-top:40px;

    padding-top:14px;

    border-top:1px solid ${COLOR.border};

    display:flex;

    justify-content:space-between;

    font-size:11px;

    color:${COLOR.muted};

}

.chart{

    width:100%;

    text-align:center;

    margin-top:20px;

}

svg{

    max-width:100%;

}

.page-break{

    page-break-after:always;

}

`;

}