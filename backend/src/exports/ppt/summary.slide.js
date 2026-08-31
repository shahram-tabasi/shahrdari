/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PowerPoint Summary Slide
 *
 * Creates an executive overview slide.
 *
 * Contains:
 * - KPI cards
 * - Project statistics
 * - AI analysis summary
 * - Decision indicators
 */

import {
    average,
    max,
    min,
    safeNumber,
    formatDecimal,
    formatInteger
} from "../shared/formatter.js";


export function addSummarySlide(

    pptx,

    report = {}

) {

    const slide = pptx.addSlide();

    slide.background = {
        color: "F8FAFC"
    };

    slide.addText(
        "Executive Summary",
        {
            x: 0.5,
            y: 0.25,
            w: 6,
            h: 0.4,
            fontSize: 28,
            bold: true,
            color: "0B3A53"
        }
    );

    const ranking =
        report.ranking ?? [];

    const scores =
        ranking.map(item =>
            safeNumber(item.score)
        );

    const cards = [
        {
            title: "Projects",
            value:
                formatInteger(
                    ranking.length
                ),
            color: "2563EB"
        },
        {
            title: "Average Score",
            value:
                formatDecimal(
                    average(scores)
                ),
            color: "16A34A"
        },
        {
            title: "Highest Score",
            value:
                formatDecimal(
                    max(scores)
                ),
            color: "7C3AED"
        },
        {
            title: "Lowest Score",
            value:
                formatDecimal(
                    min(scores)
                ),
            color: "DC2626"
        }
    ];

    cards.forEach(
        (card, index) => {
            createMetricCard(
                pptx,      // <-- اصلاح: اضافه شد
                slide,
                card,
                0.5 + (index * 3.1),
                1.1
            );
        }
    );

    slide.addText(
        "AI Executive Analysis",
        {
            x: 0.5,
            y: 2.8,
            w: 5,
            h: 0.3,
            fontSize: 20,
            bold: true,
            color: "0B3A53"
        }
    );

    slide.addShape(
        pptx.ShapeType.roundRect,
        {
            x: 0.5,
            y: 3.2,
            w: 12,
            h: 1.5,
            rectRadius: 0.08,
            fill: {
                color: "FFFFFF"
            },
            line: {
                color: "CBD5E1"
            }
        }
    );

    slide.addText(
        report.aiSummary ??
        "No AI summary available.",
        {
            x: 0.8,
            y: 3.5,
            w: 11.4,
            h: 0.8,
            fontSize: 15,
            color: "334155",
            valign: "mid",
            breakLine: false,
            fit: "shrink"
        }
    );

    slide.addText(
        "Decision Overview",
        {
            x: 0.5,
            y: 5.2,
            w: 5,
            h: 0.3,
            fontSize: 20,
            bold: true,
            color: "0B3A53"
        }
    );

    const approved = ranking.filter(
        item =>
            safeNumber(item.score) >= 75
    ).length;

    const review = ranking.filter(
        item =>
            safeNumber(item.score) < 75
    ).length;

    createStatusBox(
        pptx,      // <-- اصلاح: اضافه شد
        slide,
        "High Priority",
        approved,
        "16A34A",
        0.7,
        5.7
    );

    createStatusBox(
        pptx,
        slide,
        "Needs Review",
        review,
        "F59E0B",
        4.5,
        5.7
    );

    createStatusBox(
        pptx,
        slide,
        "Total Evaluated",
        ranking.length,
        "2563EB",
        8.3,
        5.7
    );

}



function createMetricCard(
    pptx,        // <-- اصلاح: پارامتر pptx اضافه شد
    slide,
    card,
    x,
    y
) {

    slide.addShape(
        pptx.ShapeType.roundRect,   // <-- اصلاح: استفاده از pptx.ShapeType
        {
            x,
            y,
            w: 2.7,
            h: 1.2,
            rectRadius: 0.08,
            fill: {
                color: "FFFFFF"
            },
            line: {
                color: card.color
            }
        }
    );

    slide.addText(
        card.title,
        {
            x: x + 0.2,
            y: y + 0.2,
            w: 2.2,
            h: 0.2,
            fontSize: 12,
            color: "64748B"
        }
    );

    slide.addText(
        card.value,
        {
            x: x + 0.2,
            y: y + 0.55,
            w: 2.2,
            h: 0.35,
            fontSize: 24,
            bold: true,
            color: "0B3A53"
        }
    );

}



function createStatusBox(
    pptx,        // <-- اصلاح: پارامتر pptx اضافه شد
    slide,
    title,
    value,
    color,
    x,
    y
) {

    slide.addShape(
        pptx.ShapeType.roundRect,   // <-- اصلاح: استفاده از pptx.ShapeType
        {
            x,
            y,
            w: 3.2,
            h: 0.8,
            rectRadius: 0.08,
            fill: {
                color
            },
            line: {
                color
            }
        }
    );

    slide.addText(
        `${title}: ${value}`,
        {
            x: x + 0.15,
            y: y + 0.25,
            w: 2.9,
            h: 0.25,
            fontSize: 16,
            bold: true,
            color: "FFFFFF",
            align: "center"
        }
    );

}