/**
 * Workbook Builder
 *
 * This is the entry point of the Excel export engine.
 * It creates the workbook, applies metadata,
 * configures global settings and builds every worksheet.
 */

import ExcelJS from "exceljs";

import { APP_INFO, EXPORT } from "../shared/constants.js";

import { createFileName } from "../shared/helper.js";

import { createDashboardSheet } from "./dashboard.sheet.js";
import { createSummarySheet } from "./summary.sheet.js";
import { createRankingSheet } from "./ranking.sheet.js";
import { createAuditSheet } from "./audit.sheet.js";
import { createRawSheet } from "./raw.sheet.js";

export async function buildWorkbook(report = {}) {

    const workbook = new ExcelJS.Workbook();

    initializeWorkbook(workbook);

    createDashboardSheet(
        workbook,
        report.dashboard ?? []
    );

    createSummarySheet(
        workbook,
        report.summary ?? []
    );

    createRankingSheet(
        workbook,
        report.ranking ?? []
    );

    createAuditSheet(
        workbook,
        report.audit ?? []
    );

    createRawSheet(
        workbook,
        report.raw ?? []
    );

    finalizeWorkbook(workbook);

    return workbook;

}

export async function exportWorkbook(report, res) {

    const workbook = await buildWorkbook(report);

    const buffer =
        await workbook.xlsx.writeBuffer();

    res.setHeader(

        "Content-Type",

        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    );

    res.setHeader(

        "Content-Disposition",

        `attachment; filename=${createFileName("xlsx")}`

    );

    res.send(

        Buffer.from(buffer)

    );

}

function initializeWorkbook(workbook) {

    workbook.creator =
        EXPORT.creator;

    workbook.lastModifiedBy =
        EXPORT.creator;

    workbook.created =
        new Date();

    workbook.modified =
        new Date();

    workbook.company =
        APP_INFO.company;

    workbook.subject =
        EXPORT.subject;

    workbook.title =
        APP_INFO.name;

    workbook.description =
        "Executive Municipality Report";

    workbook.category =
        "Reporting";

    workbook.keywords =
        "Municipality,AI,Decision Support,Excel";

    workbook.calcProperties.fullCalcOnLoad = true;

    workbook.views = [

        {

            activeTab: 0,

            visibility: "visible"

        }

    ];

}

function finalizeWorkbook(workbook) {

    workbook.eachSheet(sheet => {

        sheet.properties.defaultRowHeight = 24;

        sheet.pageSetup = {

            paperSize: 9,

            orientation: "landscape",

            fitToPage: true,

            fitToWidth: 1,

            fitToHeight: 0,

            horizontalCentered: true,

            verticalCentered: false,

            margins: {

                left: 0.3,

                right: 0.3,

                top: 0.5,

                bottom: 0.5,

                header: 0.2,

                footer: 0.2

            }

        };

        sheet.headerFooter = {

            oddHeader:

                "&LMunicipality AI Platform" +

                "&CExecutive Report" +

                "&RGenerated",

            oddFooter:

                "&LConfidential" +

                "&CPage &P of &N" +

                "&R&A"

        };

    });

}