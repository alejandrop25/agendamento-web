import { useState } from 'react';

export const LoginPanel: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    const handleLogout = () => {
      localStorage.removeItem('token');
      setToken(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3333/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token); 
                setToken(data.token);
                alert('Login efetuado com sucesso');
                console.log('Dados do usuário:', data);
            } else {
                setError(data.error || 'Usuário ou senha incorretos.');
            }
        } catch (error) {
            setError('Erro ao conectar com o servidor. Verifique se a API está rodando.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
                
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Login</h2>
                    <p className="text-sm text-gray-500 mt-1"></p>
                </div>
                
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-6 rounded text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Usuário</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Usuário"
                            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-gray-800 focus:outline-none transition-all"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="••••••••"
                            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-gray-800 focus:outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-gray-800 text-white py-3 rounded font-bold hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? 'Carregando' : 'Entrar'}
                    </button>
                </form>
                
            </div>
        </div>
    );
};