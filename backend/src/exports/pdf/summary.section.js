/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PDF Executive Summary Section
 *
 * This section displays:
 * - KPI cards
 * - Overall statistics
 * - Executive AI summary
 * - Top ranked projects
 * - Key findings
 */

import { attribution } from "../../config/branding.js";

import {
    formatDecimal,
    formatInteger,
    average,
    max,
    min,
    sum,
    safeNumber
} from "../shared/formatter.js";

export function renderSummarySection(report = {}) {

    const ranking = report.ranking ?? [];

    const values = ranking.map(item =>
        safeNumber(item.score)
    );

    const totalProjects = ranking.length;

    const averageScore = average(values);

    const highestScore = max(values);

    const lowestScore = min(values);

    const totalScore = sum(values);

    const aiSummary =
        report.aiSummary ??
        "No executive summary available.";

    const topProjects =
        [...ranking]

            .sort(

                (a, b) =>

                    safeNumber(b.score) -

                    safeNumber(a.score)

            )

            .slice(0, 5);

    return `

<section class="section">

    <div class="section-title">

        Executive Summary

    </div>

    <div class="card-grid">

        ${kpiCard(

            "Projects",

            formatInteger(totalProjects),

            "#2563EB"

        )}

        ${kpiCard(

            "Average",

            formatDecimal(averageScore),

            "#16A34A"

        )}

        ${kpiCard(

            "Highest",

            formatDecimal(highestScore),

            "#7C3AED"

        )}

        ${kpiCard(

            "Lowest",

            formatDecimal(lowestScore),

            "#DC2626"

        )}

    </div>

    <div
        class="card"
        style="margin-top:24px;">

        <div
            class="card-title">

            Overall Score

        </div>

        <div
            class="card-value">

            ${formatDecimal(totalScore)}

        </div>

    </div>

    <div
        class="section"
        style="margin-top:30px;">

        <div class="section-title">

            AI Executive Analysis

        </div>

        <div
            class="card"
            style="
                line-height:2;
                font-size:14px;
                text-align:justify;
            ">

            ${aiSummary}

        </div>

    </div>

    <div
        class="section"
        style="margin-top:30px;">

        <div class="section-title">

            Top Ranked Projects

        </div>

        <table>

            <thead>

                <tr>

                    <th>#</th>

                    <th>Project</th>

                    <th>Score</th>

                    <th>Status</th>

                </tr>

            </thead>

            <tbody>

                ${topProjects
                    .map(

                        (project, index) =>

`
<tr>

<td>

${index + 1}

</td>

<td>

${project.title ?? "-"}

</td>

<td>

${formatDecimal(

safeNumber(project.score)

)}

</td>

<td>

${statusBadge(

safeNumber(project.score)

)}

</td>

</tr>
`

                    )

                    .join("")}

            </tbody>

        </table>

    </div>

    <div
        class="section"
        style="margin-top:30px;">

        <div class="section-title">

            Executive Highlights

        </div>

        <div class="card">

            <ul
                style="
                    line-height:2.1;
                    margin:0;
                    padding-left:22px;
                ">

                <li>

                    Total evaluated projects:
                    <strong>

                        ${formatInteger(totalProjects)}

                    </strong>

                </li>

                <li>

                    Average evaluation score:
                    <strong>

                        ${formatDecimal(averageScore)}

                    </strong>

                </li>

                <li>

                    Highest project score:
                    <strong>

                        ${formatDecimal(highestScore)}

                    </strong>

                </li>

                <li>

                    Lowest project score:
                    <strong>

                        ${formatDecimal(lowestScore)}

                    </strong>

                </li>

                <li>

                    ${attribution("en")}

                </li>

            </ul>

        </div>

    </div>

</section>

<div class="page-break"></div>

`;

}

function kpiCard(

    title,

    value,

    color

) {

    return `

<div
    class="card"
    style="
        border-top:6px solid ${color};
    ">

    <div
        class="card-title">

        ${title}

    </div>

    <div
        class="card-value">

        ${value}

    </div>

</div>

`;

}

function statusBadge(score) {

    if (score >= 90) {

        return badge(

            "Excellent",

            "#16A34A"

        );

    }

    if (score >= 75) {

        return badge(

            "Very Good",

            "#2563EB"

        );

    }

    if (score >= 60) {

        return badge(

            "Good",

            "#F59E0B"

        );

    }

    if (score >= 40) {

        return badge(

            "Average",

            "#EA580C"

        );

    }

    return badge(

        "Critical",

        "#DC2626"

    );

}

function badge(

    text,

    color

) {

    return `

<span
    style="
        display:inline-block;
        background:${color};
        color:#fff;
        padding:5px 12px;
        border-radius:20px;
        font-size:11px;
        font-weight:bold;
    ">

${text}

</span>

`;

}