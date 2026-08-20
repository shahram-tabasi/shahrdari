/**
 * PowerPoint Builder
 *
 * Main entry point of the PowerPoint export engine.
 *
 * Responsibilities
 * ----------------
 * - Create presentation
 * - Configure metadata
 * - Apply layout
 * - Build every slide
 * - Generate PPTX buffer
 * - Send download response
 */

import PptxGenJS from "pptxgenjs";

import { APP_INFO, PPT } from "../shared/constants.js";

import { createFileName } from "../shared/helper.js";

import { addTitleSlide } from "./title.slide.js";
import { addSummarySlide } from "./summary.slide.js";
import { addRankingSlide } from "./ranking.slide.js";
import { addChartSlide } from "./chart.slide.js";
import { addAuditSlide } from "./audit.slide.js";


export async function buildPresentation(report = {}) {

    const pptx = new PptxGenJS();

    initializePresentation(pptx);

    addTitleSlide(
        pptx,
        report
    );

    addSummarySlide(
        pptx,
        report
    );

    addRankingSlide(
        pptx,
        report
    );

    addChartSlide(
        pptx,
        report
    );

    addAuditSlide(
        pptx,
        report
    );

    finalizePresentation(pptx);

    return pptx;

}


export async function exportPresentation(

    report,

    res

) {

    const pptx =
        await buildPresentation(report);

    const buffer =
        await pptx.write("nodebuffer");

    res.setHeader(

        "Content-Type",

        "application/vnd.openxmlformats-officedocument.presentationml.presentation"

    );

    res.setHeader(

        "Content-Disposition",

        `attachment; filename=${createFileName("pptx")}`

    );

    res.send(buffer);

}


function initializePresentation(pptx) {

    pptx.layout =
        PPT.layout;

    pptx.author =
        PPT.author;

    pptx.company =
        PPT.company;

    pptx.subject =
        PPT.subject;

    pptx.title =
        PPT.title;

    pptx.lang =
        "fa-IR";

    pptx.theme = {

        headFontFace:

            "Segoe UI",

        bodyFontFace:

            "Segoe UI",

        lang:

            "fa-IR"

    };

    pptx.defineSlideMaster({

        title: "MASTER",

        background: {

            color: "F8FAFC"

        },

        objects: [

            {

                rect: {

                    x: 0,

                    y: 0,

                    w: 13.333,

                    h: 0.22,

                    fill: {

                        color: "0B3A53"

                    },

                    line: {

                        color: "0B3A53"

                    }

                }

            },

            {

                rect: {

                    x: 0,

                    y: 7.28,

                    w: 13.333,

                    h: 0.22,

                    fill: {

                        color: "0B3A53"

                    },

                    line: {

                        color: "0B3A53"

                    }

                }

            }

        ]

    });

}


function finalizePresentation(pptx) {

    pptx._slides.forEach(

        slide => {

            slide.addText(

                APP_INFO.shortName,

                {

                    x: 0.4,

                    y: 7.05,

                    w: 2,

                    h: 0.2,

                    fontSize: 9,

                    color: "FFFFFF"

                }

            );

            slide.addText(

                "Executive Report",

                {

                    x: 5.1,

                    y: 7.05,

                    w: 3,

                    h: 0.2,

                    fontSize: 9,

                    color: "FFFFFF",

                    align: "center"

                }

            );

            slide.addText(

                new Date()

                    .toLocaleDateString(

                        "en-US"

                    ),

                {

                    x: 10.8,

                    y: 7.05,

                    w: 2,

                    h: 0.2,

                    fontSize: 9,

                    color: "FFFFFF",

                    align: "right"

                }

            );

        }

    );

}