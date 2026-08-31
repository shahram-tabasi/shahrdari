/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PDF Cover Section
 *
 * This module generates the executive cover page.
 */

import { attribution } from "../../config/branding.js";

import { APP_INFO } from "../shared/constants.js";
import { buildTimestamp } from "../shared/helper.js";

export function renderCoverSection(report = {}) {

    const title =
        report.title ??
        "Executive Decision Support Report";

    const subtitle =
        report.subtitle ??
        "Municipality Artificial Intelligence Platform";

    return `

<section class="cover">

    <div
        style="
            width:120px;
            height:120px;
            border-radius:60px;
            background:#0B3A53;
            display:flex;
            align-items:center;
            justify-content:center;
            color:white;
            font-size:46px;
            font-weight:bold;
            margin-bottom:35px;
        ">

        AI

    </div>

    <h1>

        ${title}

    </h1>

    <h2>

        ${subtitle}

    </h2>

    <div
        style="
            margin-top:60px;
            width:100%;
            display:grid;
            grid-template-columns:repeat(2,1fr);
            gap:20px;
        ">

        ${infoCard(

            "Platform",

            APP_INFO.name

        )}

        ${infoCard(

            "Version",

            APP_INFO.version

        )}

        ${infoCard(

            "Organization",

            APP_INFO.company

        )}

        ${infoCard(

            "Generated",

            buildTimestamp()

        )}

    </div>

    <div
        style="
            margin-top:90px;
            color:#64748B;
            font-size:13px;
            text-align:center;
        ">

        ${attribution("fa")}
        <br />
        ${attribution("en")}

    </div>

</section>

<div class="page-break"></div>

`;

}

function infoCard(title, value) {

    return `

<div class="card">

    <div class="card-title">

        ${title}

    </div>

    <div
        style="
            margin-top:10px;
            font-size:18px;
            font-weight:700;
            color:#0B3A53;
        ">

        ${value}

    </div>

</div>

`;

}