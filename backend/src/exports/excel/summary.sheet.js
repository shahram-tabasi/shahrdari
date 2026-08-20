/**
 * Executive Summary worksheet.
 *
 * This worksheet provides a clean management
 * overview with report statistics, top records,
 * KPI indicators and quick insights.
 */

import { COLORS } from "../shared/style.js";
import {
    styleHeader,
    titleStyle,
    subtitleStyle,
    centerAlignment,
    createCardFill,
    createWhiteFont
} from "../shared/style.js";

import {
    average,
    max,
    min,
    sum,
    formatInteger,
    formatDecimal,
    safeNumber
} from "../shared/formatter.js";

export function createSummarySheet(workbook, data = []) {

    const sheet = workbook.addWorksheet("Summary");

    sheet.views = [
        {
            state: "frozen",
            ySplit: 10
        }
    ];

    sheet.properties.defaultRowHeight = 24;

    sheet.columns = [

        { width: 18 },
        { width: 26 },
        { width: 26 },
        { width: 26 },
        { width: 26 },
        { width: 26 }

    ];

    sheet.mergeCells("A1:F1");

    const title = sheet.getCell("A1");

    title.value = "Executive Summary";

    titleStyle(title);

    sheet.mergeCells("A2:F2");

    const subtitle = sheet.getCell("A2");

    subtitle.value =
        "High level statistics generated from report data.";

    subtitleStyle(subtitle);

    const numericValues = data

        .map(item => safeNumber(item.value))

        .filter(value => Number.isFinite(value));

    const total = data.length;

    const totalValue = sum(numericValues);

    const avgValue = average(numericValues);

    const maxValue = max(numericValues);

    const minValue = min(numericValues);

    createSummaryCard(
        sheet,
        "A4:B6",
        "Total Records",
        formatInteger(total),
        COLORS.blue
    );

    createSummaryCard(
        sheet,
        "C4:D6",
        "Average",
        formatDecimal(avgValue),
        COLORS.green
    );

    createSummaryCard(
        sheet,
        "E4:F6",
        "Total",
        formatDecimal(totalValue),
        COLORS.orange
    );

    createSummaryCard(
        sheet,
        "A7:B9",
        "Maximum",
        formatDecimal(maxValue),
        COLORS.purple
    );

    createSummaryCard(
        sheet,
        "C7:D9",
        "Minimum",
        formatDecimal(minValue),
        COLORS.red
    );

    createSummaryCard(
        sheet,
        "E7:F9",
        "Generated",
        new Date().toLocaleDateString("en-US"),
        COLORS.cyan
    );

    sheet.addRow([]);

    const header = sheet.addRow([

        "Rank",

        "Title",

        "Value",

        "Performance",

        "Category",

        "Comment"

    ]);

    styleHeader(header);

    const sorted = [...data]

        .sort((a, b) =>

            safeNumber(b.value) -

            safeNumber(a.value)

        );

    sorted.forEach((item, index) => {

        sheet.addRow([

            index + 1,

            item.title ?? "",

            safeNumber(item.value),

            performanceText(
                safeNumber(item.value)
            ),

            item.category ?? "-",

            item.description ?? ""

        ]);

    });

    sheet.eachRow((row, index) => {

        if (index <= 10) {

            return;

        }

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

    });

}

function createSummaryCard(

    sheet,

    range,

    title,

    value,

    color

) {

    sheet.mergeCells(range);

    const cell =
        sheet.getCell(range.split(":")[0]);

    cell.value =
`${title}

${value}`;

    cell.fill =
        createCardFill(color);

    cell.font =
        createWhiteFont(17);

    cell.alignment = {

        horizontal: "center",

        vertical: "middle",

        wrapText: true

    };

}

function performanceText(score) {

    if (score >= 90) {

        return "Excellent";

    }

    if (score >= 75) {

        return "Very Good";

    }

    if (score >= 60) {

        return "Good";

    }

    if (score >= 40) {

        return "Average";

    }

    return "Critical";

}