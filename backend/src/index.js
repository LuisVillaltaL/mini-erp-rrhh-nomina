'use strict';

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

require('./config/db');

const { verificarToken } = require('./middleware/authMiddleware');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

console.log('--- Iniciando Servidor Mini ERP ---');

try {
    app.use('/api/auth', require('./routes/auth'));
    console.log('STATUS: /api/auth cargado');
} catch (err) {
    console.error('ERROR /api/auth:', err.message);
}

const rutas = [
    { path: '/api/dashboard',      file: './routes/dashboard'      },
    { path: '/api/nominas',        file: './routes/nominas'        },
    { path: '/api/rrhh',           file: './routes/rrhh'           },
    { path: '/api/departamentos',  file: './routes/departamentos'  },
    { path: '/api/cargos',         file: './routes/cargos'         },
    { path: '/api/reportes',       file: './routes/reportes'       },
    { path: '/api/configuracion',  file: './routes/configuracion'  },
];

rutas.forEach(({ path, file }) => {
    try {
        app.use(path, verificarToken, require(file));
        console.log('STATUS: ' + path + ' cargado');
    } catch (err) {
        console.error('ERROR ' + path + ': ' + err.message);
    }
});

app.get('/api/health', (req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use((req, res) =>
    res.status(404).json({ error: 'Ruta no encontrada: ' + req.path })
);

app.use((err, req, res, next) => {
    console.error('[ERROR GLOBAL]', err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('------------------------------------');
    console.log('Servidor listo en el puerto: ' + PORT);
    console.log('URL: http://localhost:' + PORT);
    console.log('------------------------------------');
});