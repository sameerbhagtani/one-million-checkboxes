import { createServer } from "node:http";
import createServerApplication from "./app/index.js";
import createSocketServer from "./socket/index.js";

import { connectRedis, disconnectRedis } from "./config/redis.js";
import { subscribeToPubSub, disconnectPubSub } from "./config/pubsub.js";
import { initializeCheckboxes } from "./app/checkbox/service.js";

import { promisify } from "node:util";
import env from "./env.js";

let isShuttingDown: boolean = false;

async function main() {
    try {
        await connectRedis();
        await initializeCheckboxes();

        const server = createServer(createServerApplication());
        const io = createSocketServer(server);

        await subscribeToPubSub((payload) => {
            io.emit("server:toggled", payload);
        });

        const closeServer = promisify(server.close.bind(server));

        async function shutdown(signal: string) {
            if (isShuttingDown) return;
            isShuttingDown = true;

            console.log(`\n${signal} received. Shutting down...`);

            io.close();
            await closeServer();
            console.log(`✅ Server stopped`);

            await disconnectPubSub();
            await disconnectRedis();
            process.exit(0);
        }

        process.once("SIGINT", () => {
            shutdown("SIGINT").catch((error) => {
                console.error(error);
                process.exit(1);
            });
        });

        process.once("SIGTERM", () => {
            shutdown("SIGTERM").catch((error) => {
                console.error(error);
                process.exit(1);
            });
        });

        const PORT: number = env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`✅ Server started at PORT: ${PORT}`);
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
