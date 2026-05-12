const jwt = require('jsonwebtoken')
 
const JWT_SECRET = process.env.JWT_SECRET || 'mini_erp_secret_cambia_esto'
 
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]  // Bearer <token>
 
  if (!token)
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' })
 
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.usuario = decoded  // { id, username, rol, nombre }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' })
    return res.status(403).json({ error: 'Token inválido.' })
  }
}
 
// Middleware de rol: solo permite roles específicos
const soloRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario?.rol))
    return res.status(403).json({ error: 'No tienes permisos para esta acción.' })
  next()
}
 
module.exports = { verificarToken, soloRoles }