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
exports.CierreMediosTerrestres = void 0;
const typeorm_1 = require("typeorm");
const incendio_entity_1 = require("../../incendios/entities/incendio.entity");
const medios_terrestres_catalogo_entity_1 = require("./catalogos/medios-terrestres-catalogo.entity");
let CierreMediosTerrestres = class CierreMediosTerrestres {
    incendio_uuid;
    medio_terrestre_id;
    incendio;
    medio;
    cantidad;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.CierreMediosTerrestres = CierreMediosTerrestres;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid', name: 'incendio_uuid' }),
    __metadata("design:type", String)
], CierreMediosTerrestres.prototype, "incendio_uuid", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'text', name: 'medio_terrestre_id' }),
    __metadata("design:type", String)
], CierreMediosTerrestres.prototype, "medio_terrestre_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => incendio_entity_1.Incendio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_medios_terr_incendio_uuid' }),
    __metadata("design:type", incendio_entity_1.Incendio)
], CierreMediosTerrestres.prototype, "incendio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => medios_terrestres_catalogo_entity_1.MediosTerrestresCatalogo, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'medio_terrestre_id', referencedColumnName: 'medio_terrestre_id', foreignKeyConstraintName: 'fk_medios_terr_catalogo' }),
    __metadata("design:type", medios_terrestres_catalogo_entity_1.MediosTerrestresCatalogo)
], CierreMediosTerrestres.prototype, "medio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CierreMediosTerrestres.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreMediosTerrestres.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' }),
    __metadata("design:type", Date)
], CierreMediosTerrestres.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'eliminado_en', nullable: true }),
    __metadata("design:type", Object)
], CierreMediosTerrestres.prototype, "eliminado_en", void 0);
exports.CierreMediosTerrestres = CierreMediosTerrestres = __decorate([
    (0, typeorm_1.Entity)('cierre_medios_terrestres')
], CierreMediosTerrestres);
