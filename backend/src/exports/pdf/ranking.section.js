/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PDF Ranking Section
 *
 * Displays the complete project ranking table
 * together with executive statistics.
 */

import {
    safeNumber,
    formatDecimal,
    average,
    max,
    min
} from "../shared/formatter.js";

export function renderRankingSection(report = {}) {

    const ranking =
        [...(report.ranking ?? [])]

            .sort(

                (a, b) =>

                    safeNumber(b.score) -

                    safeNumber(a.score)

            );

    const scores = ranking.map(item =>
        safeNumber(item.score)
    );

    return `

<section class="section">

<div class="section-title">

Project Ranking

</div>

<div
class="card"
style="
margin-bottom:24px;
">

<div
style="
display:grid;
grid-template-columns:repeat(3,1fr);
gap:20px;
">

${statCard(

"Average Score",

formatDecimal(

average(scores)

)

)}

${statCard(

"Highest Score",

formatDecimal(

max(scores)

)

)}

${statCard(

"Lowest Score",

formatDecimal(

min(scores)

)

)}

</div>

</div>

<table>

<thead>

<tr>

<th>Rank</th>

<th>Project</th>

<th>Economic</th>

<th>Technical</th>

<th>Environmental</th>

<th>Social</th>

<th>Risk</th>

<th>Score</th>

<th>Status</th>

</tr>

</thead>

<tbody>

${ranking

.map(

(project,index)=>`

<tr>

<td>

${index+1}

</td>

<td>

${project.title ?? "-"}

</td>

<td>

${formatDecimal(

safeNumber(project.economic)

)}

</td>

<td>

${formatDecimal(

safeNumber(project.technical)

)}

</td>

<td>

${formatDecimal(

safeNumber(project.environmental)

)}

</td>

<td>

${formatDecimal(

safeNumber(project.social)

)}

</td>

<td>

${formatDecimal(

safeNumber(project.risk)

)}

</td>

<td>

<strong>

${formatDecimal(

safeNumber(project.score)

)}

</strong>

</td>

<td>

${status(

safeNumber(project.score)

)}

</td>

</tr>

`

)

.join("")}

</tbody>

</table>

</section>

<div class="page-break"></div>

`;

}

function statCard(title,value){

return `

<div
class="card"
style="text-align:center;">

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

function status(score){

if(score>=90){

return badge(

"Excellent",

"#16A34A"

);

}

if(score>=80){

return badge(

"Very Good",

"#2563EB"

);

}

if(score>=70){

return badge(

"Good",

"#0EA5E9"

);

}

if(score>=60){

return badge(

"Acceptable",

"#F59E0B"

);

}

return badge(

"Review",

"#DC2626"

);

}

function badge(text,color){

return `

<span
style="
display:inline-block;
padding:5px 10px;
background:${color};
color:white;
border-radius:20px;
font-size:11px;
font-weight:bold;
">

${text}

</span>

`;

}