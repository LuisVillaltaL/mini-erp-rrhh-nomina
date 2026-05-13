'use strict';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper que agrega el token en cada peticion
function token() {
    return localStorage.getItem('erp_token') || '';
}

function authFetch(url, options = {}) {
    return fetch(`${BASE}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token()}`,
            ...(options.headers || {}),
        },
    }).then(r => r.json());
}

export const nominaService = {
    listar:       ()         => authFetch('/nominas'),
    crear:        (data)     => authFetch('/nominas', { method: 'POST', body: JSON.stringify(data) }),
    procesar:     (id, data) => authFetch(`/nominas/${id}/procesar`, { method: 'POST', body: JSON.stringify(data) }),
    marcarPagada: (id)       => authFetch(`/nominas/${id}/pagar`, { method: 'PUT' }),
    detalle:      (id)       => authFetch(`/nominas/${id}/detalle`),
    movimientos:  (id, empId)=> authFetch(`/nominas/${id}/detalle/${empId}/movimientos`),
    simular: (params) => {
        const qs = new URLSearchParams(params).toString();
        return authFetch(`/nominas/simulacion?${qs}`);
    },
};

export const empleadoService = {
    listar: () => authFetch('/empleados'),
};