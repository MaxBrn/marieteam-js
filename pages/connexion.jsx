import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';  // Assurez-vous que vous avez bien configuré le client Supabase
import Link from 'next/link';
import Cookies from 'js-cookie';
import Cookie from 'js-cookie';

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

    try {
      // Appel à Supabase pour se connecter avec l'email et le mot de passe
      const { data, error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: mdp,
      });

      setLoading(false);

      if (error) {
        setMessage(error.message || 'Erreur de connexion.');
        return;
      }

      // Si la connexion est réussie, récupérer le token JWT de Supabase
      const token = await data.session.access_token;

      // Stocker le token dans un cookie
      Cookies.set('token', token, { expires: 1, path: '/' });

      // Rediriger l'utilisateur vers la page d'accueil
      const reserveTrajet = Cookie.get('resTrajet');
      if(reserveTrajet) {
        router.push(`/reservation/${reserveTrajet}`);
        Cookie.remove('resTrajet');
      }
      else {
        router.push('/');
      }
      
    } catch (error) {
      setLoading(false);
      setMessage('Une erreur est survenue.');
      console.log(error);
    }
  };

  return (
    <div className="flex justify-center items-center p-28">
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
              className="w-full py-2 px-4 bg-sky-900 text-white rounded-lg"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p>
            Pas encore de compte ?{' '}
            <Link href="/inscription" className="text-sky-900 hover:underline">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
