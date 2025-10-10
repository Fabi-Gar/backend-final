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
exports.CierreMediosInstituciones = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
const institucion_entity_1 = require("../../seguridad/entities/institucion.entity");
let CierreMediosInstituciones = class CierreMediosInstituciones {
    incendio_uuid;
    institucion_uuid;
    incendio;
    institucion;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.CierreMediosInstituciones = CierreMediosInstituciones;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid', name: 'incendio_uuid' }),
    __metadata("design:type", String)
], CierreMediosInstituciones.prototype, "incendio_uuid", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid', name: 'institucion_uuid' }),
    __metadata("design:type", String)
], CierreMediosInstituciones.prototype, "institucion_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_medios_inst_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], CierreMediosInstituciones.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => institucion_entity_1.Institucion, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'institucion_uuid', referencedColumnName: 'institucion_uuid', foreignKeyConstraintName: 'fk_medios_inst_institucion_uuid' }),
    __metadata("design:type", institucion_entity_1.Institucion)
], CierreMediosInstituciones.prototype, "institucion", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreMediosInstituciones.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreMediosInstituciones.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], CierreMediosInstituciones.prototype, "eliminado_en", void 0);
exports.CierreMediosInstituciones = CierreMediosInstituciones = __decorate([
    (0, typeorm_1.Entity)('cierre_medios_instituciones')
], CierreMediosInstituciones);
