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
exports.CierreEventosOperativos = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
const usuario_entity_1 = require("../../seguridad/entities/usuario.entity");
let CierreEventosOperativos = class CierreEventosOperativos {
    evento_operativo_uuid;
    incendio;
    tipo_evento;
    categoria;
    recurso_id;
    ocurrio_en;
    nota;
    creado_por;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.CierreEventosOperativos = CierreEventosOperativos;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'evento_operativo_uuid' }),
    __metadata("design:type", String)
], CierreEventosOperativos.prototype, "evento_operativo_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_eventos_operativos_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], CierreEventosOperativos.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CierreEventosOperativos.prototype, "tipo_evento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CierreEventosOperativos.prototype, "categoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CierreEventosOperativos.prototype, "recurso_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CierreEventosOperativos.prototype, "ocurrio_en", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CierreEventosOperativos.prototype, "nota", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'creado_por', referencedColumnName: 'usuario_uuid', foreignKeyConstraintName: 'fk_eventos_operativos_creado_por' }),
    __metadata("design:type", Object)
], CierreEventosOperativos.prototype, "creado_por", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreEventosOperativos.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreEventosOperativos.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], CierreEventosOperativos.prototype, "eliminado_en", void 0);
exports.CierreEventosOperativos = CierreEventosOperativos = __decorate([
    (0, typeorm_1.Entity)('cierre_eventos_operativos'),
    (0, typeorm_1.Index)('idx_eventos_operativos_incendio_fecha', ['incendio', 'ocurrio_en'])
], CierreEventosOperativos);
