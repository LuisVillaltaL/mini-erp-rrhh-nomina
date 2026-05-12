// frontend/src/services/nominaService.js
import axios from 'axios';

// Si no tienes definida la variable de entorno, usará el puerto 3001 por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const nominaService = {
    // Listar todas las nóminas registradas
    listar: async () => {
        const response = await axios.get(`${API_URL}/nominas`);
        return response.data;
    },

    // Crear una nueva cabecera de nómina (ej. "Nómina de Mayo 2026")
    crear: async (datos) => {
        const response = await axios.post(`${API_URL}/nominas`, datos);
        return response.data;
    },

    // Simular cálculos para un empleado según reglas de Guatemala (IGSS, ISR)
    // Se usa en la pestaña "Simulador" para ver resultados antes de guardar
    simular: async (params) => {
        const response = await axios.get(`${API_URL}/nominas/simulacion`, { params });
        return response.data;
    },

    // Procesar la nómina completa para todos los empleados del periodo
    procesar: async (id) => {
        const response = await axios.post(`${API_URL}/nominas/${id}/procesar`);
        return response.data;
    },

    // Obtener el desglose de empleados de una nómina específica
    detalle: async (id) => {
        const response = await axios.get(`${API_URL}/nominas/${id}/detalle`);
        return response.data;
    },

    // Obtener los movimientos detallados de un empleado en una nómina
    movimientos: async (id, empleadoId) => {
        const response = await axios.get(`${API_URL}/nominas/${id}/detalle/${empleadoId}/movimientos`);
        return response.data;
    },

    // Cambiar estado a pagada
    pagar: async (id) => {
        const response = await axios.put(`${API_URL}/nominas/${id}/pagar`);
        return response.data;
    }
};