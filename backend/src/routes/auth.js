// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();

// Si tus controladores están en backend/controllers/ (fuera de src)
// Debes subir dos niveles: uno para salir de 'routes' y otro para salir de 'src'
const authController = require('../../controllers/authController');

// Definir la ruta de login
router.post('/login', authController.login);

module.exports = router;