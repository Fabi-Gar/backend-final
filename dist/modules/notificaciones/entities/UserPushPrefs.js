"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPushPrefs = void 0;
// src/modules/notificaciones/entities/UserPushPrefs.ts
const typeorm_1 = require("typeorm");
const UserPushToken_1 = require("./UserPushToken");
let UserPushPrefs = class UserPushPrefs {
    id;
    userId;
    // Municipios suscritos (códigos de municipio)
    municipiosSuscritos;
    // Departamentos suscritos (códigos de departamento) - OPCIONAL
    departamentosSuscritos;
    // Avisar cuando aprueben mis reportes
    avisarmeAprobado;
    // Avisar cuando actualicen incendios que sigo
    avisarmeActualizaciones;
    // Avisar cuando cierren incendios que sigo
    avisarmeCierres;
    // Extra data (para futuras features)
    extra;
    createdAt;
    updatedAt;
    tokens;
};
exports.UserPushPrefs = UserPushPrefs;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserPushPrefs.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_user_push_prefs_user_id'),
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], UserPushPrefs.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { name: 'municipios_suscritos', array: true, default: '{}' }),
    __metadata("design:type", Array)
], UserPushPrefs.prototype, "municipiosSuscritos", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { name: 'departamentos_suscritos', array: true, default: '{}' }),
    __metadata("design:type", Array)
], UserPushPrefs.prototype, "departamentosSuscritos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avisarme_aprobado', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], UserPushPrefs.prototype, "avisarmeAprobado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avisarme_actualizaciones', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], UserPushPrefs.prototype, "avisarmeActualizaciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avisarme_cierres', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], UserPushPrefs.prototype, "avisarmeCierres", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extra', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserPushPrefs.prototype, "extra", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], UserPushPrefs.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], UserPushPrefs.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserPushToken_1.UserPushToken, (t) => t.prefs, { cascade: true }),
    __metadata("design:type", Array)
], UserPushPrefs.prototype, "tokens", void 0);
exports.UserPushPrefs = UserPushPrefs = __decorate([
    (0, typeorm_1.Entity)({ name: 'user_push_prefs' }),
    (0, typeorm_1.Unique)(['userId'])
], UserPushPrefs);
