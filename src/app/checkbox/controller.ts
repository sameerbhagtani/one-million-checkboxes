import { getCheckboxRange, getCheckedCheckboxCount } from "./service.js";
import { checkboxQuerySchema } from "./schema.js";
import AppError from "../../utils/AppError.js";

import type { Request, Response } from "express";

export async function handleGetCheckboxRange(req: Request, res: Response) {
    const parseResult = checkboxQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
        throw new AppError("Invalid query parameters", 400);
    }

    const { offset, limit } = parseResult.data;

    const items = await getCheckboxRange(offset, limit);

    return res.status(200).json({
        success: true,
        data: {
            offset,
            limit,
            items,
        },
    });
}

export async function handleGetCheckedCheckboxCount(
    req: Request,
    res: Response,
) {
    const count = await getCheckedCheckboxCount();

    return res.status(200).json({
        success: true,
        data: {
            count,
        },
    });
}
