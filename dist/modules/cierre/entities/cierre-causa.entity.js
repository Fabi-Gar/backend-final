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
exports.CierreCausa = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
const causas_catalogo_entity_1 = require("./catalogos/causas-catalogo.entity");
let CierreCausa = class CierreCausa {
    incendio_uuid;
    incendio;
    causa;
    otro_texto;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.CierreCausa = CierreCausa;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid', name: 'incendio_uuid' }),
    __metadata("design:type", String)
], CierreCausa.prototype, "incendio_uuid", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_cierre_causa_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], CierreCausa.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => causas_catalogo_entity_1.CausasCatalogo, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'causa_id', referencedColumnName: 'causa_id', foreignKeyConstraintName: 'fk_cierre_causa_catalogo' }),
    __metadata("design:type", causas_catalogo_entity_1.CausasCatalogo)
], CierreCausa.prototype, "causa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CierreCausa.prototype, "otro_texto", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreCausa.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreCausa.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], CierreCausa.prototype, "eliminado_en", void 0);
exports.CierreCausa = CierreCausa = __decorate([
    (0, typeorm_1.Entity)('cierre_causa')
], CierreCausa);
