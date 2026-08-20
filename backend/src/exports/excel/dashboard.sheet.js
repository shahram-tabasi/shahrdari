/**
 * Dashboard worksheet builder.
 *
 * This worksheet is the executive overview of the report.
 * It contains report title, generation date,
 * KPI cards and high-level statistics.
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
    formatInteger,
    average,
    max,
    min
} from "../shared/formatter.js";

export function createDashboardSheet(workbook, data = []) {

    const sheet = workbook.addWorksheet("Dashboard");

    sheet.views = [
        {
            state: "frozen",
            ySplit: 5
        }
    ];

    sheet.properties.defaultRowHeight = 24;

    sheet.columns = [

        { width: 8 },

        { width: 24 },

        { width: 24 },

        { width: 24 },

        { width: 24 },

        { width: 24 },

        { width: 24 }

    ];

    sheet.mergeCells("A1:G1");

    const title = sheet.getCell("A1");

    title.value = "Municipality Executive Dashboard";

    titleStyle(title);

    sheet.mergeCells("A2:G2");

    const subtitle = sheet.getCell("A2");

    subtitle.value =
        `Generated : ${new Date().toLocaleString("en-US")}`;

    subtitleStyle(subtitle);

    const numericValues = data

        .map(item => Number(item.value))

        .filter(value => Number.isFinite(value));

    const totalProjects = data.length;

    const averageScore = average(numericValues);

    const highestScore = max(numericValues);

    const lowestScore = min(numericValues);

    createCard(

        sheet,

        "A4:B7",

        "Projects",

        formatInteger(totalProjects),

        COLORS.blue

    );

    createCard(

        sheet,

        "C4:D7",

        "Average",

        averageScore.toFixed(2),

        COLORS.green

    );

    createCard(

        sheet,

        "E4:F7",

        "Highest",

        highestScore.toFixed(2),

        COLORS.orange

    );

    createCard(

        sheet,

        "G4:G7",

        "Lowest",

        lowestScore.toFixed(2),

        COLORS.red

    );

    sheet.addRow([]);

    sheet.addRow([]);

    const headerRow = sheet.addRow([

        "No",

        "Title",

        "Value",

        "Status",

        "Description"

    ]);

    styleHeader(headerRow);

    data.forEach((item, index) => {

        const value = Number(item.value);

        sheet.addRow([

            index + 1,

            item.title ?? "",

            Number.isFinite(value)
                ? value
                : item.value,

            getStatus(value),

            item.description ?? ""

        ]);

    });

    sheet.eachRow((row, index) => {

        if (index <= 8) {

            return;

        }

        row.eachCell(cell => {

            cell.alignment = centerAlignment();

            cell.border = {

                top: { style: "thin" },

                left: { style: "thin" },

                bottom: { style: "thin" },

                right: { style: "thin" }

            };

        });

    });

}

function createCard(

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
        `${title}\n\n${value}`;

    cell.fill =
        createCardFill(color);

    cell.font =
        createWhiteFont(18);

    cell.alignment = {

        horizontal: "center",

        vertical: "middle",

        wrapText: true

    };

}

function getStatus(value) {

    if (!Number.isFinite(value)) {

        return "N/A";

    }

    if (value >= 90) {

        return "Excellent";

    }

    if (value >= 75) {

        return "Very Good";

    }

    if (value >= 60) {

        return "Good";

    }

    if (value >= 40) {

        return "Average";

    }

    return "Critical";

}