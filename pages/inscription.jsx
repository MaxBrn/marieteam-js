import { useState } from 'react';
import { useRouter } from 'next/router'; // Utilisé pour la navigation après inscription
import Link from 'next/link';
import { supabase } from '@/lib/supabase';  // Assurez-vous d'importer le client Supabase configuré
import Notification from '@/components/Notification';

const RegisterPage = () => {
  // State pour chaque champ du formulaire
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [mail, setMail] = useState('');
  const [mdp, setMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [loading, setLoading] = useState(false); // Pour indiquer si la soumission est en cours
  const [notification, setNotification] = useState(null);
  const [passwordError, setPasswordError] = useState('');

  const router = useRouter(); // Pour naviguer après l'inscription (par exemple, vers la page de connexion)

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Fonction de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mdp !== confirmMdp) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPasswordError('');
    setLoading(true);

    try {
      // Appel à Supabase pour créer un utilisateur
      const { user, error } = await supabase.auth.signUp(
        {
          email: mail,
          password: mdp,
          options: {
            data: {
              display_name: prenom + ' ' + nom,
              prenom: prenom,
              nom: nom,
            }            
          },
        }
      );

      setLoading(false);

      if (error) {
        showNotification("error", error.message || 'Une erreur est survenue.');
        return;
      }

      showNotification("success", "Inscription réussie ! Redirection vers la page de connexion...");
      
      // Attendre que la notification soit visible avant la redirection
      setTimeout(() => {
        router.push('/connexion');
      }, 1000);

    } catch (error) {
      setLoading(false);
      showNotification("error", "Une erreur est survenue lors de l'inscription.");
      console.log(error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
        />
      )}
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Inscription</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              id="nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              id="prenom"
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg"
            />
          </div>
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

          <div>
            <label htmlFor="confirmMdp" className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
            <input
              id="confirmMdp"
              type="password"
              value={confirmMdp}
              onChange={(e) => setConfirmMdp(e.target.value)}
              required
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg"
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-sky-900 text-white rounded-lg"
            >
              {loading ? 'Enregistrement...' : 'S\'inscrire'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p>
            Vous avez déjà un compte ?{' '}
            <Link href="/connexion" className="text-sky-900 hover:underline">Connectez-vous</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
