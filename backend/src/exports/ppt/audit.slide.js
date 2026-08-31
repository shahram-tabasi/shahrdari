/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PowerPoint Audit Slide
 *
 * Creates a governance and transparency slide.
 *
 * Contains:
 * - Decision history
 * - AI actions
 * - Audit events
 * - Traceability information
 */

import {
    safeNumber,
    formatDecimal,
    formatDateTime
} from "../shared/formatter.js";


export function addAuditSlide(

    pptx,

    report = {}

) {

    const slide = pptx.addSlide();

    slide.background = {
        color: "F8FAFC"
    };

    slide.addText(
        "Decision Audit Trail",
        {
            x:0.5,
            y:0.25,
            w:6,
            h:0.4,
            fontSize:28,
            bold:true,
            color:"0B3A53"
        }
    );

    slide.addText(
        "Transparent AI decision history and governance tracking",
        {
            x:0.5,
            y:0.75,
            w:8,
            h:0.25,
            fontSize:14,
            color:"64748B"
        }
    );

    const audit =
        report.audit ?? [];

    const rows = [
        [
            "Date",
            "Action",
            "Module",
            "Score",
            "Status"
        ]
    ];

    audit
        .slice(0,10)
        .forEach(item=>{

            rows.push([
                formatDateTime(
                    item.date
                ),
                item.action ??
                    "-",
                item.module ??
                    "-",
                formatDecimal(
                    safeNumber(
                        item.score
                    )
                ),
                getStatus(
                    safeNumber(
                        item.score
                    )
                )
            ]);

        });

    slide.addTable(
        rows,
        {
            x:0.5,
            y:1.3,
            w:12.2,
            h:3.5,
            border:{
                type:"solid",
                color:"CBD5E1",
                pt:1
            },
            fontSize:12,
            color:"334155",
            fill:"FFFFFF",
            rowH:0.35,
            valign:"mid",
            align:"center",
            margin:0.08,
            bold:false,
            colW:[
                2.2,
                3,
                2.5,
                1.5,
                2
            ]
        }
    );

    createGovernanceCard(
        pptx,      // <-- اصلاح: اضافه شد
        slide,
        audit.length,
        5.4
    );

}



function createGovernanceCard(
    pptx,        // <-- اصلاح: پارامتر pptx اضافه شد
    slide,
    count,
    y
){

    slide.addShape(
        pptx.ShapeType.roundRect,   // <-- اصلاح: استفاده از pptx.ShapeType
        {
            x:0.8,
            y,
            w:11.5,
            h:0.9,
            rectRadius:0.08,
            fill:{
                color:"0B3A53"
            },
            line:{
                color:"0B3A53"
            }
        }
    );

    slide.addText(
        `Total Recorded Decisions: ${count}

All actions are traceable through the AI governance system.`,
        {
            x:1,
            y:y+0.18,
            w:11,
            h:0.45,
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