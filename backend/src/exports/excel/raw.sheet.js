/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * Raw Data worksheet.
 *
 * This worksheet exports the complete dataset exactly
 * as received from the backend.
 *
 * Features
 * --------
 * - Dynamic columns
 * - Auto filter
 * - Freeze header
 * - Zebra rows
 * - Auto column width
 * - Number formatting
 * - Date formatting
 * - Ready for Pivot Tables
 * - Ready for Power BI
 */

import {
    styleHeader,
    styleCell,
    zebraRow
} from "../shared/style.js";

import {
    autoColumnWidth,
    ensureArray
} from "../shared/helper.js";

export function createRawSheet(workbook, rows = []) {

    rows = ensureArray(rows);

    const sheet = workbook.addWorksheet("Raw Data");

    sheet.views = [
        {
            state: "frozen",
            ySplit: 1
        }
    ];

    if (!rows.length) {

        sheet.addRow([

            "No data available"

        ]);

        return;

    }

    /**
     * Collect every property that exists
     * inside the dataset.
     */

    const columns = [

        ...new Set(

            rows.flatMap(

                Object.keys

            )

        )

    ];

    sheet.columns = columns.map(column => ({

        header: prettify(column),

        key: column,

        width: 20

    }));

    styleHeader(

        sheet.getRow(1)

    );

    rows.forEach((item, index) => {

        const row = sheet.addRow(item);

        zebraRow(

            row,

            index + 1

        );

        row.eachCell(cell => {

            styleCell(cell);

            applyCellFormat(cell);

        });

    });

    sheet.autoFilter = {

        from: {

            row: 1,

            column: 1

        },

        to: {

            row: 1,

            column: columns.length

        }

    };

    autoColumnWidth(sheet);

}

/**
 * Convert property names into
 * user friendly titles.
 */

function prettify(text) {

    return String(text)

        .replace(/_/g, " ")

        .replace(/([a-z])([A-Z])/g, "$1 $2")

        .replace(/\b\w/g,

            letter =>

                letter.toUpperCase()

        );

}

/**
 * Apply formatting according
 * to detected value type.
 */

function applyCellFormat(cell) {

    if (

        typeof cell.value === "number"

    ) {

        cell.numFmt = "#,##0.00";

        return;

    }

    if (

        cell.value instanceof Date

    ) {

        cell.numFmt =

            "yyyy-mm-dd hh:mm";

        return;

    }

    if (

        typeof cell.value === "boolean"

    ) {

        cell.value =

            cell.value

                ? "Yes"

                : "No";

    }

}