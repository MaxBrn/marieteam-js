import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MdOutlineSupervisorAccount } from "react-icons/md";
import Cookie from "js-cookie";
import Link from 'next/link';

export default function NavBar() {
  // État pour savoir si le menu est ouvert ou non
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(null);  // Retirer le type "string | null"

  // Référence au menu déroulant pour vérifier si le clic est en dehors
  const menuRef = useRef(null); // Retirer le type "HTMLDivElement | null"

  // Fonction pour basculer l'état du menu (afficher/masquer)
  const toggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  // Fonction pour fermer le menu si un clic est effectué en dehors
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false); // Fermer le menu si le clic est à l'extérieur
    }
  };

  // Utilisation de useEffect pour écouter les clics en dehors du menu
  useEffect(() => {
    // Si le code est exécuté côté client, on récupère le token
    if (typeof window !== "undefined") {
      const tokenFromCookie = Cookie.get("token");
      setToken(tokenFromCookie || null);
    }

    // Ajouter un écouteur d'événements au clic du document
    document.addEventListener("click", handleClickOutside);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []); // Effect se déclenche uniquement une fois au montage du composant

  // Utilisation d'un autre useEffect pour mettre à jour l'état du token si le cookie change
  useEffect(() => {
    if (typeof window !== "undefined") {
      // À chaque changement de cookie, on met à jour le token
      const tokenFromCookie = Cookie.get("token");
      setToken(tokenFromCookie || null);
    }
  }, [typeof window !== "undefined" && Cookie.get("token")]); // Mettre à jour lorsque le cookie change

  return (
    <nav className="flex bg-blue-50 text-slate-500 py-4 w-9/12 m-auto mt-3 rounded-xl">
      <div className="flex gap-8 justify-between w-full">
        <div className="ml-10">
          <Link href="/">
            <Image
              src="/images/logoMarieteam.png"
              width={70}
              height={70}
              alt="Logo"
            />
          </Link>
        </div>

        <div className="flex gap-5 mr-10">
          <Link href="/listetrajet" className="font-bold text-lg">
            Liaisons Tarifs
          </Link>
          <Link href="/listetrajet" className="font-bold text-lg">
            Réserver un trajet
          </Link>

          <div
            className="relative"
            ref={menuRef}
          >
            <button
              onClick={toggleMenu}
              className="font-bold text-lg flex items-center gap-2"
            >
              <MdOutlineSupervisorAccount className="text-2xl" />
            </button>

            {/* Menu déroulant si l'utilisateur n'est pas connecté */}
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

            {/* Menu déroulant si l'utilisateur est connecté */}
            {isMenuOpen && token && (
              <div className="absolute left-0 mt-2 space-y-2 bg-white border rounded-lg shadow-lg">
                <Link
                  href="/compte"
                  className="block px-4 py-2 text-lg text-slate-600 hover:bg-blue-100 rounded-t-lg"
                >
                  Mon compte
                </Link>
                <Link
                  href="/"
                  onClick={() => {
                    Cookie.remove("token"); // Déconnexion
                    setToken(null); // Mettre à jour l'état du token
                  }}
                  className="block px-4 py-2 text-lg text-slate-600 hover:bg-blue-100 rounded-b-lg"
                >
                  Déconnexion
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
