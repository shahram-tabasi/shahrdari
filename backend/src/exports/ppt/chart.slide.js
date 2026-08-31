/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PowerPoint Chart Slide
 *
 * Creates visual analytics slides using
 * native PowerPoint charts.
 *
 * Includes:
 * - Ranking Bar Chart
 * - Score Distribution
 * - Performance Gauge
 * - KPI visualization
 */

import {
    safeNumber,
    formatDecimal
} from "../shared/formatter.js";


export function addChartSlide(

    pptx,

    report = {}

) {

    const slide = pptx.addSlide();

    slide.background = {
        color: "F8FAFC"
    };

    slide.addText(
        "Analytics Dashboard",
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

    const ranking =
        [...(report.ranking ?? [])]
            .sort(
                (a,b)=>
                    safeNumber(b.score)-
                    safeNumber(a.score)
            )
            .slice(0,8);

    addRankingChart(
        pptx,
        slide,
        ranking
    );

    addDistributionChart(
        pptx,
        slide,
        ranking
    );

}



function addRankingChart(

    pptx,
    slide,
    ranking

){

    const categories =
        ranking.map(
            item =>
                item.title ?? "Project"
        );

    const values =
        ranking.map(
            item =>
                safeNumber(item.score)
        );

    slide.addText(
        "Project Score Ranking",
        {
            x:0.6,
            y:1,
            w:4,
            h:0.3,
            fontSize:18,
            bold:true,
            color:"0B3A53"
        }
    );

    slide.addChart(
        pptx.ChartType.bar,
        [
            {
                name:"Score",
                labels:categories,
                values
            }
        ],
        {
            x:0.6,
            y:1.4,
            w:6,
            h:3.5,
            catAxisLabelFontSize:10,
            valAxisLabelFontSize:10,
            showLegend:false,
            showTitle:false,
            showValue:true,
            chartColors:[
                "2563EB"
            ],
            valAxisMinVal:0,
            valAxisMaxVal:100
        }
    );

}



function addDistributionChart(

    pptx,
    slide,
    ranking

){

    const excellent = ranking.filter(
        item =>
            safeNumber(item.score)>=90
    ).length;

    const good = ranking.filter(
        item =>
            safeNumber(item.score)>=70 &&
            safeNumber(item.score)<90
    ).length;

    const review = ranking.filter(
        item =>
            safeNumber(item.score)<70
    ).length;

    slide.addText(
        "Performance Distribution",
        {
            x:7.2,
            y:1,
            w:4,
            h:0.3,
            fontSize:18,
            bold:true,
            color:"0B3A53"
        }
    );

    slide.addChart(
        pptx.ChartType.doughnut,
        [
            {
                name:"Performance",
                labels:[
                    "Excellent",
                    "Good",
                    "Review"
                ],
                values:[
                    excellent,
                    good,
                    review
                ]
            }
        ],
        {
            x:7,
            y:1.4,
            w:5.5,
            h:3.5,
            holeSize:55,
            showLegend:true,
            legendPos:"b",
            showTitle:false,
            chartColors:[
                "16A34A",
                "2563EB",
                "F59E0B"
            ]
        }
    );

    addAverageCard(
        pptx,      // <-- اصلاح: اضافه شد
        slide,
        ranking
    );

}



function addAverageCard(
    pptx,        // <-- اصلاح: پارامتر pptx اضافه شد
    slide,
    ranking
){

    const average =
        ranking.length
            ? ranking.reduce(
                (sum,item)=>
                    sum +
                    safeNumber(item.score),
                0
            )
            /
            ranking.length
            :0;

    slide.addShape(
        pptx.ShapeType.roundRect,   // <-- اصلاح: استفاده از pptx.ShapeType
        {
            x:7.4,
            y:5.4,
            w:4.8,
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
        `Average Performance : ${formatDecimal(average)}`,
        {
            x:7.6,
            y:5.65,
            w:4.4,
            h:0.25,
            fontSize:16,
            bold:true,
            color:"FFFFFF",
            align:"center"
        }
    );

}