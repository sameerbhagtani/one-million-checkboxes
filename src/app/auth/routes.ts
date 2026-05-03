import { Router } from "express";
import {
    loginHandler,
    callbackHandler,
    logoutHandler,
    meHandler,
} from "./controller.js";

const router = Router();

router.get("/login", loginHandler);

router.get("/callback", callbackHandler);

router.get("/me", meHandler);

router.get("/logout", logoutHandler);

export default router;
