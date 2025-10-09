import 'reflect-metadata';
import { AppDataSource } from '../data-source';

async function main() {
  await AppDataSource.initialize();
  const q = AppDataSource.createQueryRunner();

  await q.connect();
  await q.startTransaction();
  try {
    await q.query(`
      INSERT INTO roles (nombre, descripcion) VALUES
      ('ADMIN','Administrador'),
      ('OPERADOR','Operador de campo'),
      ('ANALISTA','Analista')
      ON CONFLICT (nombre) DO NOTHING;
    `);

    await q.query(`
      INSERT INTO estado_incendio (codigo, nombre, orden) VALUES
      ('INFORMACION_FALSA','Información falsa', 0),
      ('INCENDIO_ACTIVO','Incendio activo', 1),
      ('CIERRE_OPERACIONES','Cierre de operaciones', 2)
      ON CONFLICT (codigo) DO NOTHING;
    `);

    await q.query(`
      INSERT INTO medios (nombre) VALUES
      ('TELÉFONO'), ('WHATSAPP'), ('RADIO'), ('RED_SOCIAL')
      ON CONFLICT (nombre) DO NOTHING;
    `);

    await q.query(`
      INSERT INTO instituciones (nombre) VALUES ('CONRED')
      ON CONFLICT (nombre) DO NOTHING;
    `);

    // Admin sin ON CONFLICT
    await q.query(`
      WITH r AS (SELECT rol_uuid FROM roles WHERE nombre='ADMIN'),
           i AS (SELECT institucion_uuid FROM instituciones WHERE nombre='CONRED')
      INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_uuid, institucion_uuid, is_admin)
      SELECT 'Admin','Principal','admin@demo.local', crypt('Admin123!', gen_salt('bf')),
             r.rol_uuid, i.institucion_uuid, true
      FROM r, i
      WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email='admin@demo.local');
    `);

    await q.commitTransaction();
    console.log('Seed OK');
  } catch (e) {
    await q.rollbackTransaction();
    console.error('Seed FAILED', e);
  } finally {
    await q.release();
    await AppDataSource.destroy();
  }
}

main();
