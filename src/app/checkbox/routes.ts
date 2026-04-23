import { Router } from "express";
import {
    handleGetCheckboxRange,
    handleGetCheckedCheckboxCount,
} from "./controller.js";

const router = Router();

router.get("/", handleGetCheckboxRange);
router.get("/count", handleGetCheckedCheckboxCount);

export default router;
