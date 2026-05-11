const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Importar Rutas
const empleadosRoutes = require('./routes/empleados');
// const dashboardRoutes = require('./routes/dashboard');

// Registrar Rutas
app.use('/api/empleados', empleadosRoutes);
// app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});