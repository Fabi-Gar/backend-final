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
exports.Incendio = void 0;
const typeorm_1 = require("typeorm");
const usuario_entity_1 = require("../../seguridad/entities/usuario.entity");
const estado_incendio_entity_1 = require("../../catalogos/entities/estado-incendio.entity");
const info_falsa_incendio_entity_1 = require("../../responsable/entities/info-falsa-incendio.entity");
let Incendio = class Incendio {
    incendio_uuid;
    creado_por;
    requiere_aprobacion;
    aprobado;
    aprobado_por;
    aprobado_en;
    rechazado_por;
    rechazado_en;
    motivo_rechazo;
    titulo;
    descripcion;
    centroide;
    estado_incendio;
    info_falsa;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.Incendio = Incendio;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'incendio_uuid' }),
    __metadata("design:type", String)
], Incendio.prototype, "incendio_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'creado_por_uuid', referencedColumnName: 'usuario_uuid', foreignKeyConstraintName: 'fk_incendios_creado_por_uuid' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], Incendio.prototype, "creado_por", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Incendio.prototype, "requiere_aprobacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Incendio.prototype, "aprobado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'aprobado_por', referencedColumnName: 'usuario_uuid', foreignKeyConstraintName: 'fk_incendios_aprobado_por' }),
    __metadata("design:type", Object)
], Incendio.prototype, "aprobado_por", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Incendio.prototype, "aprobado_en", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'rechazado_por', referencedColumnName: 'usuario_uuid', foreignKeyConstraintName: 'fk_incendios_rechazado_por' }),
    __metadata("design:type", Object)
], Incendio.prototype, "rechazado_por", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Incendio.prototype, "rechazado_en", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Incendio.prototype, "motivo_rechazo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Incendio.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Incendio.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326, nullable: true }),
    __metadata("design:type", Object)
], Incendio.prototype, "centroide", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => estado_incendio_entity_1.EstadoIncendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'estado_incendio_uuid', referencedColumnName: 'estado_incendio_uuid', foreignKeyConstraintName: 'fk_incendios_estado' }),
    __metadata("design:type", estado_incendio_entity_1.EstadoIncendio)
], Incendio.prototype, "estado_incendio", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => info_falsa_incendio_entity_1.InfoFalsaIncendio, (f) => f.incendio),
    __metadata("design:type", Object)
], Incendio.prototype, "info_falsa", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], Incendio.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], Incendio.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], Incendio.prototype, "eliminado_en", void 0);
exports.Incendio = Incendio = __decorate([
    (0, typeorm_1.Index)('idx_incendios_estado_aprobado', ['estado_incendio', 'aprobado']),
    (0, typeorm_1.Entity)('incendios')
], Incendio);
