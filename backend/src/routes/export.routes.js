import { Router } from "express";
import { exportExcel, exportPdf, exportPptx } from "../controllers/export.controller.js";

const router = Router();

router.post("/excel", exportExcel);
router.post("/pdf", exportPdf);
router.post("/pptx", exportPptx);

export default router;
