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
exports.FotoReporte = void 0;
const typeorm_1 = require("typeorm");
const reporte_entity_1 = require("./reporte.entity");
let FotoReporte = class FotoReporte {
    foto_reporte_uuid;
    reporte;
    url;
    credito;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.FotoReporte = FotoReporte;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'foto_reporte_uuid' }),
    __metadata("design:type", String)
], FotoReporte.prototype, "foto_reporte_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reporte_entity_1.Reporte, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'reporte_uuid', referencedColumnName: 'reporte_uuid', foreignKeyConstraintName: 'fk_fotos_reporte_reporte_uuid' }),
    __metadata("design:type", reporte_entity_1.Reporte)
], FotoReporte.prototype, "reporte", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], FotoReporte.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], FotoReporte.prototype, "credito", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], FotoReporte.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], FotoReporte.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], FotoReporte.prototype, "eliminado_en", void 0);
exports.FotoReporte = FotoReporte = __decorate([
    (0, typeorm_1.Index)('idx_fotos_reporte_reporte', ['reporte']),
    (0, typeorm_1.Entity)('fotos_reporte')
], FotoReporte);
