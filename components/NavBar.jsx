import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MdOutlineSupervisorAccount } from "react-icons/md";
import Cookie from "js-cookie";
import Link from 'next/link';
import { useRouter } from 'next/router';
import Notification from './Notification';
import { supabase } from '@/lib/supabase'; // Assure-toi que Supabase est bien configuré

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // Nouveau state pour stocker le rôle de l'utilisateur
  const [notification, setNotification] = useState(null);
  const menuRef = useRef(null);
  const router = useRouter();

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

  // Fonction pour récupérer les données utilisateur
  const fetchUserData = async () => {
    if (typeof window !== "undefined") {
      const tokenFromCookie = Cookie.get("token");
      setToken(tokenFromCookie || null);

      if (tokenFromCookie) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const userRole = user?.user_metadata?.role;
          setRole(userRole);
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
    }
  };

  // Effet pour récupérer les données utilisateur au chargement initial
  useEffect(() => {
    fetchUserData();
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Effet pour rafraîchir les données utilisateur lors des changements de route
  useEffect(() => {
    fetchUserData();
  }, [router.pathname]);

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      Cookie.remove("token");
      setToken(null);
      setRole(null);
      showNotification("success", "Déconnexion réussie");
      router.push('/');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      showNotification("error", "Erreur lors de la déconnexion");
    }
  };

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
          {role === 'admin' && token && (
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
