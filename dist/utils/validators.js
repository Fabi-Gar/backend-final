"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fechaRango = exports.point4326 = void 0;
exports.sumMax100 = sumMax100;
// src/utils/validators.ts
const zod_1 = require("zod");
exports.point4326 = zod_1.z.object({
    type: zod_1.z.literal('Point'),
    coordinates: zod_1.z.tuple([zod_1.z.number().min(-180).max(180), zod_1.z.number().min(-90).max(90)])
});
exports.fechaRango = zod_1.z.object({
    inicio: zod_1.z.coerce.date(),
    fin: zod_1.z.coerce.date()
}).refine(v => v.fin >= v.inicio, { message: 'fin < inicio', path: ['fin'] });
function sumMax100(obj) {
    const s = Object.values(obj).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
    return s <= 100;
}
