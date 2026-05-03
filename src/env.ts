import "dotenv/config";
import { z } from "zod";
import AppError from "./utils/AppError.js";

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    REDIS_URL: z.url(),
    OAUTH_CLIENT_ID: z.string().min(1),
    OAUTH_CLIENT_SECRET: z.string().min(1),
    OAUTH_REDIRECT_URI: z.url(),
    OAUTH_DISCOVERY_URL: z.url(),
});

function createEnv(env: NodeJS.ProcessEnv) {
    const safeParseResult = envSchema.safeParse(env);

    if (!safeParseResult.success)
        throw new AppError(safeParseResult.error.message);

    return safeParseResult.data;
}

const env = createEnv(process.env);

export default env;
