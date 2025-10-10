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
exports.CierreComposicionTipo = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
const tipo_incendio_entity_1 = require("./catalogos/tipo-incendio.entity");
let CierreComposicionTipo = class CierreComposicionTipo {
    incendio_uuid;
    tipo_incendio_id;
    incendio;
    tipo_incendio;
    pct;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.CierreComposicionTipo = CierreComposicionTipo;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid', name: 'incendio_uuid' }),
    __metadata("design:type", String)
], CierreComposicionTipo.prototype, "incendio_uuid", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'text', name: 'tipo_incendio_id' }),
    __metadata("design:type", String)
], CierreComposicionTipo.prototype, "tipo_incendio_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_comp_tipo_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], CierreComposicionTipo.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tipo_incendio_entity_1.TipoIncendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tipo_incendio_id', referencedColumnName: 'tipo_incendio_id', foreignKeyConstraintName: 'fk_comp_tipo_tipo' }),
    __metadata("design:type", tipo_incendio_entity_1.TipoIncendio)
], CierreComposicionTipo.prototype, "tipo_incendio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', default: 0 }),
    __metadata("design:type", String)
], CierreComposicionTipo.prototype, "pct", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreComposicionTipo.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreComposicionTipo.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], CierreComposicionTipo.prototype, "eliminado_en", void 0);
exports.CierreComposicionTipo = CierreComposicionTipo = __decorate([
    (0, typeorm_1.Entity)('cierre_composicion_tipo')
], CierreComposicionTipo);
