/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PowerPoint Title Slide
 *
 * Creates the opening executive slide.
 *
 * Contains:
 * - Report title
 * - Organization name
 * - Version
 * - Generation date
 * - Professional branding
 */

import {
    APP_INFO,
    PPT
} from "../shared/constants.js";

import {
    buildTimestamp
} from "../shared/helper.js";


export function addTitleSlide(
    pptx,
    report = {}
) {
    const slide = pptx.addSlide();

    slide.background = {
        color: "F8FAFC"
    };

    slide.addShape(
        pptx.ShapeType.rect,
        {
            x: 0,
            y: 0,
            w: 13.33,
            h: 1.2,
            fill: {
                color: "0B3A53"
            },
            line: {
                color: "0B3A53"
            }
        }
    );

    slide.addText(
        "AI",
        {
            x: 0.6,
            y: 1.5,
            w: 1.2,
            h: 1.2,
            fontSize: 42,
            bold: true,
            color: "FFFFFF",
            align: "center",
            valign: "mid",
            fill: {
                color: "0B3A53"
            },
            margin: 0
        }
    );

    slide.addShape(
        pptx.ShapeType.ellipse,
        {
            x: 0.6,
            y: 1.5,
            w: 1.2,
            h: 1.2,
            fill: {
                color: "0B3A53"
            },
            line: {
                color: "0B3A53"
            }
        }
    );

    slide.addText(
        report.title ??
        "Executive Decision Support Report",
        {
            x: 2.2,
            y: 1.7,
            w: 9.5,
            h: 0.6,
            fontSize: 30,
            bold: true,
            color: "0B3A53",
            breakLine: false
        }
    );

    slide.addText(
        report.subtitle ??
        APP_INFO.name,
        {
            x: 2.2,
            y: 2.45,
            w: 9,
            h: 0.4,
            fontSize: 18,
            color: "64748B"
        }
    );

    createInfoCard(
        pptx,
        slide,
        "Organization",
        APP_INFO.company,
        2.2,
        3.5
    );

    createInfoCard(
        pptx,
        slide,
        "Version",
        APP_INFO.version,
        5.2,
        3.5
    );

    createInfoCard(
        pptx,
        slide,
        "Generated",
        buildTimestamp(),
        8.2,
        3.5
    );

    slide.addText(
        "Confidential Executive Presentation",
        {
            x: 0.8,
            y: 6.7,
            w: 5,
            h: 0.3,
            fontSize: 12,
            color: "64748B"
        }
    );

    slide.addText(
        PPT.company,
        {
            x: 10,
            y: 6.7,
            w: 2.5,
            h: 0.3,
            fontSize: 12,
            color: "64748B",
            align: "right"
        }
    );
}



function createInfoCard(
    pptx,
    slide,
    title,
    value,
    x,
    y
) {
    slide.addShape(
        pptx.ShapeType.roundRect,
        {
            x,
            y,
            w: 2.5,
            h: 1,
            rectRadius: 0.1,
            fill: {
                color: "FFFFFF"
            },
            line: {
                color: "CBD5E1"
            }
        }
    );

    slide.addText(
        title,
        {
            x: x + 0.15,
            y: y + 0.15,
            w: 2.2,
            h: 0.2,
            fontSize: 11,
            color: "64748B"
        }
    );

    slide.addText(
        String(value),
        {
            x: x + 0.15,
            y: y + 0.45,
            w: 2.2,
            h: 0.3,
            fontSize: 16,
            bold: true,
            color: "0B3A53"
        }
    );
}