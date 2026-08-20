/**
 * Project Ranking worksheet.
 *
 * This worksheet contains the complete project
 * ranking with scoring, weighted score,
 * recommendation level and final decision.
 */

import {
    styleHeader,
    centerAlignment,
    zebraRow,
    applyScoreColor,
    titleStyle,
    subtitleStyle
} from "../shared/style.js";

import {
    safeNumber,
    formatDecimal
} from "../shared/formatter.js";

export function createRankingSheet(workbook, projects = []) {

    const sheet = workbook.addWorksheet("Project Ranking");

    sheet.views = [
        {
            state: "frozen",
            ySplit: 4
        }
    ];

    sheet.properties.defaultRowHeight = 24;

    sheet.columns = [

        { width: 8 },

        { width: 34 },

        { width: 18 },

        { width: 18 },

        { width: 18 },

        { width: 18 },

        { width: 18 },

        { width: 18 },

        { width: 18 },

        { width: 22 }

    ];

    sheet.mergeCells("A1:J1");

    const title = sheet.getCell("A1");

    title.value = "Project Priority Ranking";

    titleStyle(title);

    sheet.mergeCells("A2:J2");

    const subtitle = sheet.getCell("A2");

    subtitle.value =
        "Projects sorted by final weighted score.";

    subtitleStyle(subtitle);

    const header = sheet.addRow([

        "Rank",

        "Project",

        "Economic",

        "Technical",

        "Environmental",

        "Social",

        "Risk",

        "Weighted",

        "Score",

        "Recommendation"

    ]);

    styleHeader(header);

    const ranking = [...projects]

        .sort(

            (a, b) =>

                safeNumber(b.score) -

                safeNumber(a.score)

        );

    ranking.forEach((project, index) => {

        const row = sheet.addRow([

            index + 1,

            project.title ?? "",

            safeNumber(project.economic),

            safeNumber(project.technical),

            safeNumber(project.environmental),

            safeNumber(project.social),

            safeNumber(project.risk),

            formatDecimal(

                safeNumber(project.weightedScore)

            ),

            formatDecimal(

                safeNumber(project.score)

            ),

            recommendation(

                safeNumber(project.score)

            )

        ]);

        zebraRow(row, index + 1);

        row.height = 24;

        row.eachCell(cell => {

            cell.alignment = centerAlignment();

            cell.border = {

                top: {

                    style: "thin"

                },

                left: {

                    style: "thin"

                },

                right: {

                    style: "thin"

                },

                bottom: {

                    style: "thin"

                }

            };

        });

        applyScoreColor(

            row.getCell(9),

            safeNumber(project.score)

        );

    });

    sheet.autoFilter = {

        from: {

            row: 3,

            column: 1

        },

        to: {

            row: 3,

            column: 10

        }

    };

}

function recommendation(score) {

    if (score >= 90) {

        return "Immediate Approval";

    }

    if (score >= 80) {

        return "High Priority";

    }

    if (score >= 70) {

        return "Recommended";

    }

    if (score >= 60) {

        return "Review Required";

    }

    if (score >= 40) {

        return "Low Priority";

    }

    return "Rejected";

}