'use strict';

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../src/config/db');

const JWT_SECRET  = process.env.JWT_SECRET  || 'mini_erp_dev_secret_2025';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

const login = async (req, res) => {
    // Leer el body de forma segura, sin importar si viene como string u objeto
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (!body || typeof body !== 'object') body = {};

    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password       : '';

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contrasena son requeridos' });
    }

    try {
        const { rows } = await db.query(`
            SELECT
                u.id,
                u.username,
                u.password_hash,
                u.activo,
                r.nombre AS rol,
                COALESCE(e.nombres || ' ' || e.apellidos, u.username) AS nombre_completo
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            LEFT JOIN empleados e ON u.empleado_id = e.id
            WHERE LOWER(u.username) = LOWER($1)
        `, [username]);

        if (!rows.length) {
            return res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
        }

        const u = rows[0];

        if (!u.activo) {
            return res.status(403).json({ error: 'Cuenta desactivada' });
        }

        const valida = await bcrypt.compare(password, u.password_hash);

        if (!valida) {
            return res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
        }

        // Actualizar ultimo login
        await db.query(
            'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1',
            [u.id]
        );

        const token = jwt.sign(
            { id: u.id, username: u.username, rol: u.rol, nombre: u.nombre_completo },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        console.log('[AUTH] Login exitoso:', u.username, '/', u.rol);

        return res.json({
            token,
            usuario: {
                id:       u.id,
                username: u.username,
                nombre:   u.nombre_completo,
                rol:      u.rol,
            }
        });

    } catch (err) {
        console.error('[AUTH] Error en login:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { login };