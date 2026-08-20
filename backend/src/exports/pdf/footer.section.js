/**
 * PDF Footer Section
 *
 * Generates the final footer area
 * for every PDF report page.
 *
 * Includes:
 * - Organization information
 * - Generation time
 * - Confidentiality notice
 * - Page information
 */

import {
    APP_INFO,
    EXPORT
} from "../shared/constants.js";

import {
    buildTimestamp
} from "../shared/helper.js";


export function renderFooterSection(report = {}) {

    const organization =
        report.organization ??
        APP_INFO.company;


    return `

<footer class="footer">


<div>

${organization}

<br>

${EXPORT.author}

</div>


<div>

Generated:

${buildTimestamp()}

</div>


<div>

Confidential Report

<br>

© ${new Date().getFullYear()}

</div>


</footer>


`;

}


export function renderPageFooter() {


    return `


<div

style="

position:fixed;

bottom:10mm;

left:0;

right:0;

height:20px;

display:flex;

justify-content:space-between;

font-size:10px;

color:#64748B;

padding:0 15mm;

"

>


<div>

Municipality AI Platform

</div>



<div>

Page <span class="pageNumber"></span>

</div>



<div>

Executive Report

</div>


</div>


`;

}