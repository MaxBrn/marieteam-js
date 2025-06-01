// Importation des hooks et composants nécessaires
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';  // Client Supabase pour l'authentification
import Link from 'next/link';
import Cookies from 'js-cookie';
import Cookie from 'js-cookie';
import Notification from '@/components/Notification';

const LoginPage = () => {
  // === ÉTATS LOCAUX DU COMPOSANT ===
  
  // Champs du formulaire de connexion
  const [mail, setMail] = useState('');        // Email de l'utilisateur
  const [mdp, setMdp] = useState('');          // Mot de passe de l'utilisateur
  
  // États pour la gestion de l'interface utilisateur
  const [loading, setLoading] = useState(false);     // Indicateur de chargement pendant la connexion
  const [error, setError] = useState('');            // Message d'erreur à afficher
  const [notification, setNotification] = useState(null); // Notification de succès/erreur
  
  // Hook Next.js pour la navigation programmatique
  const router = useRouter();

  // === FONCTIONS UTILITAIRES ===
  
  /**
   * Affiche une notification temporaire à l'utilisateur
   * @param {string} type - Type de notification ('success', 'error', etc.)
   * @param {string} message - Message à afficher
   */
  const showNotification = (type, message) => {
    setNotification({ type, message });
    // Auto-suppression de la notification après 3 secondes
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // === LOGIQUE DE CONNEXION ===
  
  /**
   * Gère la soumission du formulaire de connexion
   * @param {Event} e - Événement de soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    
    // Activation de l'état de chargement et reset des erreurs
    setLoading(true);
    setError('');

    try {
      // === AUTHENTIFICATION AVEC SUPABASE ===
      
      // Tentative de connexion avec email/mot de passe via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: mdp,
      });

      // Vérification des erreurs d'authentification
      if (error) {
        setError(error.message || 'Erreur de connexion.');
        setLoading(false);
        return; // Arrêt de l'exécution en cas d'erreur
      }

      // === GESTION DU TOKEN JWT ===
      
      // Récupération du token d'accès depuis la session Supabase
      const token = await data.session.access_token;

      // Stockage sécurisé du token dans un cookie
      // expires: 1 = expiration après 1 jour
      // path: '/' = accessible sur tout le site
      Cookies.set('token', token, { expires: 1, path: '/' });

      // === FEEDBACK UTILISATEUR ET REDIRECTION ===
      
      // Affichage d'une notification de succès
      showNotification("success", "Connexion réussie");

      // Délai avant redirection pour permettre à l'utilisateur de voir la notification
      setTimeout(() => {
        // Vérification s'il y a une réservation en attente
        const reserveTrajet = Cookie.get('resTrajet');
        
        if(reserveTrajet) {
          // Si une réservation était en cours, redirection vers la page de réservation
          router.push(`/reservation/${reserveTrajet}`);
          Cookie.remove('resTrajet'); // Nettoyage du cookie temporaire
        }
        else {
          // Sinon, redirection vers la page d'accueil
          router.push('/');
        }
      }, 500); // Délai de 500ms pour l'UX
      
    } catch (error) {
      // === GESTION DES ERREURS INATTENDUES ===
      
      setLoading(false);
      setError('Une erreur est survenue lors de la connexion.');
      console.log(error); // Log pour le débogage
    }
  };

  // === RENDU DU COMPOSANT ===
  
  return (
    <div className="flex justify-center items-center p-28">
      {/* Affichage conditionnel de la notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
        />
      )}
      
      {/* Container principal du formulaire de connexion */}
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
        
        {/* Titre de la page */}
        <h1 className="text-2xl font-bold text-center">Connexion</h1>
        
        {/* Formulaire de connexion */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Champ Email */}
          <div>
            <label htmlFor="mail" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="mail"
              type="email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              required
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label htmlFor="mdp" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="mdp"
              type="password"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              required
              className="w-full p-2 mt-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Affichage conditionnel des erreurs */}
          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}

          {/* Bouton de soumission */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading} // Désactivation pendant le chargement
              className="w-full py-2 px-4 bg-sky-900 text-white rounded-lg"
            >
              {/* Texte dynamique selon l'état de chargement */}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>

        {/* Lien vers l'inscription */}
        <div className="text-center mt-4">
          <p>
            Pas encore de compte ?{' '}
            <Link href="/inscription" className="text-sky-900 hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;