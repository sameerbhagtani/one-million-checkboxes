import { z } from "zod";
import { TOTAL_CHECKBOXES } from "./service.js";

export const checkboxQuerySchema = z.object({
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(1_000).default(500),
});

export const checkboxTogglePayloadSchema = z.object({
    id: z
        .number()
        .int()
        .min(0)
        .max(TOTAL_CHECKBOXES - 1),
});
