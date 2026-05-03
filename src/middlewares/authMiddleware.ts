import type { Request, Response, NextFunction } from "express";
import { verifyIDToken, extractUserClaims } from "../config/oidc.js";
import AppError from "../utils/AppError.js";

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        name?: string | undefined;
        email?: string | undefined;
    } | null;
}

export async function verifyAuthCookie(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const token = req.cookies?.id_token;

        if (!token) {
            req.user = null;
            return next();
        }

        const claims = await verifyIDToken(token);
        req.user = extractUserClaims(claims);

        next();
    } catch (error) {
        req.user = null;
        next();
    }
}

export function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void {
    if (!req.user) {
        throw new AppError("Authentication required", 401);
    }
    next();
}
