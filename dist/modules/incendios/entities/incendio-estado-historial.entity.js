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
exports.IncendioEstadoHistorial = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("./incendio.entity");
const estado_incendio_entity_1 = require("../../catalogos/entities/estado-incendio.entity");
const usuario_entity_1 = require("../../seguridad/entities/usuario.entity");
let IncendioEstadoHistorial = class IncendioEstadoHistorial {
    historial_uuid;
    incendio;
    estado_incendio;
    cambiado_por;
    observacion;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.IncendioEstadoHistorial = IncendioEstadoHistorial;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'historial_uuid' }),
    __metadata("design:type", String)
], IncendioEstadoHistorial.prototype, "historial_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_historial_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], IncendioEstadoHistorial.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => estado_incendio_entity_1.EstadoIncendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'estado_incendio_uuid', referencedColumnName: 'estado_incendio_uuid', foreignKeyConstraintName: 'fk_historial_estado_uuid' }),
    __metadata("design:type", estado_incendio_entity_1.EstadoIncendio)
], IncendioEstadoHistorial.prototype, "estado_incendio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'cambiado_por', referencedColumnName: 'usuario_uuid', foreignKeyConstraintName: 'fk_historial_cambiado_por' }),
    __metadata("design:type", Object)
], IncendioEstadoHistorial.prototype, "cambiado_por", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], IncendioEstadoHistorial.prototype, "observacion", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], IncendioEstadoHistorial.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], IncendioEstadoHistorial.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], IncendioEstadoHistorial.prototype, "eliminado_en", void 0);
exports.IncendioEstadoHistorial = IncendioEstadoHistorial = __decorate([
    (0, typeorm_1.Index)('idx_historial_incendio_fecha', ['incendio', 'creado_en']),
    (0, typeorm_1.Entity)('incendio_estado_historial')
], IncendioEstadoHistorial);
