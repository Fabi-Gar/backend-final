"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cierreCreateSchema = void 0;
const zod_1 = require("zod");
const percentMap = zod_1.z.record(zod_1.z.string(), zod_1.z.number().min(0));
function sumMax100(map) {
    const sum = Object.values(map || {}).reduce((a, b) => a + (Number.isFinite(b) ? Number(b) : 0), 0);
    return sum <= 100;
}
exports.cierreCreateSchema = zod_1.z.object({
    incendio_uuid: zod_1.z.string().uuid(),
    topografia: percentMap.refine(sumMax100, { message: 'topografia suma > 100' }),
    tecnicas: percentMap.refine(sumMax100, { message: 'tecnicas suma > 100' }),
    composicion: percentMap.refine(sumMax100, { message: 'composicion suma > 100' })
});
