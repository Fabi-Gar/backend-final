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
exports.Actualizacion = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
const usuario_entity_1 = require("../../seguridad/entities/usuario.entity");
const incendio_estado_historial_entity_1 = require("../../incendios/entities/incendio-estado-historial.entity");
const reporte_entity_1 = require("../../incendios/entities/reporte.entity");
const foto_reporte_entity_1 = require("../../incendios/entities/foto-reporte.entity");
const incendio_registro_responsable_entity_1 = require("../../responsable/entities/incendio-registro-responsable.entity");
const cierre_operaciones_entity_1 = require("../../cierre/entities/cierre-operaciones.entity");
const zona_afectada_entity_1 = require("../../geoespacial/entities/zona-afectada.entity");
const punto_calor_entity_1 = require("../../geoespacial/entities/punto-calor.entity");
const cierre_eventos_operativos_entity_1 = require("../../eventos/entities/cierre-eventos-operativos.entity");
let Actualizacion = class Actualizacion {
    actualizacion_uuid;
    incendio;
    tipo;
    descripcion_corta;
    creado_por;
    creado_en;
    // Referencias opcionales
    historial;
    reporte;
    foto_reporte;
    responsable;
    cierre;
    zona_afectada;
    punto_calor;
    evento_operativo;
    actualizado_en;
    eliminado_en;
};
exports.Actualizacion = Actualizacion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'actualizacion_uuid' }),
    __metadata("design:type", String)
], Actualizacion.prototype, "actualizacion_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_actualizaciones_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], Actualizacion.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Actualizacion.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "descripcion_corta", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'creado_por', referencedColumnName: 'usuario_uuid', foreignKeyConstraintName: 'fk_actualizaciones_creado_por' }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "creado_por", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date
    // Referencias opcionales
    )
], Actualizacion.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_estado_historial_entity_1.IncendioEstadoHistorial, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'historial_uuid', referencedColumnName: 'historial_uuid', foreignKeyConstraintName: 'fk_actualizaciones_historial_uuid' }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "historial", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reporte_entity_1.Reporte, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'reporte_uuid', referencedColumnName: 'reporte_uuid', foreignKeyConstraintName: 'fk_actualizaciones_reporte_uuid' }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "reporte", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => foto_reporte_entity_1.FotoReporte, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'foto_reporte_uuid', referencedColumnName: 'foto_reporte_uuid', foreignKeyConstraintName: 'fk_actualizaciones_foto_reporte_uuid' }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "foto_reporte", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_registro_responsable_entity_1.IncendioRegistroResponsable, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'responsable_incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_actualizaciones_responsable_uuid' }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "responsable", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cierre_operaciones_entity_1.CierreOperaciones, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'cierre_incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_actualizaciones_cierre_uuid' }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "cierre", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zona_afectada_entity_1.ZonaAfectada, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'zona_afectada_uuid', referencedColumnName: 'zona_afectada_uuid', foreignKeyConstraintName: 'fk_actualizaciones_zona_uuid' }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "zona_afectada", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => punto_calor_entity_1.PuntoCalor, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'punto_calor_uuid', referencedColumnName: 'punto_calor_uuid', foreignKeyConstraintName: 'fk_actualizaciones_punto_calor_uuid' }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "punto_calor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cierre_eventos_operativos_entity_1.CierreEventosOperativos, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'evento_operativo_uuid', referencedColumnName: 'evento_operativo_uuid', foreignKeyConstraintName: 'fk_actualizaciones_evento_operativo_uuid' }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "evento_operativo", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], Actualizacion.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], Actualizacion.prototype, "eliminado_en", void 0);
exports.Actualizacion = Actualizacion = __decorate([
    (0, typeorm_1.Entity)('actualizaciones'),
    (0, typeorm_1.Index)('idx_actualizaciones_incendio_fecha', ['incendio', 'creado_en']),
    (0, typeorm_1.Index)('idx_actualizaciones_creado_en', ['creado_en'])
], Actualizacion);
