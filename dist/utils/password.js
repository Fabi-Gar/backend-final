"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
// src/utils/password.ts
const argon2_1 = __importDefault(require("argon2"));
// Opciones válidas para node-argon2 (sin saltLength)
const ARGON2_OPTS = {
    type: argon2_1.default.argon2id,
    memoryCost: 64 * 1024, // 64 MiB
    timeCost: 3,
    parallelism: 1,
    hashLength: 32, // este sí existe
    // version: 0x13,      // opcional (por defecto es 0x13 = 19)
};
const PEPPER = process.env.PASSWORD_PEPPER || '';
async function hashPassword(plain) {
    const material = PEPPER ? `${plain}${PEPPER}` : plain;
    return argon2_1.default.hash(material, ARGON2_OPTS);
}
async function verifyPassword(plain, hash) {
    if (!hash)
        return false;
    // helper de desarrollo opcional
    if (hash.includes('dummy'))
        return plain === 'dev';
    const material = PEPPER ? `${plain}${PEPPER}` : plain;
    // Argon2 moderno
    if (hash.startsWith('$argon2')) {
        try {
            return await argon2_1.default.verify(hash, material);
        }
        catch {
            return false;
        }
    }
    // Bcrypt (legacy) vía pgcrypto (si aún quieres compat)
    try {
        const { AppDataSource } = await Promise.resolve().then(() => __importStar(require('../db/data-source')));
        const r = await AppDataSource.query(`SELECT crypt($1, $2) = $2 AS ok`, [material, hash]);
        return !!r?.[0]?.ok;
    }
    catch {
        return false;
    }
}
