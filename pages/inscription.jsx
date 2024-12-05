import { useState } from 'react';
import { useRouter } from 'next/router'; // Utilisé pour la navigation après inscription
import Link from 'next/link';
import { supabase } from '@/lib/supabase';  // Assurez-vous d'importer le client Supabase configuré

const RegisterPage = () => {
  // State pour chaque champ du formulaire
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [mail, setMail] = useState('');
  const [mdp, setMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Pour indiquer si la soumission est en cours

  const router = useRouter(); // Pour naviguer après l'inscription (par exemple, vers la page de connexion)

  // Fonction de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que les mots de passe correspondent
    if (mdp !== confirmMdp) {
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Appel à Supabase pour créer un utilisateur
      const { user, error } = await supabase.auth.signUp({
        email: mail,
        password: mdp,
        options: {
          data: {
            nom: nom,
            prenom: prenom,
          }
        }
      });

      setLoading(false);

      if (error) {
        setMessage(error.message || 'Une erreur est survenue.');
        return;
      }

      // Si tout est OK, rediriger l'utilisateur vers la page de connexion
      router.push('/connexion');
    } catch (error) {
      setLoading(false);
      setMessage('Une erreur est survenue.');
      console.log(error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Inscription</h1>
        {message && <p className="text-red-500 text-center">{message}</p>}
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
            <Link href="/connexion" className="bg-sky-900 hover:underline">Connectez-vous</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
