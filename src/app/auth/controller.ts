import type { Request, Response } from "express";
import axios from "axios";
import {
    getOIDCConfig,
    verifyIDToken,
    extractUserClaims,
} from "../../config/oidc.js";
import env from "../../env.js";
import AppError from "../../utils/AppError.js";

function generateState(): string {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

export async function loginHandler(req: Request, res: Response) {
    try {
        const config = await getOIDCConfig();
        const state = generateState();

        const params = new URLSearchParams({
            client_id: env.OAUTH_CLIENT_ID,
            redirect_uri: env.OAUTH_REDIRECT_URI,
            response_type: "code",
            scope: "openid profile email",
            state: state,
        });

        const authorizationUrl = `${config.authorization_endpoint}?${params.toString()}`;
        res.redirect(authorizationUrl);
    } catch (error) {
        throw new AppError(
            `Failed to initiate login: ${error instanceof Error ? error.message : String(error)}`,
            500,
        );
    }
}

export async function callbackHandler(req: Request, res: Response) {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
        throw new AppError("Authorization code is missing or invalid", 400);
    }

    try {
        const config = await getOIDCConfig();

        const tokenResponse = await axios.post<{
            access_token: string;
            id_token: string;
            refresh_token?: string;
            expires_in: number;
        }>(config.token_endpoint, {
            grant_type: "authorization_code",
            code,
            client_id: env.OAUTH_CLIENT_ID,
            client_secret: env.OAUTH_CLIENT_SECRET,
            redirect_uri: env.OAUTH_REDIRECT_URI,
        });

        const { id_token } = tokenResponse.data;

        const claims = await verifyIDToken(id_token);

        const user = extractUserClaims(claims);

        res.cookie("id_token", id_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: (claims.exp - claims.iat) * 1000,
        });

        res.redirect("/");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new AppError(
            `Failed to complete authentication: ${message}`,
            500,
        );
    }
}

export function logoutHandler(req: Request, res: Response): void {
    res.clearCookie("id_token");

    res.redirect("/");
}

export async function meHandler(req: Request, res: Response) {
    try {
        const token = req.cookies?.id_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }

        const claims = await verifyIDToken(token);
        const user = extractUserClaims(claims);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}
