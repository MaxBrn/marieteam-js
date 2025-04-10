import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MdOutlineSupervisorAccount } from "react-icons/md";
import Cookie from "js-cookie";
import Link from 'next/link';
import Notification from './Notification';
import { supabase } from '@/lib/supabase'; // Assure-toi que Supabase est bien configuré

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // Nouveau state pour stocker le rôle de l'utilisateur
  const [notification, setNotification] = useState(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tokenFromCookie = Cookie.get("token");
      setToken(tokenFromCookie || null);

      // Récupérer les métadonnées de l'utilisateur
      const fetchUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const userRole = user?.user_metadata?.role; // Récupère le rôle depuis les métadonnées
        setRole(userRole); // Stocke le rôle dans l'état
      };

      if(tokenFromCookie) {
        fetchUserRole();
      }

      
    }

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <nav className="flex bg-blue-50 text-slate-500 py-4 lg:w-9/12 w-full m-auto lg:mt-3 lg:rounded-xl">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
        />
      )}
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
          <Link href="/listetrajet" className="text-lg">
            Réserver un trajet
          </Link>

          {/* Affiche le bouton "Dashboard" uniquement si l'utilisateur est un admin */}
          {role === 'admin' && (
            <Link href="/admin" className="text-lg">
              Dashboard
            </Link>
          )}

          <div
            className="relative"
            ref={menuRef}
          >
            <button
              onClick={toggleMenu}
              className="text-lg flex items-center gap-2"
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
                    Cookie.remove("token");
                    setToken(null);
                    showNotification("success", "Déconnexion réussie");
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
