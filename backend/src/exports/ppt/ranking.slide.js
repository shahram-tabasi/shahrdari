/**
 * PowerPoint Ranking Slide
 *
 * Creates a professional ranking presentation slide.
 *
 * Contains:
 * - Top projects table
 * - Score visualization
 * - Priority status
 * - Executive recommendations
 */

import {
    safeNumber,
    formatDecimal
} from "../shared/formatter.js";


export function addRankingSlide(

    pptx,

    report = {}

) {

    const slide = pptx.addSlide();

    slide.background = {
        color: "F8FAFC"
    };

    slide.addText(
        "Project Ranking",
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

    const projects =
        [...(report.ranking ?? [])]
            .sort(
                (a,b)=>
                    safeNumber(b.score) -
                    safeNumber(a.score)
            )
            .slice(0,10);

    const rows = [
        [
            "Rank",
            "Project",
            "Score",
            "Status"
        ]
    ];

    projects.forEach(
        (project,index)=>{

            rows.push([
                String(index + 1),
                project.title ?? "-",
                formatDecimal(
                    safeNumber(project.score)
                ),
                getStatus(
                    safeNumber(project.score)
                )
            ]);

        }
    );

    slide.addTable(
        rows,
        {
            x:0.5,
            y:1,
            w:12.3,
            h:3.8,
            border:{
                type:"solid",
                color:"CBD5E1",
                pt:1
            },
            fontSize:13,
            color:"334155",
            fill:"FFFFFF",
            rowH:0.35,
            valign:"mid",
            align:"center",
            autoFit:false,
            margin:0.08,
            bold:false,
            colW:[
                0.8,
                6,
                2,
                2.2
            ],
            paraSpaceAfterPt:8
        }
    );

    slide.addText(
        "Priority Distribution",
        {
            x:0.5,
            y:5.1,
            w:4,
            h:0.3,
            fontSize:20,
            bold:true,
            color:"0B3A53"
        }
    );

    const highPriority = projects.filter(
        item =>
            safeNumber(item.score)>=80
    ).length;

    const mediumPriority = projects.filter(
        item =>
            safeNumber(item.score)>=60 &&
            safeNumber(item.score)<80
    ).length;

    const lowPriority = projects.filter(
        item =>
            safeNumber(item.score)<60
    ).length;

    createPriorityCard(
        pptx,      // <-- اصلاح: اضافه شد
        slide,
        "High Priority",
        highPriority,
        "16A34A",
        0.7,
        5.7
    );

    createPriorityCard(
        pptx,
        slide,
        "Medium",
        mediumPriority,
        "F59E0B",
        4.5,
        5.7
    );

    createPriorityCard(
        pptx,
        slide,
        "Low Priority",
        lowPriority,
        "DC2626",
        8.3,
        5.7
    );

}



function createPriorityCard(
    pptx,        // <-- اصلاح: پارامتر pptx اضافه شد
    slide,
    title,
    value,
    color,
    x,
    y
){

    slide.addShape(
        pptx.ShapeType.roundRect,   // <-- اصلاح: استفاده از pptx.ShapeType
        {
            x,
            y,
            w:3,
            h:0.85,
            rectRadius:0.08,
            fill:{
                color
            },
            line:{
                color
            }
        }
    );

    slide.addText(
        `${title}\n${value}`,
        {
            x:x+0.1,
            y:y+0.15,
            w:2.8,
            h:0.5,
            fontSize:16,
            bold:true,
            color:"FFFFFF",
            align:"center"
        }
    );

}



function getStatus(score){

    if(score>=90){
        return "Excellent";
    }

    if(score>=75){
        return "Approved";
    }

    if(score>=60){
        return "Review";
    }

    return "Critical";

}