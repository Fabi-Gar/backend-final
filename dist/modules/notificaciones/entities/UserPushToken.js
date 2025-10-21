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
exports.UserPushToken = void 0;
const typeorm_1 = require("typeorm");
const UserPushPrefs_1 = require("./UserPushPrefs");
let UserPushToken = class UserPushToken {
    id;
    token;
    userId;
    prefs;
    prefsId;
    active;
    createdAt;
    updatedAt;
};
exports.UserPushToken = UserPushToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserPushToken.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_user_push_token_token'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], UserPushToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_user_push_token_user_id'),
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], UserPushToken.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserPushPrefs_1.UserPushPrefs, (p) => p.tokens, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'prefs_id' }),
    __metadata("design:type", UserPushPrefs_1.UserPushPrefs)
], UserPushToken.prototype, "prefs", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'prefs_id', type: 'uuid' }),
    __metadata("design:type", String)
], UserPushToken.prototype, "prefsId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], UserPushToken.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], UserPushToken.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], UserPushToken.prototype, "updatedAt", void 0);
exports.UserPushToken = UserPushToken = __decorate([
    (0, typeorm_1.Entity)({ name: 'user_push_tokens' }),
    (0, typeorm_1.Unique)(['token'])
], UserPushToken);
