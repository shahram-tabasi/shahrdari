/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * Decision Audit worksheet.
 *
 * This worksheet stores every important action
 * performed during the decision process.
 * The goal is to provide transparency,
 * traceability and governance.
 */

import {
    styleHeader,
    titleStyle,
    subtitleStyle,
    centerAlignment,
    zebraRow,
    applyScoreColor
} from "../shared/style.js";

import {
    safeNumber,
    formatDateTime
} from "../shared/formatter.js";

export function createAuditSheet(workbook, auditTrail = []) {

    const sheet = workbook.addWorksheet("Decision Audit");

    sheet.views = [
        {
            state: "frozen",
            ySplit: 4
        }
    ];

    sheet.properties.defaultRowHeight = 24;

    sheet.columns = [

        { width: 8 },

        { width: 26 },

        { width: 24 },

        { width: 34 },

        { width: 20 },

        { width: 18 },

        { width: 18 },

        { width: 60 }

    ];

    sheet.mergeCells("A1:H1");

    const title = sheet.getCell("A1");

    title.value = "Decision Audit Trail";

    titleStyle(title);

    sheet.mergeCells("A2:H2");

    const subtitle = sheet.getCell("A2");

    subtitle.value =
        "Complete history of decisions generated during the evaluation process.";

    subtitleStyle(subtitle);

    const header = sheet.addRow([

        "No",

        "Date",

        "User",

        "Action",

        "Module",

        "Score",

        "Status",

        "Details"

    ]);

    styleHeader(header);

    auditTrail.forEach((item, index) => {

        const row = sheet.addRow([

            index + 1,

            formatDateTime(item.date),

            item.user ?? "System",

            item.action ?? "",

            item.module ?? "",

            safeNumber(item.score),

            item.status ?? "",

            item.details ?? ""

        ]);

        zebraRow(row, index + 1);

        row.height = 24;

        row.eachCell(cell => {

            cell.alignment = centerAlignment();

            cell.border = {

                top: {
                    style: "thin"
                },

                left: {
                    style: "thin"
                },

                right: {
                    style: "thin"
                },

                bottom: {
                    style: "thin"
                }

            };

        });

        applyScoreColor(

            row.getCell(6),

            safeNumber(item.score)

        );

    });

    sheet.autoFilter = {

        from: {

            row: 3,

            column: 1

        },

        to: {

            row: 3,

            column: 8

        }

    };

    sheet.eachRow((row, index) => {

        if (index <= 3) {

            return;

        }

        row.getCell(8).alignment = {

            horizontal: "left",

            vertical: "top",

            wrapText: true

        };

    });

}