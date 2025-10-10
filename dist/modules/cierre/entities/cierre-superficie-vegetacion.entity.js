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
exports.CierreSuperficieVegetacion = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
let CierreSuperficieVegetacion = class CierreSuperficieVegetacion {
    superficie_vegetacion_uuid;
    incendio;
    ubicacion;
    categoria;
    subtipo;
    area_ha;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.CierreSuperficieVegetacion = CierreSuperficieVegetacion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'superficie_vegetacion_uuid' }),
    __metadata("design:type", String)
], CierreSuperficieVegetacion.prototype, "superficie_vegetacion_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_superficie_veg_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], CierreSuperficieVegetacion.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CierreSuperficieVegetacion.prototype, "ubicacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CierreSuperficieVegetacion.prototype, "categoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CierreSuperficieVegetacion.prototype, "subtipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', default: 0 }),
    __metadata("design:type", String)
], CierreSuperficieVegetacion.prototype, "area_ha", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreSuperficieVegetacion.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreSuperficieVegetacion.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], CierreSuperficieVegetacion.prototype, "eliminado_en", void 0);
exports.CierreSuperficieVegetacion = CierreSuperficieVegetacion = __decorate([
    (0, typeorm_1.Entity)('cierre_superficie_vegetacion'),
    (0, typeorm_1.Index)('idx_superficie_veg_incendio_categoria', ['incendio', 'categoria'])
], CierreSuperficieVegetacion);
