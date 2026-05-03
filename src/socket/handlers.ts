import { type Server } from "socket.io";
import { toggleCheckbox } from "../app/checkbox/service.js";
import { checkboxTogglePayloadSchema } from "../app/checkbox/schema.js";
import { enforceToggleRateLimit } from "../app/checkbox/toggleRateLimiter.js";
import { publishToggleEvent } from "../config/pubsub.js";
import { type AuthenticatedSocket } from "../middlewares/socketAuthMiddleware.js";

export default function registerSocketHandlers(io: Server) {
    io.on("connection", (socket: AuthenticatedSocket) => {
        console.log(`New socket connected : ${socket.id}`);

        socket.on("client:toggled", async (payload: unknown) => {
            try {
                if (!socket.user) {
                    socket.emit("server:error", {
                        code: "AUTH_REQUIRED",
                        message: "Authentication required to toggle checkbox",
                    });
                    return;
                }

                const parseResult =
                    checkboxTogglePayloadSchema.safeParse(payload);
                if (!parseResult.success) {
                    socket.emit("server:error", {
                        code: "INVALID_PAYLOAD",
                        message: "Invalid toggle payload",
                    });
                    return;
                }

                const { id } = parseResult.data;

                const rateLimitResult = await enforceToggleRateLimit(
                    socket.user.userId,
                );
                if (!rateLimitResult.allowed) {
                    socket.emit("server:error", {
                        code: "RATE_LIMITED",
                        id,
                        message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfterSeconds}s`,
                    });
                    return;
                }

                await toggleCheckbox(id);

                await publishToggleEvent({ id, origin: socket.id });
            } catch (err) {
                console.error(err);
                socket.emit("server:error", {
                    code: "TOGGLE_FAILED",
                    message: "Unable to toggle checkbox",
                });
            }
        });
    });
}
