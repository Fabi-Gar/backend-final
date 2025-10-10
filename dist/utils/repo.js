"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeFind = activeFind;
exports.activeFindOne = activeFindOne;
exports.softRemoveById = softRemoveById;
const typeorm_1 = require("typeorm");
function activeFind(repo, options = {}) {
    const where = options.where || {};
    if (where.eliminado_en === undefined)
        where.eliminado_en = (0, typeorm_1.IsNull)();
    return repo.find({ ...options, where });
}
function activeFindOne(repo, options = {}) {
    const where = options.where || {};
    if (where.eliminado_en === undefined)
        where.eliminado_en = (0, typeorm_1.IsNull)();
    return repo.findOne({ ...options, where });
}
async function softRemoveById(repo, idKey, id) {
    const ent = await repo.findOne({
        where: { [idKey]: id, eliminado_en: (0, typeorm_1.IsNull)() }
    });
    if (!ent)
        return null;
    ent.eliminado_en = new Date();
    return repo.save(ent);
}
