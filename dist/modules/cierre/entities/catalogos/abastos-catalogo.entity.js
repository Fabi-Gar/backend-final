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
exports.AbastosCatalogo = void 0;
const typeorm_1 = require("typeorm");
let AbastosCatalogo = class AbastosCatalogo {
    abasto_id;
    nombre;
    creado_en;
    actualizado_en;
    eliminado_en;
};
exports.AbastosCatalogo = AbastosCatalogo;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'text', name: 'abasto_id', default: () => 'uuid_generate_v4()' }),
    __metadata("design:type", String)
], AbastosCatalogo.prototype, "abasto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', unique: true }),
    __metadata("design:type", String)
], AbastosCatalogo.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'timestamptz',
        name: 'creado_en',
        default: () => 'now()',
    }),
    __metadata("design:type", Date)
], AbastosCatalogo.prototype, "creado_en", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'timestamptz',
        name: 'actualizado_en',
        default: () => 'now()',
    }),
    __metadata("design:type", Date)
], AbastosCatalogo.prototype, "actualizado_en", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({
        type: 'timestamptz',
        name: 'eliminado_en',
        nullable: true,
    }),
    __metadata("design:type", Object)
], AbastosCatalogo.prototype, "eliminado_en", void 0);
exports.AbastosCatalogo = AbastosCatalogo = __decorate([
    (0, typeorm_1.Entity)('abastos_catalogo')
], AbastosCatalogo);
