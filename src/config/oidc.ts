import axios from "axios";
import { jwtVerify, createRemoteJWKSet } from "jose";
import env from "../env.js";

interface OpenIDConfig {
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    jwks_uri: string;
    issuer: string;
}

interface UserClaims {
    sub: string;
    name?: string;
    email?: string;
    iat: number;
    exp: number;
}

let cachedConfig: OpenIDConfig | null = null;
let cachedConfigTime: number = 0;
const CONFIG_CACHE_TTL = 3600000;

export async function getOIDCConfig(): Promise<OpenIDConfig> {
    const now = Date.now();

    if (cachedConfig && now - cachedConfigTime < CONFIG_CACHE_TTL) {
        return cachedConfig;
    }

    try {
        const response = await axios.get<OpenIDConfig>(env.OAUTH_DISCOVERY_URL);
        cachedConfig = response.data;
        cachedConfigTime = now;
        return response.data;
    } catch (error) {
        throw new Error(
            `Failed to fetch OpenID configuration: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

export async function verifyIDToken(token: string): Promise<UserClaims> {
    try {
        const config = await getOIDCConfig();

        const jwks = createRemoteJWKSet(new URL(config.jwks_uri));

        const verified = await jwtVerify(token, jwks, {
            issuer: config.issuer,
            audience: env.OAUTH_CLIENT_ID,
        });

        return verified.payload as UserClaims;
    } catch (error) {
        throw new Error(
            `Failed to verify ID token: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

export function extractUserClaims(payload: UserClaims): {
    userId: string;
    name?: string | undefined;
    email?: string | undefined;
} {
    return {
        userId: payload.sub,
        name: payload.name,
        email: payload.email,
    };
}
