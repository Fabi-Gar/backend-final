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
exports.CierreIniciadoJuntoA = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
const iniciado_junto_a_catalogo_entity_1 = require("./catalogos/iniciado-junto-a-catalogo.entity");
let CierreIniciadoJuntoA = class CierreIniciadoJuntoA {
    incendio_uuid;
    incendio;
    iniciado;
    otro_texto;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.CierreIniciadoJuntoA = CierreIniciadoJuntoA;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid', name: 'incendio_uuid' }),
    __metadata("design:type", String)
], CierreIniciadoJuntoA.prototype, "incendio_uuid", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_cierre_iniciado_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], CierreIniciadoJuntoA.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => iniciado_junto_a_catalogo_entity_1.IniciadoJuntoACatalogo, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'iniciado_id', referencedColumnName: 'iniciado_id', foreignKeyConstraintName: 'fk_cierre_iniciado_catalogo' }),
    __metadata("design:type", iniciado_junto_a_catalogo_entity_1.IniciadoJuntoACatalogo)
], CierreIniciadoJuntoA.prototype, "iniciado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CierreIniciadoJuntoA.prototype, "otro_texto", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreIniciadoJuntoA.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreIniciadoJuntoA.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], CierreIniciadoJuntoA.prototype, "eliminado_en", void 0);
exports.CierreIniciadoJuntoA = CierreIniciadoJuntoA = __decorate([
    (0, typeorm_1.Entity)('cierre_iniciado_junto_a')
], CierreIniciadoJuntoA);
