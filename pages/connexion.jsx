import { useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';  // Importez js-cookie pour gérer les cookies
import Link from 'next/link';
const LoginPage = () => {
  const [mail, setMail] = useState('');
  const [mdp, setMdp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    const response = await fetch('/api/connexionAPI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mail, mdp }),
    });

    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      // Si la connexion est réussie, stocker le token JWT dans un cookie
      Cookies.set('token', data.token, { expires: 1, secure: true, path: '/' });
      router.push('/');
      window.location.reload;
    } else {
      setMessage(data.message || 'Erreur de connexion.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Connexion</h1>
        {message && <p className="text-red-500 text-center">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="mail" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="mail"
              type="email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              required
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="mdp" className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              id="mdp"
              type="password"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              required
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p>
            Pas encore de compte ?{' '}
            <Link href="/inscription" className="text-blue-600 hover:underline">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
