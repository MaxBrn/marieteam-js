import { useState, useEffect } from "react";
import { AiFillEdit } from "react-icons/ai"; // Icône de stylo
import { AiOutlineClose, AiOutlineCheckCircle } from "react-icons/ai"; // Icône de fermeture
import { supabase } from "@/lib/supabase";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { IoTicket } from "react-icons/io5";
import { BsTicketDetailed } from "react-icons/bs";
import LoadingSpinner from "@/components/LoadingSpinner";
import Notification from "@/components/Notification";

/**
 * Composant Compte - Gestion du profil utilisateur et historique des réservations
 * 
 * Fonctionnalités principales :
 * - Affichage et modification des informations du profil utilisateur
 * - Historique paginé des réservations avec tri par date
 * - Modal de détail pour chaque réservation avec calcul des prix
 * - Gestion complète des états de chargement et d'erreur
 */
const Compte = () => {
  
  // ================================
  // ÉTATS DE GESTION DE L'INTERFACE
  // ================================
  
  // État pour basculer entre mode lecture et mode édition du profil
  const [editing, setEditing] = useState(false);
  
  // États de gestion des opérations asynchrones
  const [loading, setLoading] = useState(true);      // Chargement initial des données
  const [updating, setUpdating] = useState(false);   // Mise à jour du profil en cours
  
  // États de gestion des feedbacks utilisateur
  const [notification, setNotification] = useState(null); // Notifications success/error
  const [error, setError] = useState(null);               // Erreurs globales

  // État pour la modal de détail des réservations
  const [selectedReservation, setSelectedReservation] = useState(null);
  
  // ================================
  // ÉTATS DES DONNÉES UTILISATEUR
  // ================================
  
  // Objet contenant toutes les données de l'utilisateur connecté
  const [userData, setUserData] = useState({
    display_name: "",  // Nom complet affiché
    prenom: "",        // Prénom
    nom: "",           // Nom de famille
    email: "",         // Adresse email
    reservation: [],   // Tableau des réservations avec détails complets
  });

  // ================================
  // ÉTATS DE GESTION DE LA PAGINATION
  // ================================
  
  const [currentPage, setCurrentPage] = useState(1);    // Page courante
  const [itemsPerPage] = useState(5);                   // Nombre de réservations par page (constante)
  const [sortOrder, setSortOrder] = useState('desc');   // Ordre de tri : 'asc' = croissant, 'desc' = décroissant

  // ================================
  // RÉCUPÉRATION DES DONNÉES UTILISATEUR
  // ================================
  
  /**
   * Fonction principale pour récupérer toutes les données de l'utilisateur
   * 
   * Processus complexe en plusieurs étapes :
   * 1. Récupération des informations de base de l'utilisateur
   * 2. Récupération de ses réservations
   * 3. Pour chaque réservation : enrichissement avec détails du trajet, liaison, ports
   * 4. Calcul des prix selon les périodes tarifaires
   */
  const fetchUser = async () => {
    try {
      // === RÉCUPÉRATION DE L'UTILISATEUR CONNECTÉ ===
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      // === RÉCUPÉRATION DES RÉSERVATIONS DE BASE ===
      const { data: reservation, error: reservationError } = await supabase
        .from("reservation")
        .select("*")
        .eq("idCompte", user.id); // Filtre par ID de l'utilisateur connecté

      if (reservationError) throw reservationError;

      // === ENRICHISSEMENT DES RÉSERVATIONS ===
      /**
       * Pour chaque réservation, on va chercher toutes les informations détaillées :
       * - Détails du trajet (date, heures, liaison)
       * - Informations des ports (départ/arrivée)
       * - Places réservées avec types et tarifs
       */
      const detailedReservations = await Promise.all(
        reservation.map(async (res) => {
          
          // --- Récupération des détails du trajet ---
          const { data: trajet } = await supabase
            .from("trajet")
            .select("*")
            .eq("num", res.idTrajet)
            .single();

          // Formatage de la date et heures pour affichage lisible
          // Format : "DD/MM/YYYY de HHhMM à HHhMM"
          const date = trajet.date.substring(8,10)+"/"+trajet.date.substring(5,7)+"/"+trajet.date.substring(0,4) + " de " 
          + trajet.heureDepart.substring(0,2)+"h"+trajet.heureDepart.substring(3,5) 
          + " à " + trajet.heureArrivee.substring(0,2)+"h"+trajet.heureArrivee.substring(3,5);

          // --- Récupération des détails de la liaison ---
          const { data: liaison } = await supabase
            .from("liaison")
            .select("*")
            .eq("code", trajet.idLiaison)
            .single();

          // --- Récupération des noms des ports ---
          const { data: depart } = await supabase
            .from("port")
            .select("nom")
            .eq("id", liaison.depart_id)
            .single();

          const { data: arrivee } = await supabase
            .from("port")
            .select("nom")
            .eq("id", liaison.arrivee_id)
            .single();

          // --- Récupération des places réservées ---
          const { data: placesReserves } = await supabase
            .from("enregistrer")
            .select("*")
            .eq("reservation_num", res.num);

          // --- Recherche de la période tarifaire active ---
          /**
           * Trouve la période tarifaire correspondante à la date du trajet
           * Une période est active si : dateDeb <= date_trajet <= dateFin
           */
          const { data: periode, error: periodeError } = await supabase
            .from('periode')
            .select('id')
            .lte('dateDeb', trajet.date)  // dateDeb <= trajet.date
            .gte('dateFin', trajet.date)  // dateFin >= trajet.date
            .single();

          if (periodeError || !periode) {
            console.error("Erreur lors de la récupération de la période:", periodeError);
            return {
              notFound: true,
            };
          }

          // --- Enrichissement détaillé de chaque place réservée ---
          /**
           * Pour chaque place, récupération :
           * - Du type de place (libellé, caractéristiques)
           * - Du tarif applicable (selon liaison, type, période)
           * - Calcul du prix total (tarif × quantité)
           */
          const detailedSeats = await Promise.all(
            placesReserves.map(async (place) => {
              
              // Récupération du type de place
              const { data: seatType } = await supabase
                .from("type")
                .select("*")
                .eq("num", place.type_num)
                .single();

              // Récupération du tarif spécifique
              const { data: seatPrice } = await supabase
                .from("tarifer")
                .select("*")
                .eq("liaison_code", liaison.code)
                .eq("type", place.type_num)
                .eq('idPeriode', periode.id)
                .single();

              // Calcul du prix total pour cette catégorie de places
              const totalPrice = seatPrice.tarif * place.quantite;

              return { 
                ...place, 
                type: seatType, 
                tarif: seatPrice.tarif, 
                total: totalPrice 
              };
            })
          );

          // Retour de la réservation enrichie avec toutes les informations
          return {
            ...res,
            depart_nom: depart.nom,
            arrivee_nom: arrivee.nom,
            date: date,
            places: detailedSeats,
          };
        })
      );

      // === MISE À JOUR DE L'ÉTAT AVEC LES DONNÉES COMPLÈTES ===
      setUserData({
        display_name: user.user_metadata?.display_name || "Nom inconnu",
        prenom: user.user_metadata?.prenom || "",
        nom: user.user_metadata?.nom || "",
        email: user.email,
        reservation: detailedReservations,
      });
      
    } catch (err) {
      setError(err.message);
    }
  };

  // ================================
  // EFFET DE CHARGEMENT INITIAL
  // ================================
  
  /**
   * Déclenche le chargement des données au montage du composant
   */
  useEffect(() => {
    setLoading(true);
    fetchUser().finally(() => setLoading(false));
  }, []);

  // ================================
  // GESTION DE L'ÉDITION DU PROFIL
  // ================================
  
  /**
   * Fonction pour mettre à jour les champs du formulaire
   * @param {string} key - Clé du champ à modifier
   * @param {string} value - Nouvelle valeur
   */
  const handleChange = (key, value) => {
    setUserData((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Fonction pour sauvegarder les modifications du profil
   * Met à jour les métadonnées utilisateur dans Supabase Auth
   */
  const handleSave = async () => {
    try {
      setUpdating(true);
      setError(null);
      setNotification(null);

      // Mise à jour des données utilisateur via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        email: userData.email,
        data: {
          display_name: `${userData.prenom} ${userData.nom}`,
          prenom: userData.prenom,
          nom: userData.nom,
        },
      });

      if (error) throw error;

      // Rechargement des données pour refléter les changements
      await fetchUser();
      
      // Affichage de la notification de succès
      setNotification({
        type: "success",
        message: "Modifications enregistrées avec succès",
      });
      setEditing(false);
      
      // Auto-masquage de la notification après 3 secondes
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  // ================================
  // GESTION DE LA MODAL
  // ================================
  
  /**
   * Ferme la modal de détail des réservations
   */
  const closeModal = () => setSelectedReservation(null);

  // ================================
  // LOGIQUE DE TRI ET PAGINATION
  // ================================
  
  /**
   * Tri des réservations par date
   * Conversion de la date affichée (DD/MM/YYYY) vers un objet Date pour la comparaison
   */
  const sortedReservations = [...userData.reservation].sort((a, b) => {
    // Extraction et conversion de la date depuis le format "DD/MM/YYYY de HHhMM à HHhMM"
    const dateA = new Date(a.date.split(' ')[0].split('/').reverse().join('-'));
    const dateB = new Date(b.date.split(' ')[0].split('/').reverse().join('-'));
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // === CALCULS DE PAGINATION ===
  
  // Calcul des indices pour extraire les éléments de la page courante
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedReservations.slice(indexOfFirstItem, indexOfLastItem);

  /**
   * Navigation vers une page spécifique
   * @param {number} pageNumber - Numéro de la page cible
   */
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  /**
   * Bascule l'ordre de tri et remet à la première page
   */
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1); // Réinitialisation à la première page lors du changement de tri
  };

  /**
   * Génère la liste des numéros de page à afficher dans la pagination
   * Affiche au maximum 5 pages autour de la page courante
   * 
   * Logique :
   * - Affiche 2 pages avant et 2 pages après la page courante
   * - Ajuste automatiquement près des extrémités
   * - Maximum 5 pages affichées simultanément
   */
  const getPageNumbers = () => {
    const totalPages = Math.ceil(sortedReservations.length / itemsPerPage);
    const pageNumbers = [];
    
    // Calcul de la plage de pages autour de la page courante
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Ajustement si on est proche du début (pages 1-2)
    if (currentPage <= 2) {
      endPage = Math.min(5, totalPages);
    }
    
    // Ajustement si on est proche de la fin (dernières pages)
    if (currentPage >= totalPages - 1) {
      startPage = Math.max(1, totalPages - 4);
    }
    
    // Construction du tableau des numéros de page
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  // ================================
  // RENDU DU COMPOSANT
  // ================================

  return (
    <>
      {/* === ÉCRAN DE CHARGEMENT === */}
      {loading ? (
        <div className="w-full flex justify-center items-center min-h-[500px]">
          <LoadingSpinner text="Chargement des données utilisateur..." />
        </div>
      ) : (
        
        /* === CONTENU PRINCIPAL === */
        <div className="min-h-screen bg-white-100 flex justify-center items-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl w-full p-6 flex flex-col">
            
            {/* --- En-tête avec bouton d'édition --- */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Mon Compte</h1>
              {/* Bouton d'édition visible uniquement en mode lecture */}
              {!editing && (
                <button
                  className="bg-zinc-700 text-white px-4 py-2 rounded shadow hover:bg-zinc-600 focus:outline-none flex items-center justify-center ml-4"
                  onClick={() => setEditing(true)}
                >
                  <AiFillEdit className="text-xl" />
                </button>
              )}
            </div>

            {/* --- Formulaire des informations personnelles --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow">
              {/* Génération dynamique des champs : prénom, nom, email */}
              {["prenom", "nom", "email"].map((key, index) => (
                <div
                  key={key}
                  className={`bg-blue-50 p-4 rounded shadow ${
                    index === 2 ? "sm:col-span-2" : "" // Email sur toute la largeur
                  }`}
                >
                  <div>
                    {/* Label du champ */}
                    <p className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace("_", " ")}
                    </p>
                    
                    {/* Affichage conditionnel : lecture vs édition */}
                    {!editing ? (
                      // Mode lecture : texte simple
                      <p className="text-lg font-semibold text-gray-800">
                        {userData[key]}
                      </p>
                    ) : (
                      // Mode édition : champ de saisie
                      <input
                        type={key === "email" ? "email" : "text"}
                        value={userData[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* --- Bouton de validation (visible uniquement en mode édition) --- */}
            {editing && (
              <div className="flex justify-center mt-8">
                <button
                  className="bg-zinc-700 text-white px-4 py-2 rounded shadow hover:bg-zinc-600 focus:outline-none flex items-center space-x-2"
                  onClick={handleSave}
                  disabled={updating} // Désactivé pendant la mise à jour
                >
                  {updating ? (
                    // État de chargement avec spinner
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Mise à jour...</span>
                    </>
                  ) : (
                    "Valider"
                  )}
                </button>
              </div>
            )}

            {/* --- Affichage des notifications --- */}
            {notification && (
              <Notification
                type={notification.type}
                message={notification.message}
              />
            )}

            {/* === SECTION HISTORIQUE DES RÉSERVATIONS === */}
            <div className="mt-8">
              
              {/* --- En-tête avec bouton de tri --- */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Mes Réservations</h2>
                <button 
                  onClick={toggleSortOrder} 
                  className="mb-4 px-4 py-2 bg-zinc-700 text-white rounded shadow hover:bg-zinc-600 focus:outline-none"
                >
                  Trier par date {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              
              {/* --- Liste des réservations ou message vide --- */}
              {currentItems.length > 0 ? (
                <div className="space-y-4">
                  {/* Affichage des réservations de la page courante */}
                  {currentItems.map((res, index) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 rounded-md shadow flex justify-between items-center"
                    >
                      <div>
                        {/* Résumé de la réservation */}
                        <p className="">
                          {res.depart_nom} - {res.arrivee_nom} le {res.date}
                        </p>
                      </div>
                      {/* Bouton pour ouvrir le détail */}
                      <button
                        onClick={() => setSelectedReservation(res)}
                      >
                        <BsTicketDetailed className="text-2xl"/>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune réservation trouvée.</p>
              )}
              
              {/* --- Contrôles de pagination --- */}
              <div className="flex justify-center items-center mt-4 space-x-2">
                
                {/* Bouton page précédente */}
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  ←
                </button>
                
                {/* Numéros de page */}
                {getPageNumbers().map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`px-3 py-1 rounded ${
                      currentPage === pageNumber 
                        ? 'bg-blue-500 text-white'  // Page active
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                
                {/* Bouton page suivante */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === Math.ceil(sortedReservations.length / itemsPerPage)}
                  className={`px-3 py-1 rounded ${
                    currentPage === Math.ceil(sortedReservations.length / itemsPerPage)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  →
                </button>
              </div>
            </div>

            {/* --- Affichage des erreurs globales --- */}
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>
        </div>
      )}

      {/* === MODAL DE DÉTAIL DES RÉSERVATIONS === */}
      {selectedReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal} // Fermeture en cliquant sur l'overlay
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-xl relative"
            onClick={(e) => e.stopPropagation()} // Empêche la fermeture en cliquant sur le contenu
          >
            
            {/* --- Bouton de fermeture --- */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              <AiOutlineClose className="text-xl" />
            </button>

            {/* --- En-tête de la modal --- */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Réservation {selectedReservation.num}
              </h3>
              <p className="text-gray-500 mt-4">
                {selectedReservation.depart_nom} - {selectedReservation.arrivee_nom} le {selectedReservation.date}
              </p>
            </div>

            <hr className="border-gray-200 mb-6" />

            {/* --- Détails des places réservées --- */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className=" p-2 mr-2">
                    <IoTicket />
                  </span>
                  Places réservées
                </h4>
                
                {/* Liste des types de places avec quantités et tarifs */}
                <ul className="space-y-2">
                  {selectedReservation.places.map((place, i) => (
                    <li
                      className="flex justify-between items-center pl-3 text-gray-700"
                      key={i}
                    >
                      <span>{place.type.libelle}</span>
                      <span>
                        {place.quantite} places, {place.tarif} € / place
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* --- Prix total de la réservation --- */}
              <div className="text-right">
                <p className="text-lg font-semibold">
                  Prix total :{" "}
                  {/* Calcul du total en additionnant tous les sous-totaux */}
                  {selectedReservation.places
                    .reduce((acc, place) => acc + place.total, 0)
                    .toFixed(2)}{" "}
                  €
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Compte;