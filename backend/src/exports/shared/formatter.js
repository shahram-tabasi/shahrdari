/**
 * Common formatting utilities used by
 * Excel, PDF and PowerPoint builders.
 */

export function isNull(value) {

    return value === undefined ||
        value === null;

}

export function safeString(value) {

    if (isNull(value)) {

        return "";

    }

    return String(value);

}

export function safeNumber(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}

export function safeBoolean(value) {

    return Boolean(value);

}

export function formatInteger(value) {

    return safeNumber(value)
        .toLocaleString("en-US", {

            maximumFractionDigits: 0

        });

}

export function formatDecimal(value, digits = 2) {

    return safeNumber(value)
        .toLocaleString("en-US", {

            minimumFractionDigits: digits,

            maximumFractionDigits: digits

        });

}

export function formatPercent(value) {

    return `${formatDecimal(value, 2)} %`;

}

export function formatCurrency(value, currency = "USD") {

    return safeNumber(value)
        .toLocaleString("en-US", {

            style: "currency",

            currency

        });

}

export function formatDate(value) {

    if (!value) {

        return "";

    }

    return new Date(value)
        .toLocaleDateString("fa-IR");

}

export function formatDateTime(value) {

    if (!value) {

        return "";

    }

    return new Date(value)
        .toLocaleString("fa-IR");

}

export function capitalize(text) {

    const value = safeString(text);

    if (!value.length) {

        return "";

    }

    return value.charAt(0).toUpperCase() +
        value.slice(1);

}

export function truncate(text, length = 80) {

    const value = safeString(text);

    if (value.length <= length) {

        return value;

    }

    return `${value.substring(0, length)}...`;

}

export function percentage(value, total) {

    const number = safeNumber(value);

    const all = safeNumber(total);

    if (all === 0) {

        return 0;

    }

    return (number / all) * 100;

}

export function clamp(value, min = 0, max = 100) {

    return Math.max(

        min,

        Math.min(

            max,

            safeNumber(value)

        )

    );

}

export function average(array) {

    if (!Array.isArray(array) || array.length === 0) {

        return 0;

    }

    const total = array.reduce(

        (sum, value) =>

            sum + safeNumber(value),

        0

    );

    return total / array.length;

}

export function sum(array) {

    if (!Array.isArray(array)) {

        return 0;

    }

    return array.reduce(

        (sum, value) =>

            sum + safeNumber(value),

        0

    );

}

export function max(array) {

    if (!Array.isArray(array) || !array.length) {

        return 0;

    }

    return Math.max(

        ...array.map(

            safeNumber

        )

    );

}

export function min(array) {

    if (!Array.isArray(array) || !array.length) {

        return 0;

    }

    return Math.min(

        ...array.map(

            safeNumber

        )

    );

}

export function unique(array) {

    return [

        ...new Set(

            array

        )

    ];

}

export function sortDescending(items, field) {

    return [...items].sort(

        (a, b) =>

            safeNumber(b[field]) -

            safeNumber(a[field])

    );

}

export function sortAscending(items, field) {

    return [...items].sort(

        (a, b) =>

            safeNumber(a[field]) -

            safeNumber(b[field])

    );

}

export function formatFileSize(bytes) {

    const size = safeNumber(bytes);

    const units = [

        "B",

        "KB",

        "MB",

        "GB"

    ];

    let index = 0;

    let value = size;

    while (

        value >= 1024 &&

        index < units.length - 1

    ) {

        value /= 1024;

        index++;

    }

    return `${value.toFixed(2)} ${units[index]}`;

}

export function reportTitle(title) {

    return safeString(title)

        .trim()

        .replace(/\s+/g, " ");

}