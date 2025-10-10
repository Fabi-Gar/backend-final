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
exports.Municipio = void 0;
const typeorm_1 = require("typeorm");
const departamento_entity_1 = require("./departamento.entity");
let Municipio = class Municipio {
    municipio_uuid;
    departamento;
    nombre;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.Municipio = Municipio;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'municipio_uuid' }),
    __metadata("design:type", String)
], Municipio.prototype, "municipio_uuid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => departamento_entity_1.Departamento, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'departamento_uuid', referencedColumnName: 'departamento_uuid', foreignKeyConstraintName: 'fk_municipios_departamento_uuid' }),
    __metadata("design:type", departamento_entity_1.Departamento)
], Municipio.prototype, "departamento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Municipio.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], Municipio.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], Municipio.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], Municipio.prototype, "eliminado_en", void 0);
exports.Municipio = Municipio = __decorate([
    (0, typeorm_1.Index)('uq_municipios_depto_nombre', ['departamento', 'nombre'], { unique: true }),
    (0, typeorm_1.Index)('idx_municipios_depto_nombre', ['departamento', 'nombre']),
    (0, typeorm_1.Entity)('municipios')
], Municipio);
