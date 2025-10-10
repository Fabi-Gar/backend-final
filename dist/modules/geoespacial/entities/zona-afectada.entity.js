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
exports.ZonaAfectada = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
let ZonaAfectada = class ZonaAfectada {
    zona_afectada_uuid;
    incendio;
    geom;
    fecha;
    fuente;
    metodo;
    area_ha; // se calculará por trigger
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.ZonaAfectada = ZonaAfectada;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'zona_afectada_uuid' }),
    __metadata("design:type", String)
], ZonaAfectada.prototype, "zona_afectada_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_zonas_afectadas_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], ZonaAfectada.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'geometry', spatialFeatureType: 'MultiPolygon', srid: 4326 }),
    __metadata("design:type", Object)
], ZonaAfectada.prototype, "geom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ZonaAfectada.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ZonaAfectada.prototype, "fuente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ZonaAfectada.prototype, "metodo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Object)
], ZonaAfectada.prototype, "area_ha", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], ZonaAfectada.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], ZonaAfectada.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], ZonaAfectada.prototype, "eliminado_en", void 0);
exports.ZonaAfectada = ZonaAfectada = __decorate([
    (0, typeorm_1.Entity)('zonas_afectadas'),
    (0, typeorm_1.Index)('idx_zonas_afectadas_incendio_fecha', ['incendio', 'fecha'])
], ZonaAfectada);
