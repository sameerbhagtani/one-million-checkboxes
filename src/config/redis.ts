import { createClient } from "redis";
import env from "../env.js";

const redis = createClient({
    url: env.REDIS_URL,
});

redis.on("error", (err) => {
    console.error(`Redis error: ${err}`);
});

export async function connectRedis() {
    await redis.connect();
    console.log("✅ Redis connected");
}

export async function disconnectRedis() {
    if (redis.isOpen) {
        await redis.quit();
        console.log("✅ Redis disconnected");
    }
}

export default redis;
