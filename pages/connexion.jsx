import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';  // Assurez-vous que vous avez bien configuré le client Supabase
import Link from 'next/link';
import Cookies from 'js-cookie';
import Cookie from 'js-cookie';
import Notification from '@/components/Notification';

const LoginPage = () => {
  const [mail, setMail] = useState('');
  const [mdp, setMdp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const router = useRouter();

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Appel à Supabase pour se connecter avec l'email et le mot de passe
      const { data, error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: mdp,
      });

      

      if (error) {
        setError(error.message || 'Erreur de connexion.');
        setLoading(false);
        return;
      }

      // Si la connexion est réussie, récupérer le token JWT de Supabase
      const token = await data.session.access_token;

      // Stocker le token dans un cookie
      Cookies.set('token', token, { expires: 1, path: '/' });

      showNotification("success", "Connexion réussie");

      // Attendre que la notification soit visible avant la redirection
      setTimeout(() => {
        const reserveTrajet = Cookie.get('resTrajet');
        if(reserveTrajet) {
          router.push(`/reservation/${reserveTrajet}`);
          Cookie.remove('resTrajet');
        }
        else {
          router.push('/');
        }
      }, 500);
      
    } catch (error) {
      setLoading(false);
      setError('Une erreur est survenue lors de la connexion.');
      console.log(error);
    }
  };

  return (
    <div className="flex justify-center items-center p-28">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
        />
      )}
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Connexion</h1>
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

          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}

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
