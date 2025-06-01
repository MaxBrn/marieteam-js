import { useState } from 'react';
import { useRouter } from 'next/router'; // Navigation après inscription réussie
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // Client Supabase pour l'authentification
import Notification from '@/components/Notification';
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

const RegisterPage = () => {
  // ===== ÉTATS DU COMPOSANT =====
  
  // Champs du formulaire d'inscription
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [mail, setMail] = useState('');
  const [mdp, setMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  
  // États pour l'interface utilisateur
  const [loading, setLoading] = useState(false); // Indicateur de chargement pendant la soumission
  const [notification, setNotification] = useState(null); // Messages de succès/erreur
  const [passwordError, setPasswordError] = useState(''); // Erreurs spécifiques au mot de passe
  const [done, setDone] = useState(false); // Indicateur d'inscription terminée
  const [guidelines, setGuidelines] = useState(null); // Guide visuel pour la validation du mot de passe

  const router = useRouter(); // Hook Next.js pour la navigation programmatique
 
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

  /**
   * Valide le mot de passe en temps réel et affiche les critères
   * @param {string} mdp - Mot de passe à valider
   * @returns {boolean} - True si le mot de passe est valide
   */
  const verifMdp = (mdp) => {
    setMdp(mdp);
    
    // Critères de validation du mot de passe
    const minLength = 13;
    const hasUpperCase = /[A-Z]/.test(mdp); // Au moins une majuscule
    const hasLowerCase = /[a-z]/.test(mdp); // Au moins une minuscule
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(mdp); // Au moins un caractère spécial
  
    // Si tous les critères sont respectés
    if (mdp.length >= minLength && hasLowerCase && hasUpperCase && hasSpecialChar) {
      setGuidelines(
        <p className="text-green-600 font-medium pt-4">Mot de passe valide</p>
      );
      return true;
    } else {
      // Affichage dynamique des critères non respectés
      setGuidelines(
        <div className='pt-4'>
          <p className="mb-1">Un mot de passe valide doit contenir :</p>
          <ul className="list-disc pl-5 space-y-1">
            {mdp.length < minLength && <li>13 caractères minimum</li>}
            {!hasUpperCase && <li>Une majuscule minimum</li>}
            {!hasLowerCase && <li>Une minuscule minimum</li>}
            {!hasSpecialChar && <li>Un caractère spécial minimum</li>}
          </ul>
        </div>
      );
      return false;
    }
  };

  /**
   * Gère la soumission du formulaire d'inscription
   * @param {Event} e - Événement de soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page

    // ===== VALIDATIONS CÔTÉ CLIENT =====
    
    // Vérification finale du mot de passe
    if(!verifMdp(mdp)) {
      setPasswordError('Le mot de passe est non valide');
      return;
    }
    
    // Vérification de la concordance des mots de passe
    if (mdp !== confirmMdp) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    // Réinitialisation des erreurs et activation du loading
    setPasswordError('');
    setLoading(true);

    try {
      // ===== INSCRIPTION VIA SUPABASE =====
      const { user, error } = await supabase.auth.signUp(
        {
          email: mail,
          password: mdp,
          options: {
            data: {
              // Métadonnées utilisateur stockées dans le profil
              display_name: prenom + ' ' + nom,
              prenom: prenom,
              nom: nom,
            }            
          },
        }
      );

      setLoading(false);

      // Gestion des erreurs retournées par Supabase
      if (error) {
        showNotification("error", error.message || 'Une erreur est survenue.');
        return;
      }

      // Inscription réussie - passage à l'écran de confirmation
      showNotification("success", "Inscription réussie ! Redirection vers la page de connexion...");
      setDone(true);
      
    } catch (error) {
      // Gestion des erreurs non anticipées
      setLoading(false);
      showNotification("error", "Une erreur est survenue lors de l'inscription.");
      console.log(error);
    }
  };

  // ===== RENDU DU COMPOSANT =====
  return (
    <div className="flex justify-center py-10">
      {/* Affichage conditionnel des notifications */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
        />
      )}
      
      <div className="w-full max-w-md space-y-4 bg-white rounded-lg shadow-lg">
        {/* ===== ÉCRAN DE CONFIRMATION POST-INSCRIPTION ===== */}
        {done ? (
          <div className='w-full flex flex-col gap-3'>
            {/* En-tête de succès */}
            <div className="bg-green-500 text-white px-4 py-4 rounded-t flex items-center space-x-2">
              <AiOutlineCheckCircle className="text-xl"/>
              <span>Inscription réussie</span>
            </div>
            
            <hr className="h-px border border-slate-300 w-2/3 mx-auto" />
            
            {/* Instructions pour la vérification email */}
            <div className='flex flex-col gap-3 px-4 pb-4'>
              <h1 className='text-center'>Encore une dernière chose !</h1>
              <p>
                Vous allez recevoir sous peu un mail contenant un lien permettant de vérifier votre compte.
                Sans ça vous ne pourrez pas accèder au site Marieteam !
              </p>
              
              {/* Bouton de redirection vers la connexion */}
              <Link 
                href="/connexion" 
                className="w-1/3 text-center mx-auto p-2 mt-4 bg-sky-900 rounded-xl text-white hover:bg-sky-800 transition"
              >
                Compris
              </Link>
            </div>
          </div>
        ) : (
          /* ===== FORMULAIRE D'INSCRIPTION ===== */
          <div className='p-8'>
            <h1 className="text-2xl font-bold text-center">Inscription</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Champ Nom */}
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
              
              {/* Champ Prénom */}
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
              
              {/* Champ Email */}
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

              {/* Champ Mot de passe avec validation en temps réel */}
              <div>
                <label htmlFor="mdp" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <input
                  id="mdp"
                  type="password"
                  value={mdp}
                  onChange={(e) => verifMdp(e.target.value)} // Validation à chaque frappe
                  required
                  className="w-full p-2 mt-2 border border-gray-300 rounded-lg"
                />
                {/* Affichage dynamique des critères de validation */}
                <div className='text-sm text-slate-500'>
                  {guidelines}
                </div>
              </div>

              {/* Champ Confirmation du mot de passe */}
              <div>
                <label htmlFor="confirmMdp" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmMdp"
                  type="password"
                  value={confirmMdp}
                  onChange={(e) => setConfirmMdp(e.target.value)}
                  required
                  className="w-full p-2 mt-2 border border-gray-300 rounded-lg"
                />
                {/* Affichage des erreurs de mot de passe */}
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>

              {/* Bouton de soumission */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading} // Désactivé pendant le chargement
                  className="w-full py-2 px-4 bg-sky-900 text-white rounded-lg"
                >
                  {loading ? 'Enregistrement...' : 'S\'inscrire'}
                </button>
              </div>
            </form>

            {/* Lien vers la page de connexion */}
            <div className="text-center mt-4">
              <p>
                Vous avez déjà un compte ?{' '}
                <Link href="/connexion" className="text-sky-900 hover:underline">
                  Connectez-vous
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;