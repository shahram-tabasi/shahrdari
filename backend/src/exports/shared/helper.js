/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * Shared helper functions for all export engines.
 */

import fs from "fs";
import path from "path";

export function ensureArray(value) {

    return Array.isArray(value)
        ? value
        : [];

}

export function valueOf(value) {

    if (value === undefined) return "";

    if (value === null) return "";

    return value;

}

export function createFileName(extension) {

    const now = new Date();

    const yyyy = now.getFullYear();

    const mm = String(now.getMonth() + 1).padStart(2, "0");

    const dd = String(now.getDate()).padStart(2, "0");

    const hh = String(now.getHours()).padStart(2, "0");

    const mi = String(now.getMinutes()).padStart(2, "0");

    const ss = String(now.getSeconds()).padStart(2, "0");

    return `Municipality_Report_${yyyy}${mm}${dd}_${hh}${mi}${ss}.${extension}`;

}

export function buildTimestamp() {

    return new Date().toLocaleString("fa-IR", {

        dateStyle: "full",

        timeStyle: "medium"

    });

}

export function isNumber(value) {

    return typeof value === "number" &&
        Number.isFinite(value);

}

export function toNumber(value) {

    const number = Number(value);

    return Number.isNaN(number)
        ? 0
        : number;

}

export function formatNumber(value) {

    return toNumber(value)
        .toLocaleString("en-US");

}

export function formatPercent(value) {

    return `${toNumber(value).toFixed(2)} %`;

}

export function formatCurrency(value) {

    return toNumber(value)
        .toLocaleString("en-US", {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        });

}

export function autoColumnWidth(sheet) {

    sheet.columns.forEach(column => {

        let max = 10;

        column.eachCell?.({

            includeEmpty: true

        }, cell => {

            const len =
                String(cell.value ?? "").length;

            if (len > max) {

                max = len;

            }

        });

        column.width = Math.min(max + 4, 60);

    });

}

export function summarizeData(data) {

    const items = ensureArray(data);

    return {

        totalItems: items.length,

        numericItems: items.filter(item =>
            isNumber(item.value)
        ).length,

        textItems: items.filter(item =>
            !isNumber(item.value)
        ).length,

        highestValue: Math.max(
            ...items.map(item =>
                toNumber(item.value)
            ),
            0
        ),

        lowestValue: Math.min(
            ...items.map(item =>
                toNumber(item.value)
            ),
            0
        ),

        averageValue:
            items.length === 0
                ? 0
                : items
                    .map(item => toNumber(item.value))
                    .reduce((a, b) => a + b, 0)
                    / items.length

    };

}

export function readImageAsBase64(imagePath) {

    try {

        const file = fs.readFileSync(imagePath);

        const extension =
            path.extname(imagePath)
                .replace(".", "");

        return `data:image/${extension};base64,${file.toString("base64")}`;

    }

    catch {

        return "";

    }

}

export function escapeHtml(text) {

    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}

export function splitIntoChunks(array, size) {

    const chunks = [];

    for (let i = 0; i < array.length; i += size) {

        chunks.push(

            array.slice(i, i + size)

        );

    }

    return chunks;

}

export function groupBy(array, key) {

    return array.reduce((result, current) => {

        const value = current[key] ?? "Unknown";

        if (!result[value]) {

            result[value] = [];

        }

        result[value].push(current);

        return result;

    }, {});

}

export function sortDescending(array, field) {

    return [...array].sort((a, b) =>

        toNumber(b[field]) -
        toNumber(a[field])

    );

}

export function sortAscending(array, field) {

    return [...array].sort((a, b) =>

        toNumber(a[field]) -
        toNumber(b[field])

    );

}

export function generateProgressColor(score) {

    if (score >= 80) {

        return "#16A34A";

    }

    if (score >= 60) {

        return "#F59E0B";

    }

    return "#DC2626";

}

export function generateProgressWidth(score) {

    const value = Math.max(

        0,

        Math.min(100, toNumber(score))

    );

    return `${value}%`;

}