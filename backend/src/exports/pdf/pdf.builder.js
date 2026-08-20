/**
 * PDF Builder
 *
 * This is the main entry point of the PDF export engine.
 * It assembles every report section,
 * renders the HTML,
 * generates the PDF using Puppeteer,
 * and returns the final Buffer.
 */

import puppeteer from "puppeteer";

import { buildThemeCSS } from "./theme.js";

import { renderCoverSection } from "./cover.section.js";
import { renderSummarySection } from "./summary.section.js";
import { renderRankingSection } from "./ranking.section.js";
import { renderChartSection } from "./chart.section.js";
import { renderAuditSection } from "./audit.section.js";
import {
    renderFooterSection,
    renderPageFooter
} from "./footer.section.js";

import {
    APP_INFO,
    EXPORT
} from "../shared/constants.js";

import {
    createFileName
} from "../shared/helper.js";


export async function buildPdf(report = {}) {

    const html = buildHtml(report);

    const browser = await puppeteer.launch({

    headless: true,

    executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

    args: [

        "--no-sandbox",

        "--disable-setuid-sandbox",

        "--disable-dev-shm-usage"

    ]

});

    try {

        const page = await browser.newPage();

        await page.setViewport({

            width: 1400,

            height: 1800,

            deviceScaleFactor: 2

        });

        await page.setContent(

            html,

            {

                waitUntil: "networkidle0"

            }

        );

        const pdf = await page.pdf({

            format: "A4",

            printBackground: true,

            displayHeaderFooter: true,

            headerTemplate: "<div></div>",

            footerTemplate: renderPageFooter(),

            margin: {

                top: "18mm",

                right: "15mm",

                bottom: "20mm",

                left: "15mm"

            }

        });

        return pdf;

    }

    finally {

        await browser.close();

    }

}


export async function exportPdf(report, res) {

    const pdf = await buildPdf(report);

    res.setHeader(

        "Content-Type",

        "application/pdf"

    );

    res.setHeader(

        "Content-Disposition",

        `attachment; filename=${createFileName("pdf")}`

    );

    res.send(pdf);

}


function buildHtml(report) {

    return `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1">

<title>

${APP_INFO.name}

</title>

<style>

${buildThemeCSS()}

</style>

</head>

<body>

<div class="page">

${renderCoverSection(report)}

${renderSummarySection(report)}
${renderRankingSection(report)}
${renderChartSection(report)}
${renderAuditSection(report)}

${renderFooterSection(report)}

</div>

</body>

</html>

`;

}