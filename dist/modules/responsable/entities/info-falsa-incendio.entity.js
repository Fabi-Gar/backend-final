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
exports.InfoFalsaIncendio = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
const institucion_entity_1 = require("../../seguridad/entities/institucion.entity");
let InfoFalsaIncendio = class InfoFalsaIncendio {
    info_falsa_uuid;
    incendio;
    institucion_validadora;
    razon;
    descripcion_detallada;
    validador_nombre;
    validador_contacto;
    fecha_verificacion;
    ubicacion_verificada;
    duplicado_de_incendio_uuid;
    score_confianza;
    creado_en;
    actualizado_en;
};
exports.InfoFalsaIncendio = InfoFalsaIncendio;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InfoFalsaIncendio.prototype, "info_falsa_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, (i) => i.info_falsa, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], InfoFalsaIncendio.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => institucion_entity_1.Institucion, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'institucion_validadora_uuid' }),
    __metadata("design:type", Object)
], InfoFalsaIncendio.prototype, "institucion_validadora", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InfoFalsaIncendio.prototype, "razon", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InfoFalsaIncendio.prototype, "descripcion_detallada", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], InfoFalsaIncendio.prototype, "validador_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], InfoFalsaIncendio.prototype, "validador_contacto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], InfoFalsaIncendio.prototype, "fecha_verificacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326, nullable: true }),
    __metadata("design:type", Object)
], InfoFalsaIncendio.prototype, "ubicacion_verificada", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], InfoFalsaIncendio.prototype, "duplicado_de_incendio_uuid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], InfoFalsaIncendio.prototype, "score_confianza", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], InfoFalsaIncendio.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], InfoFalsaIncendio.prototype, "actualizado_en", void 0);
exports.InfoFalsaIncendio = InfoFalsaIncendio = __decorate([
    (0, typeorm_1.Entity)('info_falsa_incendio')
], InfoFalsaIncendio);
