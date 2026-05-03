import redis from "../../config/redis.js";
import env from "../../env.js";

const KEY_PREFIX = "rl:toggle:user";

export type ToggleRateLimitResult = {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
};

export async function enforceToggleRateLimit(
    userId: string,
): Promise<ToggleRateLimitResult> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const windowSeconds = env.TOGGLE_RATE_LIMIT_WINDOW_SECONDS;
    const requestLimit = env.TOGGLE_RATE_LIMIT_COUNT;

    const windowEpoch = Math.floor(nowSeconds / windowSeconds);
    const windowStart = windowEpoch * windowSeconds;
    const windowEnd = windowStart + windowSeconds;

    const retryAfterSeconds = Math.max(1, windowEnd - nowSeconds);
    const redisSafeUserId = encodeURIComponent(userId);
    const key = `${KEY_PREFIX}:${redisSafeUserId}:${windowEpoch}`;

    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, windowSeconds + 1);
    }

    if (count > requestLimit) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds,
        };
    }

    return {
        allowed: true,
        remaining: Math.max(0, requestLimit - count),
        retryAfterSeconds,
    };
}
