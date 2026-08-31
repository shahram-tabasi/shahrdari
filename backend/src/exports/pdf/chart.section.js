/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PDF Chart Section
 *
 * Generates visual analytics blocks
 * for the executive PDF report.
 *
 * Charts are created using pure SVG
 * to keep PDF rendering independent
 * from external chart libraries.
 */

import {
    safeNumber,
    formatDecimal
} from "../shared/formatter.js";


export function renderChartSection(report = {}) {

    const ranking =
        report.ranking ?? [];

    const scores =
        ranking.map(item => ({

            label:
                item.title ?? "Unknown",

            value:
                safeNumber(item.score)

        }));


    return `

<section class="section">

<div class="section-title">

Analytics Dashboard

</div>


<div class="card">

<h3 style="color:#0B3A53">

Project Performance Ranking

</h3>


${renderBarChart(scores)}


</div>


<div
class="card"
style="margin-top:30px;">

<h3 style="color:#0B3A53">

Average Performance Gauge

</h3>


${renderGauge(

calculateAverage(scores)

)}


</div>


</section>


<div class="page-break"></div>

`;

}


function renderBarChart(items = []) {


    const width = 700;

    const height = 300;

    const maxValue = Math.max(

        ...items.map(item =>
            item.value
        ),

        100

    );


    const bars = items

        .slice(0, 10)

        .map((item, index) => {


            const barHeight =
                (item.value / maxValue) * 200;


            const x =
                50 + (index * 60);


            const y =
                240 - barHeight;


            return `


<rect

x="${x}"

y="${y}"

width="35"

height="${barHeight}"

rx="6"

fill="#2563EB"

/>


<text

x="${x + 17}"

y="260"

text-anchor="middle"

font-size="10"

fill="#475569"

transform="rotate(45 ${x + 17} 260)"

>

${escapeSvg(item.label)}

</text>


<text

x="${x + 17}"

y="${y - 8}"

text-anchor="middle"

font-size="10"

fill="#0B3A53"

>

${formatDecimal(item.value)}

</text>


`;

        })

        .join("");



    return `


<svg

width="${width}"

height="${height}"

viewBox="0 0 ${width} ${height}"

xmlns="http://www.w3.org/2000/svg"

>


<line

x1="40"

y1="240"

x2="680"

y2="240"

stroke="#CBD5E1"

/>


${bars}


</svg>


`;

}



function renderGauge(value) {


    const percent =
        Math.max(

            0,

            Math.min(

                100,

                value

            )

        );


    const radius = 90;

    const circumference =
        2 * Math.PI * radius;


    const progress =
        circumference -

        (

            percent / 100

        )

        *

        circumference;



    return `


<svg

width="300"

height="220"

viewBox="0 0 300 220"

xmlns="http://www.w3.org/2000/svg"

>


<circle

cx="150"

cy="120"

r="${radius}"

fill="none"

stroke="#E2E8F0"

stroke-width="25"

/>



<circle

cx="150"

cy="120"

r="${radius}"

fill="none"

stroke="#16A34A"

stroke-width="25"

stroke-dasharray="${circumference}"

stroke-dashoffset="${progress}"

transform="rotate(-90 150 120)"

/>



<text

x="150"

y="130"

text-anchor="middle"

font-size="32"

font-weight="bold"

fill="#0B3A53"

>

${formatDecimal(value)}

</text>



<text

x="150"

y="160"

text-anchor="middle"

font-size="14"

fill="#64748B"

>

Performance Score

</text>


</svg>


`;

}



function calculateAverage(items) {


    if (!items.length) {

        return 0;

    }


    const total = items.reduce(

        (sum, item) =>

            sum + safeNumber(item.value),

        0

    );


    return total / items.length;

}



function escapeSvg(text) {


    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&apos;");

}