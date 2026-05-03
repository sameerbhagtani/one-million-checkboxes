import { Socket } from "socket.io";
import { verifyIDToken, extractUserClaims } from "../config/oidc.js";

export interface AuthenticatedSocket extends Socket {
    user?: {
        userId: string;
        name?: string | undefined;
        email?: string | undefined;
    } | null;
}

export async function socketAuthMiddleware(
    socket: AuthenticatedSocket,
    next: Function,
) {
    try {
        const cookieHeader = socket.handshake.headers.cookie;

        if (!cookieHeader) {
            socket.user = null;
            return next();
        }

        const cookies = cookieHeader
            .split("; ")
            .map((cookie) => {
                const parts = cookie.split("=");
                const key = parts[0];
                const value = parts.slice(1).join("=");
                return [key, value];
            })
            .reduce(
                (acc, [key, value]) => {
                    if (key && value) {
                        acc[key] = decodeURIComponent(value);
                    }
                    return acc;
                },
                {} as Record<string, string>,
            );

        const token = cookies["id_token"];

        if (!token) {
            socket.user = null;
            return next();
        }

        const claims = await verifyIDToken(token);
        socket.user = extractUserClaims(claims);

        next();
    } catch (error) {
        socket.user = null;
        next();
    }
}
