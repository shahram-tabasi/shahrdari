/**
 * Shared export styling utilities.
 *
 * This file contains the global color palette,
 * fonts, borders, fills and reusable styling
 * functions for Excel, PDF and PowerPoint.
 */

export const COLORS = Object.freeze({

    navy: "0B3A53",

    blue: "2563EB",

    cyan: "0891B2",

    green: "16A34A",

    emerald: "10B981",

    orange: "F59E0B",

    amber: "D97706",

    red: "DC2626",

    purple: "7C3AED",

    gray900: "0F172A",

    gray800: "1E293B",

    gray700: "334155",

    gray600: "475569",

    gray500: "64748B",

    gray400: "94A3B8",

    gray300: "CBD5E1",

    gray200: "E2E8F0",

    gray100: "F1F5F9",

    background: "F8FAFC",

    white: "FFFFFF"

});

export const FONT = Object.freeze({

    family: "Calibri",

    size: 11,

    title: 24,

    subtitle: 18,

    heading: 15,

    body: 11,

    small: 9

});

export const BORDER = Object.freeze({

    top: {

        style: "thin",

        color: {

            argb: COLORS.gray300

        }

    },

    left: {

        style: "thin",

        color: {

            argb: COLORS.gray300

        }

    },

    right: {

        style: "thin",

        color: {

            argb: COLORS.gray300

        }

    },

    bottom: {

        style: "thin",

        color: {

            argb: COLORS.gray300

        }

    }

});

export const HEADER_FILL = Object.freeze({

    type: "pattern",

    pattern: "solid",

    fgColor: {

        argb: COLORS.navy

    }

});

export const EVEN_ROW_FILL = Object.freeze({

    type: "pattern",

    pattern: "solid",

    fgColor: {

        argb: COLORS.background

    }

});

export const SUCCESS_FILL = Object.freeze({

    type: "pattern",

    pattern: "solid",

    fgColor: {

        argb: "DCFCE7"

    }

});

export const WARNING_FILL = Object.freeze({

    type: "pattern",

    pattern: "solid",

    fgColor: {

        argb: "FEF3C7"

    }

});

export const DANGER_FILL = Object.freeze({

    type: "pattern",

    pattern: "solid",

    fgColor: {

        argb: "FEE2E2"

    }

});

export function styleHeader(row) {

    row.height = 28;

    row.font = {

        name: FONT.family,

        size: 12,

        bold: true,

        color: {

            argb: COLORS.white

        }

    };

    row.alignment = {

        horizontal: "center",

        vertical: "middle",

        wrapText: true

    };

    row.eachCell(cell => {

        cell.fill = HEADER_FILL;

        cell.border = BORDER;

    });

}

export function styleCell(cell) {

    cell.font = {

        name: FONT.family,

        size: FONT.body

    };

    cell.border = BORDER;

    cell.alignment = {

        horizontal: "center",

        vertical: "middle",

        wrapText: true

    };

}

export function zebraRow(row, index) {

    if (index % 2 !== 0) {

        return;

    }

    row.eachCell(cell => {

        cell.fill = EVEN_ROW_FILL;

    });

}

export function applyScoreColor(cell, value) {

    if (value >= 80) {

        cell.fill = SUCCESS_FILL;

        return;

    }

    if (value >= 60) {

        cell.fill = WARNING_FILL;

        return;

    }

    cell.fill = DANGER_FILL;

}

export function titleStyle(cell) {

    cell.font = {

        name: FONT.family,

        size: FONT.title,

        bold: true,

        color: {

            argb: COLORS.navy

        }

    };

    cell.alignment = {

        horizontal: "center",

        vertical: "middle"

    };

}

export function subtitleStyle(cell) {

    cell.font = {

        name: FONT.family,

        size: FONT.subtitle,

        italic: true,

        color: {

            argb: COLORS.gray600

        }

    };

    cell.alignment = {

        horizontal: "center",

        vertical: "middle"

    };

}

export function createCardFill(color) {

    return {

        type: "pattern",

        pattern: "solid",

        fgColor: {

            argb: color

        }

    };

}

export function createWhiteFont(size = 18) {

    return {

        name: FONT.family,

        size,

        bold: true,

        color: {

            argb: COLORS.white

        }

    };

}

export function centerAlignment() {

    return {

        horizontal: "center",

        vertical: "middle",

        wrapText: true

    };

}

export function leftAlignment() {

    return {

        horizontal: "left",

        vertical: "middle",

        wrapText: true

    };

}

export function rightAlignment() {

    return {

        horizontal: "right",

        vertical: "middle",

        wrapText: true

    };

}