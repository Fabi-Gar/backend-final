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
exports.Reporte = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("./incendio.entity");
const usuario_entity_1 = require("../../seguridad/entities/usuario.entity");
const institucion_entity_1 = require("../../seguridad/entities/institucion.entity");
const medio_entity_1 = require("../../catalogos/entities/medio.entity");
const departamento_entity_1 = require("../../catalogos/entities/departamento.entity");
const municipio_entity_1 = require("../../catalogos/entities/municipio.entity");
let Reporte = class Reporte {
    reporte_uuid;
    incendio;
    reportado_por;
    reportado_por_nombre;
    institucion;
    telefono;
    reportado_en;
    medio;
    ubicacion;
    departamento;
    municipio;
    lugar_poblado;
    finca;
    observaciones;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.Reporte = Reporte;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'reporte_uuid' }),
    __metadata("design:type", String)
], Reporte.prototype, "reporte_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_reportes_incendio_uuid' }),
    __metadata("design:type", Object)
], Reporte.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'reportado_por_uuid', referencedColumnName: 'usuario_uuid', foreignKeyConstraintName: 'fk_reportes_reportado_por_uuid' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], Reporte.prototype, "reportado_por", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Reporte.prototype, "reportado_por_nombre", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => institucion_entity_1.Institucion, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'institucion_uuid', referencedColumnName: 'institucion_uuid', foreignKeyConstraintName: 'fk_reportes_institucion_uuid' }),
    __metadata("design:type", Object)
], Reporte.prototype, "institucion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Reporte.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Reporte.prototype, "reportado_en", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => medio_entity_1.Medio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'medio_uuid', referencedColumnName: 'medio_uuid', foreignKeyConstraintName: 'fk_reportes_medio_uuid' }),
    __metadata("design:type", medio_entity_1.Medio)
], Reporte.prototype, "medio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 }),
    __metadata("design:type", Object)
], Reporte.prototype, "ubicacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => departamento_entity_1.Departamento, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'departamento_uuid', referencedColumnName: 'departamento_uuid', foreignKeyConstraintName: 'fk_reportes_departamento_uuid' }),
    __metadata("design:type", Object)
], Reporte.prototype, "departamento", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => municipio_entity_1.Municipio, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'municipio_uuid', referencedColumnName: 'municipio_uuid', foreignKeyConstraintName: 'fk_reportes_municipio_uuid' }),
    __metadata("design:type", Object)
], Reporte.prototype, "municipio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Reporte.prototype, "lugar_poblado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Reporte.prototype, "finca", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Reporte.prototype, "observaciones", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], Reporte.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], Reporte.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], Reporte.prototype, "eliminado_en", void 0);
exports.Reporte = Reporte = __decorate([
    (0, typeorm_1.Index)('idx_reportes_incendio', ['incendio']),
    (0, typeorm_1.Index)('idx_reportes_reportado_en', ['reportado_en']),
    (0, typeorm_1.Entity)('reportes')
], Reporte);
