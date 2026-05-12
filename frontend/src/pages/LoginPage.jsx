// frontend/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar token y usuario en localStorage directamente
                // (igual que hace AuthContext internamente)
                localStorage.setItem('erp_token',   data.token);
                localStorage.setItem('erp_usuario', JSON.stringify(data.usuario));
                // Redirigir y recargar para que AuthContext lea el localStorage
                window.location.href = '/';
            } else {
                setError(data.error || 'Credenciales incorrectas');
            }
        } catch (err) {
            console.error('Error de login:', err);
            setError('Error de red: No se pudo comunicar con el backend');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#0f172a'
        }}>
            <form onSubmit={handleSubmit} style={{
                background: 'white', padding: '40px', borderRadius: '16px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <h2 style={{ marginBottom: '8px', color: '#1e293b' }}>Bienvenido al ERP</h2>
                <p style={{ marginBottom: '24px', color: '#64748b', fontSize: '14px' }}>
                    Ingrese sus credenciales para continuar
                </p>

                {error && (
                    <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Usuario
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        required
                        autoComplete="username"
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Contraseña
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        required
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%', padding: '12px',
                        background: loading ? '#93c5fd' : '#2563eb',
                        color: 'white', border: 'none', borderRadius: '8px',
                        fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>

                <div style={{ marginTop: '16px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
                    Usuario: <strong>admin</strong> / Contrasena: <strong>Admin123!</strong>
                </div>
            </form>
        </div>
    );
}