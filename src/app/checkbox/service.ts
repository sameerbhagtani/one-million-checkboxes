import redis from "../../config/redis.js";
import AppError from "../../utils/AppError.js";

const KEY = "checkboxes";
export const TOTAL_CHECKBOXES = 1_000_000;
const REQUIRED_BYTES = Math.ceil(TOTAL_CHECKBOXES / 8);

export async function initializeCheckboxes() {
    const exists = await redis.exists(KEY);

    if (!exists) {
        await redis.setBit(KEY, TOTAL_CHECKBOXES - 1, 0);
        return;
    }

    const lengthBytesRaw = await redis.sendCommand(["STRLEN", KEY]);
    const lengthBytes = Number(lengthBytesRaw);

    if (!Number.isFinite(lengthBytes) || lengthBytes < REQUIRED_BYTES) {
        await redis.setBit(KEY, TOTAL_CHECKBOXES - 1, 0);
    }
}

export async function getCheckboxRange(
    offset: number,
    limit: number,
): Promise<boolean[]> {
    const end = Math.min(offset + limit, TOTAL_CHECKBOXES);
    if (offset >= end) return [];

    const command: string[] = ["BITFIELD", KEY];

    for (let i = offset; i < end; i++) {
        command.push("GET", "u1", String(i));
    }

    const bits = await redis.sendCommand(command);

    if (!Array.isArray(bits)) return [];

    return bits.map((value) => Number(value) === 1);
}

export async function getCheckedCheckboxCount(): Promise<number> {
    const checkedCountRaw = await redis.sendCommand(["BITCOUNT", KEY]);
    const checkedCount = Number(checkedCountRaw);

    if (!Number.isInteger(checkedCount)) {
        throw new AppError("Unexpected Redis bitcount response");
    }

    return checkedCount;
}

export async function toggleCheckbox(index: number) {
    const result = await redis.sendCommand([
        "BITFIELD",
        KEY,
        "OVERFLOW",
        "WRAP",
        "INCRBY",
        "u1",
        String(index),
        "1",
    ]);

    if (!Array.isArray(result) || result.length === 0)
        throw new AppError("Unable to toggle checkbox bit");
}
