
'use strict'

const bcrypt = require('bcrypt')
require('dotenv').config()

// Importa el pool centralizado, no instancia uno nuevo
const db = require('../src/config/db')

const ROLES_VALIDOS = ['administrador', 'rrhh', 'consulta']

async function crearUsuario(username, password, rol) {
  // Validar argumentos
  if (!username || !password || !rol) {
    console.error('Uso: node scripts/crearUsuario.js <username> <password> <rol>')
    console.error('Roles validos: administrador | rrhh | consulta')
    process.exit(1)
  }

  if (!ROLES_VALIDOS.includes(rol)) {
    console.error(`Rol invalido: '${rol}'. Usa uno de: ${ROLES_VALIDOS.join(' | ')}`)
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('La contrasena debe tener al menos 6 caracteres')
    process.exit(1)
  }

  try {
    // Buscar el id del rol
    const { rows: roles } = await db.query(
      'SELECT id FROM roles WHERE nombre = $1',
      [rol]
    )

    if (!roles.length) {
      console.error(`El rol '${rol}' no existe en la base de datos.`)
      console.error('Ejecuta primero database/usuarios.sql para crear los roles base.')
      process.exit(1)
    }

    const hash = await bcrypt.hash(password, 10)

    const { rows } = await db.query(
      `INSERT INTO usuarios (username, password_hash, rol_id)
       VALUES ($1, $2, $3)
       RETURNING id, username`,
      [username.trim(), hash, roles[0].id]
    )

    console.log(`Usuario creado exitosamente:`)
    console.log(`  ID       : ${rows[0].id}`)
    console.log(`  Username : ${rows[0].username}`)
    console.log(`  Rol      : ${rol}`)

  } catch (err) {
    if (err.code === '23505')
      console.error(`El usuario '${username}' ya existe en el sistema`)
    else
      console.error('Error al crear usuario:', err.message)
    process.exit(1)
  } finally {
    // Cerrar el pool para que el proceso termine limpiamente
    await db.end()
  }
}

const [,, username, password, rol] = process.argv
crearUsuario(username, password, rol)