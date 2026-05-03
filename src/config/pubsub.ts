import { createClient } from "redis";
import env from "../env.js";

const TOGGLE_CHANNEL = "checkboxes:toggle";

const subscriber = createClient({
    url: env.REDIS_URL,
});

const publisher = createClient({
    url: env.REDIS_URL,
});

subscriber.on("error", (err) => {
    console.error(`Redis pub/sub subscriber error: ${err}`);
});

publisher.on("error", (err) => {
    console.error(`Redis pub/sub publisher error: ${err}`);
});

export async function connectPubSub() {
    if (!publisher.isOpen) {
        await publisher.connect();
        console.log("✅ Redis pub/sub publisher connected");
    }

    if (!subscriber.isOpen) {
        await subscriber.connect();
        console.log("✅ Redis pub/sub subscriber connected");
    }
}

export type TogglePayload = { id: number; origin?: string };

export async function subscribeToPubSub(
    onToggle: (payload: TogglePayload) => void,
) {
    await connectPubSub();

    await subscriber.subscribe(TOGGLE_CHANNEL, (message) => {
        try {
            const payload = JSON.parse(message) as TogglePayload;
            if (typeof payload?.id === "number") {
                onToggle(payload);
            }
        } catch (err) {
            console.error(`Failed to parse pub/sub message: ${err}`);
        }
    });

    console.log(`✅ Subscribed to channel: ${TOGGLE_CHANNEL}`);
}

export async function publishToggleEvent(payload: TogglePayload) {
    try {
        if (!publisher.isOpen) {
            await publisher.connect();
            console.log("✅ Redis pub/sub publisher connected (lazy)");
        }

        await publisher.publish(TOGGLE_CHANNEL, JSON.stringify(payload));
    } catch (err) {
        console.error(`Failed to publish toggle event: ${err}`);
    }
}

export async function disconnectPubSub() {
    if (subscriber.isOpen) {
        await subscriber.quit();
        console.log("✅ Redis pub/sub subscriber disconnected");
    }
    if (publisher.isOpen) {
        await publisher.quit();
        console.log("✅ Redis pub/sub publisher disconnected");
    }
}
