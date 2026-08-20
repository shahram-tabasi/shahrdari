/**
 * Export Controller
 *
 * Connects HTTP routes with export engines.
 *
 * Supported exports:
 * - Excel
 * - PDF
 * - PowerPoint
 */

/**
 * NOTE: buildWorkbook / buildPdf / buildPresentation are intentionally
 * NOT imported statically here. Those modules pull in heavy libraries
 * (exceljs, puppeteer, pptxgenjs) which used to be loaded eagerly the
 * moment this controller was imported — i.e. as soon as the server
 * started, before app.listen() ever ran, because routes/index.js
 * imports every route file (including export.routes.js) up front.
 * If any one of those heavy libraries is slow, missing, or hangs while
 * loading, the ENTIRE backend would fail to start (no port would ever
 * open), even for people only using unrelated endpoints like /dashboard.
 * Loading them lazily, inside each handler, means the server always
 * starts, and a problem with one export format only breaks that format.
 */

import {
    createFileName
} from "../exports/shared/helper.js";


/**
 * Safely return an array.
 */
function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}


/**
 * Safely convert a value to a number.
 */
function numberValue(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


/**
 * Convert the frontend report payload
 * into the structure expected by Excel Builder.
 */
function buildExcelReport(report = {}) {

    const projects = ensureArray(report.projects);

    const ranking = ensureArray(report.ranking);

    const criteria = ensureArray(report.criteria);

    const neighborhoods = ensureArray(report.neighborhoods);

    const audit = ensureArray(report.audit);

    const aiAnalysis =
        typeof report.aiAnalysis === "string"
            ? report.aiAnalysis
            : "";


    /*
     * Ranking data
     *
     * Excel ranking sheet expects:
     * title
     * value
     *
     * We preserve the complete project/ranking
     * information separately in raw data.
     */
    const rankingData = ranking.map((item, index) => {

        const score =
            numberValue(
                item.finalScore ??
                item.score ??
                item.value
            );

        return {

            title:
                item.name ??
                item.title ??
                `پروژه ${index + 1}`,

            value: score,

            rank:
                item.rank ??
                index + 1,

            projectId:
                item.id ??
                item.projectId ??
                "",

            budget:
                numberValue(item.budget),

            justice:
                numberValue(item.justice),

            category:
                item.category ??
                item.type ??
                "",

            description:
                item.description ??
                ""

        };

    });


    /*
     * If ranking is empty, build ranking
     * directly from projects.
     */
    if (rankingData.length === 0) {

        projects.forEach((project, index) => {

            rankingData.push({

                title:
                    project.name ??
                    project.title ??
                    `پروژه ${index + 1}`,

                value:
                    numberValue(
                        project.finalScore ??
                        project.score
                    ),

                rank: index + 1,

                projectId:
                    project.id ??
                    "",

                budget:
                    numberValue(project.budget),

                justice:
                    numberValue(project.justice),

                category:
                    project.category ??
                    project.type ??
                    "",

                description:
                    project.description ??
                    ""

            });

        });

    }


    /*
     * Summary data.
     *
     * summary.sheet.js expects items with:
     * title
     * value
     * category
     * description
     */
    const totalBudget =
        projects.reduce(
            (sum, project) =>
                sum + numberValue(project.budget),
            0
        );


    const averageScore =
        rankingData.length > 0
            ? rankingData.reduce(
                (sum, item) =>
                    sum + numberValue(item.value),
                0
            ) / rankingData.length
            : 0;


    const topProject =
        rankingData.length > 0
            ? [...rankingData].sort(
                (a, b) =>
                    numberValue(b.value) -
                    numberValue(a.value)
            )[0]
            : null;


    const deprivedNeighborhoods =
        neighborhoods.filter(
            neighborhood =>
                numberValue(
                    neighborhood.deprivation
                ) >= 0.6
        );


    const summary = [

        {
            title: "تعداد کل پروژه‌ها",

            value: projects.length,

            category: "Project Statistics",

            description:
                "تعداد پروژه‌های موجود در گزارش."
        },

        {
            title: "مجموع بودجه",

            value: totalBudget,

            category: "Budget",

            description:
                "مجموع بودجه پروژه‌های گزارش."
        },

        {
            title: "میانگین امتیاز",

            value: Number(
                averageScore.toFixed(2)
            ),

            category: "MCDM",

            description:
                "میانگین امتیاز نهایی پروژه‌ها."
        },

        {
            title: "پروژه برتر",

            value:
                topProject?.title ??
                "بدون داده",

            category: "Ranking",

            description:
                topProject
                    ? `امتیاز پروژه برتر: ${topProject.value}`
                    : "اطلاعات رتبه‌بندی موجود نیست."
        },

        {
            title: "تعداد محله‌ها",

            value: neighborhoods.length,

            category: "Spatial Justice",

            description:
                "تعداد محله‌های بررسی‌شده."
        },

        {
            title: "محله‌های محروم",

            value:
                deprivedNeighborhoods.length,

            category: "Spatial Justice",

            description:
                "محله‌هایی با ضریب محرومیت حداقل ۰٫۶."
        },

        {
            title: "تعداد معیارها",

            value: criteria.length,

            category: "MCDM",

            description:
                "تعداد معیارهای ارزیابی."
        },

        {
            title: "تحلیل هوش مصنوعی",

            value:
                aiAnalysis
                    ? "موجود"
                    : "تولید نشده",

            category: "AI",

            description:
                aiAnalysis ||
                "تحلیل هوش مصنوعی در این گزارش تولید نشده است."
        }

    ];


    /*
     * Dashboard data.
     *
     * Dashboard sheet also consumes
     * an array of title/value objects.
     */
    const dashboard = [

        {
            title: "Total Projects",

            value: projects.length
        },

        {
            title: "Total Budget",

            value: totalBudget
        },

        {
            title: "Average Score",

            value: Number(
                averageScore.toFixed(2)
            )
        },

        {
            title: "Top Project",

            value:
                topProject?.title ??
                ""
        },

        {
            title: "Neighborhoods",

            value: neighborhoods.length
        },

        {
            title: "Deprived Neighborhoods",

            value:
                deprivedNeighborhoods.length
        },

        {
            title: "Criteria",

            value: criteria.length
        }

    ];


    /*
     * Audit data.
     *
     * Existing audit sheet converts
     * item.title into its Action column.
     */
    const auditData =
        audit.length > 0
            ? audit.map(item => ({

                title:
                    item.action ??
                    item.title ??
                    item.name ??
                    item.event ??
                    "Audit event",

                value:
                    item.date ??
                    item.timestamp ??
                    ""

            }))
            : [

                {
                    title:
                        "گزارش تولید شد",

                    value:
                        new Date().toISOString()
                }

            ];


    /*
     * Raw data
     *
     * This is the important part:
     * the complete project information is placed
     * here so Excel contains actual records,
     * not only headers.
     */
    const raw = projects.map(
        (project, index) => {

            const rankedItem =
                ranking.find(
                    item =>
                        (
                            item.id ??
                            item.projectId
                        ) === project.id
                ) ??
                ranking[index] ??
                {};


            return {

                Rank:
                    rankedItem.rank ??
                    index + 1,

                Project_ID:
                    project.id ??
                    "",

                Project:
                    project.name ??
                    project.title ??
                    "",

                Score:
                    numberValue(
                        rankedItem.finalScore ??
                        rankedItem.score ??
                        rankedItem.value ??
                        project.finalScore ??
                        project.score
                    ),

                Budget:
                    numberValue(
                        project.budget
                    ),

                Justice:
                    numberValue(
                        rankedItem.justice ??
                        project.justice
                    ),

                Category:
                    project.category ??
                    project.type ??
                    "",

                Status:
                    project.status ??
                    "",

                Neighborhood:
                    project.neighborhood ??
                    project.neighborhoodName ??
                    "",

                Description:
                    project.description ??
                    ""

            };

        }
    );


    /*
     * If projects are unavailable but ranking exists,
     * use ranking as raw data.
     */
    if (
        raw.length === 0 &&
        rankingData.length > 0
    ) {

        rankingData.forEach(
            (item, index) => {

                raw.push({

                    Rank:
                        item.rank ??
                        index + 1,

                    Project_ID:
                        item.projectId ??
                        "",

                    Project:
                        item.title ??
                        "",

                    Score:
                        numberValue(
                            item.value
                        ),

                    Budget:
                        numberValue(
                            item.budget
                        ),

                    Justice:
                        numberValue(
                            item.justice
                        ),

                    Category:
                        item.category ??
                        "",

                    Status:
                        "",

                    Neighborhood:
                        "",

                    Description:
                        item.description ??
                        ""

                });

            }
        );

    }


    return {

        title:
            report.title ??
            "Municipality Executive Report",

        subtitle:
            report.subtitle ??
            "Smart-VAP",

        dashboard,

        summary,

        ranking:
            rankingData,

        audit:
            auditData,

        raw

    };

}


/**
 * Generate Excel report
 */
export async function exportExcel(req, res) {

    try {

        const incomingReport =
            req.body ?? {};


        const report =
            buildExcelReport(
                incomingReport
            );

        const { buildWorkbook } =
            await import("../exports/excel/workbook.builder.js");


        console.log(
            "Excel export:",
            {
                projects:
                    ensureArray(
                        incomingReport.projects
                    ).length,

                ranking:
                    ensureArray(
                        incomingReport.ranking
                    ).length,

                summary:
                    report.summary.length,

                raw:
                    report.raw.length
            }
        );


        const workbook =
            await buildWorkbook(
                report
            );


        const buffer =
            await workbook.xlsx.writeBuffer();


        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );


        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${createFileName("xlsx")}`
        );


        res.send(
            Buffer.from(buffer)
        );


    } catch (error) {

        console.error(
            "Excel export error:",
            error
        );


        if (!res.headersSent) {

            res.status(500).json({

                success: false,

                message:
                    "Excel export failed",

                error:
                    error instanceof Error
                        ? error.message
                        : String(error)

            });

        }

    }

}


/**
 * Generate PDF report
 */
export async function exportPdf(req, res) {

    try {

        const report =
            req.body ?? {};

        const { buildPdf } =
            await import("../exports/pdf/pdf.builder.js");

        const pdf =
            await buildPdf(
                report
            );


        res.setHeader(
            "Content-Type",
            "application/pdf"
        );


        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${createFileName("pdf")}`
        );


        res.send(pdf);


    } catch (error) {

        console.error(
            "PDF export error:",
            error
        );


        if (!res.headersSent) {

            res.status(500).json({

                success: false,

                message:
                    "PDF export failed",

                error:
                    error instanceof Error
                        ? error.message
                        : String(error)

            });

        }

    }

}


/**
 * Generate PowerPoint report
 */
export async function exportPptx(req, res) {

    try {

        const report =
            req.body ?? {};

        const { buildPresentation } =
            await import("../exports/ppt/ppt.builder.js");

        const pptx =
            await buildPresentation(
                report
            );


        const buffer =
            await pptx.write(
                "nodebuffer"
            );


        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        );


        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${createFileName("pptx")}`
        );


        res.send(buffer);


    } catch (error) {

        console.error(
            "PPTX export error:",
            error
        );


        if (!res.headersSent) {

            res.status(500).json({

                success: false,

                message:
                    "PowerPoint export failed",

                error:
                    error instanceof Error
                        ? error.message
                        : String(error)

            });

        }

    }

}