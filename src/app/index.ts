import express, {
    type Application,
    type Request,
    type Response,
    type NextFunction,
} from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./auth/routes.js";
import checkboxRoutes from "./checkbox/routes.js";
import { verifyAuthCookie } from "../middlewares/authMiddleware.js";
import AppError from "../utils/AppError.js";

export default function createServerApplication(): Application {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());
    app.use(express.static("public"));
    app.use(verifyAuthCookie);

    app.get("/api/ping", (req, res) => {
        return res.status(200).json({
            success: true,
            message: "All good",
        });
    });

    app.use("/auth", authRoutes);
    app.use("/api/checkboxes", checkboxRoutes);

    app.use((req: Request, res: Response) => {
        return res.status(404).json({
            success: false,
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        });
    });

    app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
        console.error(err);

        if (err instanceof AppError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    });

    return app;
}
