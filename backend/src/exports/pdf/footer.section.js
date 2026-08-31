/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PDF footer: the block repeated at the bottom of every report page.
 *
 * Carries the client name, the vendor name, the generation timestamp, the
 * confidentiality marking and the copyright line. Labels are bilingual
 * (Persian first, then English) to match the rest of the product.
 */

import {
    APP_INFO
} from "../shared/constants.js";

import { copyright } from "../../config/branding.js";

import {
    buildTimestamp
} from "../shared/helper.js";


/**
 * Report footer.
 *
 * `report.organization` lets a caller override the client name printed on the
 * left (for example when the same platform serves several municipalities);
 * the vendor line beneath it always names us and is not overridable, because
 * a formal deliverable must state who built it.
 */
export function renderFooterSection(report = {}) {

    const organization =
        report.organization ??
        APP_INFO.client;


    return `

<footer class="footer">


<div>

${organization}

<br>

${APP_INFO.company}

</div>


<div>

تاریخ تولید / Generated:

${buildTimestamp()}

</div>


<div>

گزارش محرمانه / Confidential

<br>

${copyright("fa")}

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

${APP_INFO.company}

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