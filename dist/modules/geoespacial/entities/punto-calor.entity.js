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
exports.PuntoCalor = void 0;
// src/modules/firms/entities/punto-calor.entity.ts (tu archivo)
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
let PuntoCalor = class PuntoCalor {
    punto_calor_uuid;
    fuente;
    instrument;
    satellite;
    version;
    acq_date;
    acq_time;
    daynight;
    confidence;
    frp;
    brightness;
    bright_ti4;
    bright_ti5;
    scan;
    track;
    geom;
    region;
    hash_dedupe;
    incendio;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.PuntoCalor = PuntoCalor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'punto_calor_uuid' }),
    __metadata("design:type", String)
], PuntoCalor.prototype, "punto_calor_uuid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], PuntoCalor.prototype, "fuente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], PuntoCalor.prototype, "instrument", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], PuntoCalor.prototype, "satellite", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], PuntoCalor.prototype, "acq_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PuntoCalor.prototype, "acq_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "daynight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "frp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "brightness", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "bright_ti4", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "bright_ti5", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "scan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "track", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "geom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "hash_dedupe", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_puntos_calor_incendio_uuid' }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], PuntoCalor.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], PuntoCalor.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], PuntoCalor.prototype, "eliminado_en", void 0);
exports.PuntoCalor = PuntoCalor = __decorate([
    (0, typeorm_1.Entity)('puntos_calor'),
    (0, typeorm_1.Index)('idx_puntos_calor_fecha', ['acq_date'])
], PuntoCalor);
