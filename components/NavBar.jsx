import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MdOutlineSupervisorAccount } from "react-icons/md";
import Cookie from "js-cookie";
import Link from 'next/link';
import { useRouter } from 'next/router';
import Notification from './Notification';
import { supabase } from '@/lib/supabase';

/**
 * Composant NavBar - Barre de navigation principale de l'application
 * 
 * Fonctionnalités :
 * - Affichage du logo et navigation principale
 * - Gestion de l'authentification (connexion/déconnexion)
 * - Menu déroulant adaptatif selon l'état de connexion
 * - Affichage conditionnel du dashboard pour les admins
 * - Notifications pour les actions utilisateur
 */
export default function NavBar() {
  // ===== ÉTATS DU COMPOSANT =====
  
  // État du menu déroulant (ouvert/fermé)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Token d'authentification récupéré des cookies
  const [token, setToken] = useState(null);
  
  // Rôle de l'utilisateur connecté (admin, user, etc.)
  const [role, setRole] = useState(null);
  
  // État pour l'affichage des notifications
  const [notification, setNotification] = useState(null);
  
  // Référence pour détecter les clics à l'extérieur du menu
  const menuRef = useRef(null);
  
  // Hook router pour la navigation et détection des changements de page
  const router = useRouter();

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====
  
  /**
   * Bascule l'état d'ouverture/fermeture du menu déroulant
   */
  const toggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  /**
   * Ferme le menu si l'utilisateur clique à l'extérieur
   * Améliore l'UX en fermant automatiquement le menu
   */
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  };

  /**
   * Affiche une notification temporaire (3 secondes)
   * @param {string} type - Type de notification ('success', 'error', etc.)
   * @param {string} message - Message à afficher
   */
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // ===== FONCTIONS UTILITAIRES =====
  
  /**
   * Récupère les données utilisateur (token et rôle)
   * Fonction centrale pour maintenir l'état d'authentification à jour
   */
  const fetchUserData = async () => {
    // Vérification côté client uniquement (Next.js SSR/SSG compatibility)
    if (typeof window !== "undefined") {
      // Récupération du token depuis les cookies
      const tokenFromCookie = Cookie.get("token");
      setToken(tokenFromCookie || null);

      // Si un token existe, récupération du rôle utilisateur
      if (tokenFromCookie) {
        try {
          // Appel à Supabase pour obtenir les données utilisateur
          const { data: { user } } = await supabase.auth.getUser();
          
          // Extraction du rôle depuis les métadonnées utilisateur
          const userRole = user?.user_metadata?.role;
          setRole(userRole);
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle:", error);
          setRole(null);
        }
      } else {
        // Pas de token = pas de rôle
        setRole(null);
      }
    }
  };

  // ===== EFFECTS (CYCLE DE VIE DU COMPOSANT) =====
  
  /**
   * Effect au montage du composant
   * - Récupère les données utilisateur initiales
   * - Met en place l'écouteur pour fermer le menu au clic extérieur
   */
  useEffect(() => {
    fetchUserData();
    document.addEventListener("click", handleClickOutside);

    // Cleanup : suppression de l'écouteur au démontage
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  /**
   * Effect déclenché à chaque changement de route
   * Permet de rafraîchir l'état d'authentification après navigation
   * Utile si l'utilisateur se connecte/déconnecte sur une autre page
   */
  useEffect(() => {
    fetchUserData();
  }, [router.pathname]);

  // ===== ACTIONS UTILISATEUR =====
  
  /**
   * Gère la déconnexion de l'utilisateur
   * - Déconnexion Supabase
   * - Suppression du cookie token
   * - Réinitialisation des états
   * - Redirection vers l'accueil
   * - Notification de succès/erreur
   */
  const handleLogout = async () => {
    try {
      // Déconnexion côté Supabase
      await supabase.auth.signOut();
      
      // Suppression du token des cookies
      Cookie.remove("token");
      
      // Réinitialisation des états locaux
      setToken(null);
      setRole(null);
      
      // Notification de succès
      showNotification("success", "Déconnexion réussie");
      
      // Redirection vers la page d'accueil
      router.push('/');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      showNotification("error", "Erreur lors de la déconnexion");
    }
  };

  // ===== RENDU DU COMPOSANT =====
  return (
    <nav className="flex bg-blue-50 text-slate-500 py-4 lg:w-9/12 w-full m-auto lg:mt-3 lg:rounded-xl">
      {/* === NOTIFICATIONS === */}
      {/* Affichage conditionnel des notifications */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
        />
      )}
      
      <div className="flex gap-8 justify-between w-full">
        {/* === SECTION GAUCHE : LOGO === */}
        <div className="ml-10">
          <Link href="/">
            <Image
              src="/images/logoMarieteam.png"
              width={70}
              height={70}
              alt="Logo Marieteam"
            />
          </Link>
        </div>

        {/* === SECTION DROITE : NAVIGATION ET MENU UTILISATEUR === */}
        <div className="flex gap-5 mr-10">
          {/* Lien principal : Réservation de trajets (toujours visible) */}
          <Link href="/listetrajet" className="text-lg">
            Réserver un trajet
          </Link>

          {/* === LIEN CONDITIONNEL : DASHBOARD ADMIN === */}
          {/* Affiché uniquement si l'utilisateur est connecté ET a le rôle admin */}
          {role === 'admin' && token && (
            <Link href="/admin" className="text-lg">
              Dashboard
            </Link>
          )}

          {/* === MENU DÉROULANT UTILISATEUR === */}
          <div
            className="relative"
            ref={menuRef} // Référence pour détecter les clics extérieurs
          >
            {/* Bouton d'ouverture du menu (icône utilisateur) */}
            <button
              onClick={toggleMenu}
              className="text-lg flex items-center gap-2"
              aria-label="Menu utilisateur"
            >
              <MdOutlineSupervisorAccount className="text-2xl" />
            </button>

            {/* === MENU POUR UTILISATEUR NON CONNECTÉ === */}
            {/* Affiché si le menu est ouvert ET qu'il n'y a pas de token */}
            {isMenuOpen && !token && (
              <div className="absolute left-0 mt-2 space-y-2 bg-white border rounded-lg shadow-lg">
                <Link
                  href="/connexion"
                  className="block px-4 py-2 text-lg text-slate-600 hover:bg-blue-100 rounded-t-lg"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="block px-4 py-2 text-lg text-slate-600 hover:bg-blue-100 rounded-b-lg"
                >
                  Inscription
                </Link>
              </div>
            )}

            {/* === MENU POUR UTILISATEUR CONNECTÉ === */}
            {/* Affiché si le menu est ouvert ET qu'il y a un token */}
            {isMenuOpen && token && (
              <div className="absolute left-0 mt-2 space-y-2 bg-white border rounded-lg shadow-lg">
                <Link
                  href="/compte"
                  className="block px-4 py-2 text-lg text-slate-600 hover:bg-blue-100 rounded-t-lg"
                >
                  Mon compte
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-lg text-slate-600 hover:bg-blue-100 rounded-b-lg"
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}