'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import Cookie from "js-cookie";
import Cookies from "js-cookie";
import Notification from '@/components/Notification';
import { useRouter } from 'next/router';

/**
 * Composant principal pour la liste et la recherche de trajets de ferry
 * Permet aux utilisateurs de :
 * - Sélectionner un secteur et une liaison
 * - Choisir une date de voyage
 * - Rechercher les trajets disponibles
 * - Voir les détails d'un trajet et faire une réservation
 */
export default function ListeTrajet() {
  // ===== ÉTATS DU COMPOSANT =====
  
  // Liste des trajets trouvés après recherche
  const [trajetList, setTrajetList] = useState([]);
  
  // Trajet actuellement sélectionné pour voir les détails
  const [selectedTrajet, setSelectedTrajet] = useState(null);
  
  // Champs de recherche (non utilisés dans le formulaire final)
  const [depart, setDepart] = useState('');
  const [arrivee, setArrivee] = useState('');
  const [date, setDate] = useState('');
  
  // Données pour les listes déroulantes
  const [secteurs, setSecteurs] = useState([]);  // Liste de tous les secteurs
  const [selectedSecteur, setSelectedSecteur] = useState(''); // Secteur sélectionné
  const [liaisons, setLiaisons] = useState([]); // Liaisons du secteur sélectionné
  const [selectedLiaison, setSelectedLiaison] = useState(''); // Liaison sélectionnée
  
  // États de chargement et messages
  const [loading, setLoading] = useState(false); // Chargement de la recherche
  const [loadingSecteurs, setLoadingSecteurs] = useState(false); // Chargement des secteurs
  const [loadingLiaisons, setLoadingLiaisons] = useState(false); // Chargement des liaisons
  const [message, setMessage] = useState(''); // Messages d'erreur
  
  // Date minimale (aujourd'hui) pour le sélecteur de date
  const today = new Date().toISOString().split('T')[0];
  const router = useRouter();

  // ===== EFFECTS (CHARGEMENT DES DONNÉES) =====
  
  /**
   * Effect : Chargement initial de tous les secteurs disponibles
   * Se déclenche une seule fois au montage du composant
   */
  useEffect(() => {
    const fetchSecteurs = async () => {
      setLoadingSecteurs(true);
      const { data: secteurs, error } = await supabase.from('secteur').select('*');
      if (error) {
        console.error('Erreur lors de la récupération des secteurs:', error.message);
      } else {
        setSecteurs(secteurs);
      }
      setLoadingSecteurs(false);
    };
    fetchSecteurs();
  }, []);

  /**
   * Effect : Chargement des liaisons quand un secteur est sélectionné
   * Pour chaque liaison, récupère aussi les noms des ports de départ et d'arrivée
   */
  useEffect(() => {
    if (!selectedSecteur) return;
    setLoadingLiaisons(true);
    
    const fetchLiaisons = async () => {
      // Récupération des liaisons du secteur sélectionné
      const { data: liaisons, error } = await supabase
        .from('liaison')
        .select('*')
        .eq('secteur_id', selectedSecteur);

      if (error) {
        console.error('Erreur lors de la récupération des liaisons:', error.message);
      } else {
        // Pour chaque liaison, on récupère les noms des ports
        const liaisonsAvecPorts = await Promise.all(
          liaisons.map(async (liaison) => {
            // Récupération du nom du port de départ
            const { data: portDepart, error: errorDepart } = await supabase
              .from('port')
              .select('nom')
              .eq('id', liaison.depart_id)
              .single();

            // Récupération du nom du port d'arrivée
            const { data: portArrivee, error: errorArrivee } = await supabase
              .from('port')
              .select('nom')
              .eq('id', liaison.arrivee_id)
              .single();

            // Retour de la liaison enrichie avec les noms des ports
            return {
              ...liaison,
              portDepart: portDepart?.nom || 'Inconnu',
              portArrivee: portArrivee?.nom || 'Inconnu',
            };
          })
        );

        setLiaisons(liaisonsAvecPorts);
      }
      setLoadingLiaisons(false);
    };

    fetchLiaisons();
  }, [selectedSecteur]); // Se déclenche à chaque changement de secteur

  // ===== FONCTIONS UTILITAIRES =====
  
  /**
   * Calcule la durée d'un trajet en heures et minutes
   * @param {string} heureDepart - Heure de départ au format "HH:MM"
   * @param {string} heureArrivee - Heure d'arrivée au format "HH:MM"
   * @returns {Object} - {hours: number, minutes: number}
   */
  const calculerTempsTrajet = (heureDepart, heureArrivee) => {
    const [heureD, minuteD] = heureDepart.split(':');
    const [heureA, minuteA] = heureArrivee.split(':');

    const depart = new Date();
    depart.setHours(heureD, minuteD, 0, 0);

    const arrivee = new Date();
    arrivee.setHours(heureA, minuteA, 0, 0);

    const differenceInMillis = arrivee - depart;
    const differenceInMinutes = Math.floor(differenceInMillis / 60000); // 60000 ms = 1 minute

    const hours = Math.floor(differenceInMinutes / 60);
    const minutes = differenceInMinutes % 60;
    
    return { hours, minutes };
  };

  // ===== FONCTION PRINCIPALE DE RECHERCHE =====
  
  /**
   * Fonction complexe qui recherche tous les trajets disponibles
   * pour une liaison et une date données
   * 
   * Étapes :
   * 1. Trouve les ports de départ et d'arrivée
   * 2. Trouve la liaison entre ces ports
   * 3. Récupère tous les trajets pour cette liaison à la date donnée
   * 4. Pour chaque trajet, récupère les infos du bateau et calcule les places disponibles
   */
  const rechercheTrajets = async (depart, arrivee, date) => {
    try {
      // === ÉTAPE 1 : EXTRACTION DES NOMS DE PORTS ===
      console.log(selectedLiaison);
      const nomDepart = selectedLiaison?.split(' → ')[0] || '';  // Ex: "Marseille"
      const nomArrivee= selectedLiaison?.split(' → ')[1] || ''; // Ex: "Corsica"
      
      // === ÉTAPE 2 : RECHERCHE DU PORT DE DÉPART ===
      const { data: portDepart, error: errorPortDepart } = await supabase
        .from('port')
        .select('id, nom')
        .ilike('nom', `%${nomDepart}%`)
        .single();

      if (errorPortDepart || !portDepart) {
        throw new Error('Port de départ introuvable');
      }

      // === ÉTAPE 3 : RECHERCHE DU PORT D'ARRIVÉE ===
      const { data: portArrivee, error: errorPortArrivee } = await supabase
        .from('port')
        .select('id, nom')
        .ilike('nom', `%${nomArrivee}%`)
        .single();

      if (errorPortArrivee || !portArrivee) {
        throw new Error("Port d'arrivée introuvable");
      }

      // === ÉTAPE 4 : RECHERCHE DE LA LIAISON ===
      const { data: liaison, error: errorLiaison } = await supabase
        .from('liaison')
        .select('code')
        .eq('depart_id', portDepart.id)
        .eq('arrivee_id', portArrivee.id)
        .single();

      if (errorLiaison || !liaison) {
        throw new Error('Aucune liaison trouvée entre ces ports');
      }

      // === ÉTAPE 5 : RECHERCHE DES TRAJETS ===
      const { data: trajets, error: errorTrajets } = await supabase
        .from('trajet')
        .select('num, heureDepart, heureArrivee, idBateau')
        .eq('idLiaison', liaison.code)
        .eq('date', date);

      if (errorTrajets) {
        throw new Error('Erreur lors de la recherche des trajets');
      }

      if (!trajets || trajets.length === 0) {
        throw new Error('Aucun trajet trouvé pour cette liaison et cette date');
      }

      // === ÉTAPE 6 : ENRICHISSEMENT DES TRAJETS AVEC INFOS BATEAU ET PLACES ===
      const trajetsAvecBateau = await Promise.all(
        trajets.map(async (trajet) => {
          // --- Récupération du nom du bateau ---
          const { data: bateau, error: errorBateau } = await supabase
            .from('bateau')
            .select('nom')
            .eq('id', trajet.idBateau)
            .single();

          if (errorBateau) {
            console.error('Erreur lors de la récupération du bateau pour le trajet', trajet.id);
            return { ...trajet, nomBateau: 'Inconnu' };
          }

          // --- Calcul des places réservées ---
          // Récupération de toutes les réservations pour ce trajet
          const {data: reservation, error:errorReservation} = await supabase
            .from('reservation')
            .select('num')
            .eq('idTrajet',trajet.num);

          console.log(reservation);
          let placePassagerReserv = 0;
          let placePetitVehReserv = 0;
          let placeGrandVehReserv = 0;
          
          console.log("Test num res "+reservation[0]);
          
          // Pour chaque réservation, on compte les places réservées par type
          await Promise.all(
            reservation.map(async (res) => {
              const reservationNum = res.num;
          
              // === Comptage des réservations PASSAGER (types 1, 2, 3) ===
              const { data: passagerReserv, error: errorPassagerReserv } = await supabase
                .from('enregistrer')
                .select('quantite')
                .eq('reservation_num', reservationNum)
                .or('type_num.eq.1,type_num.eq.2,type_num.eq.3');
          
              if (errorPassagerReserv) {
                console.error('Erreur lors de la récupération des réservations passager :', errorPassagerReserv.message);
              } else {
                placePassagerReserv += passagerReserv.reduce((sum, row) => sum + row.quantite, 0);
              }
          
              // === Comptage des réservations PETIT VÉHICULE (types 4, 5) ===
              const { data: petitVehiculeReserv, error: errorPetitVehiculeReserv } = await supabase
                .from('enregistrer')
                .select('quantite')
                .eq('reservation_num', reservationNum)
                .or('type_num.eq.4,type_num.eq.5');
          
              if (errorPetitVehiculeReserv) {
                console.error('Erreur dans la récupération des réservations petit véhicule :', errorPetitVehiculeReserv.message);
              } else {
                placePetitVehReserv += petitVehiculeReserv.reduce((sum, row) => sum + row.quantite, 0);
              }
          
              // === Comptage des réservations GRAND VÉHICULE (types 6, 7) ===
              const { data: grandVehiculeReserv, error: errorGrandVehiculeReserv } = await supabase
                .from('enregistrer')
                .select('quantite')
                .eq('reservation_num', reservationNum)
                .or('type_num.eq.6,type_num.eq.7');
          
              if (errorGrandVehiculeReserv) {
                console.error('Erreur dans la récupération des réservations grand véhicule :', errorGrandVehiculeReserv.message);
              } else {
                placeGrandVehReserv += grandVehiculeReserv.reduce((sum, row) => sum + row.quantite, 0);
              }
            })
          );
          
          console.log("Réservation grand vehicule: "+placeGrandVehReserv);

          // --- Récupération des capacités totales du bateau ---
          
          // Capacité passager (place type A)
          const {data: placePassager, error: errorPassager} = await supabase
            .from('contenir')
            .select('capacite')
            .eq('idBateau',trajet.idBateau)
            .eq('idPlace','A')
            .single();

          // Capacité petit véhicule (place type B)
          const {data: placePetitVehicule, error: errorPetitVehicule} = await supabase
            .from('contenir')
            .select('capacite')
            .eq('idBateau',trajet.idBateau)
            .eq('idPlace','B')
            .single();

          // Capacité grand véhicule (place type C)
          const {data: placeGrandVehicule, error: errorGrandVehicule} = await supabase
            .from('contenir')
            .select('capacite')
            .eq('idBateau', trajet.idBateau)
            .eq('idPlace','C')
            .single();

          // --- Calcul du temps de trajet ---
          const { hours, minutes } = calculerTempsTrajet(trajet.heureDepart, trajet.heureArrivee);
          
          // --- Retour des données enrichies du trajet ---
          if(hours > 0) {
            return { 
              ...trajet, 
              nomBateau: bateau.nom, 
              tempsTrajet: `${hours}h ${minutes}m`, 
              portDepart: portDepart.nom,
              portArrivee: portArrivee.nom, 
              placePassager: placePassager.capacite - placePassagerReserv, 
              placePetitVehicule: placePetitVehicule.capacite - placePetitVehReserv,
              placeGrandVehicule: placeGrandVehicule.capacite - placeGrandVehReserv 
            };
          } else {
            return { 
              ...trajet, 
              nomBateau: bateau.nom, 
              tempsTrajet: `${minutes}m`, 
              portDepart: portDepart.nom, 
              portArrivee: portArrivee.nom, 
              placePassager: placePassager.capacite - placePassagerReserv, 
              placePetitVehicule: placePetitVehicule.capacite - placePetitVehReserv,
              placeGrandVehicule: placeGrandVehicule.capacite - placeGrandVehReserv
            };
          }
        })
      );

      return trajetsAvecBateau;
    } catch (error) {
      console.error('Erreur lors de la recherche des trajets :', error.message);
      throw error;
    }
  };

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====
  
  /**
   * Gestionnaire de soumission du formulaire de recherche
   * Lance la recherche des trajets avec les paramètres sélectionnés
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
  
    try {
      const trajets = await rechercheTrajets(depart, arrivee, date);
      setTrajetList(trajets);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
      setTrajetList([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestionnaire de clic sur un trajet dans la liste
   * Sélectionne le trajet pour afficher ses détails
   */
  const handleTrajetClick = (trajet) => {
    setSelectedTrajet(trajet);
  };

  /**
   * Gestionnaire de clic sur le bouton "Réserver"
   * Vérifie si l'utilisateur est connecté avant de permettre la réservation
   */
  const handleReservationClick = (e, trajetNum) => {
    const tokenFromCookie = Cookies.get("token");
    
    // Vérifie si le token est présent (utilisateur connecté)
    if (!tokenFromCookie) {
      e.preventDefault(); // Empêche le lien de fonctionner immédiatement
      
      // Enregistre l'ID du trajet dans les cookies pour après connexion
      Cookies.set('resTrajet', trajetNum, { expires: 1, path: '/' });

      // Redirige l'utilisateur vers la page de connexion
      router.push('/connexion');
    }
    // Si token présent, le lien fonctionne normalement
  };
  
  // ===== RENDU DU COMPOSANT =====
  return (
    <div className="pt-16 pb-8 w-9/12 mx-auto">
      {/* === SECTION : FORMULAIRE DE RECHERCHE === */}
      {loadingSecteurs ? (
        // Affichage du loading pendant le chargement des secteurs
        <div className="w-full flex justify-center items-center min-h-[200px]">
          <LoadingSpinner text="Chargement des secteurs..." />
        </div>
      ) : (
        <form className="lg:w-1/2 m-auto mb-10" onSubmit={handleSubmit}>
          {/* Liste déroulante pour sélectionner un secteur */}
          <select
            value={selectedSecteur}
            onChange={(e) => setSelectedSecteur(e.target.value)}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
          >
            <option value="">Sélectionner un secteur</option>
            {secteurs.map((secteur) => (
              <option key={secteur.id} value={secteur.id}>
                {secteur.nom}
              </option>
            ))}
          </select>

          {/* Liste déroulante des liaisons (affichée seulement si un secteur est sélectionné) */}
          {selectedSecteur && (
            loadingLiaisons ? (
              // Loading pendant le chargement des liaisons
              <div className="w-full flex flex-col justify-center items-center ">
                <LoadingSpinner text="Chargement des liaisons..." />
              </div>
            ) : (
              // Liste déroulante des liaisons
              <select
                className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
                value={selectedLiaison}
                onChange={(e) => setSelectedLiaison(e.target.value)}
              >
                <option value="">Sélectionnez une liaison</option>
                {liaisons.map((liaison) => (
                  <option key={liaison.id} value={liaison.id}>
                    {liaison.portDepart} → {liaison.portArrivee}
                  </option>
                ))}
              </select>
            )
          )}

          {/* Sélecteur de date (minimum aujourd'hui) */}
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
          />

          {/* Bouton de soumission */}
          <button
            type="submit"
            className="block w-full px-4 py-2 bg-sky-900 text-white rounded-md"
          >
            {loading ? 'Recherche en cours...' : 'Rechercher'}
          </button>
        </form>
      )}
      
      {/* Affichage des messages d'erreur */}
      {message && <p className="text-red-500">{message}</p>}

      {/* === SECTION : RÉSULTATS DE LA RECHERCHE === */}
      <div className="flex">
        {loading ? (
          // Loading pendant la recherche des trajets
          <div className="w-full flex justify-center items-center min-h-[100px]">
            <LoadingSpinner text="Chargement des trajets..." />
          </div>
        ) : (
          // === COLONNE GAUCHE : LISTE DES TRAJETS ===
          <div
            className="flex flex-col w-2/3 overflow-y-auto max-h-[400px] pr-4
            [&::-webkit-scrollbar]:w-1
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300 mr-40 snap-y gap-y-10"
            style={{
              height: '275px',
            }}
          >
            {trajetList.map((trajet) => (
              // Carte de trajet cliquable
              <div
                key={trajet.id}
                className="w-full m-auto flex rounded-md bg-blue-50 snap-start cursor-pointer"
                onClick={() => handleTrajetClick(trajet)}
              >
                {/* Section horaires (colonne gauche de la carte) */}
                <div className="w-[10%] text-center border-r-4 border-white py-2">
                  <p>
                    {trajet.heureDepart.substring(0,5)}<br />
                    {trajet.heureArrivee.substring(0,5)}
                  </p>
                </div>
                {/* Section infos bateau (colonne droite de la carte) */}
                <div className="w-[90%] pl-5 m-auto">
                  <p>{trajet.nomBateau}</p>
                  <p>{trajet.tempsTrajet}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === COLONNE DROITE : DÉTAILS DU TRAJET SÉLECTIONNÉ === */}
        {selectedTrajet ? (
          <div className="w-1/3 m-auto rounded-md bg-blue-50 p-3">
            {/* Section horaires et ports */}
            <div>
              <p>
                {selectedTrajet.heureDepart.substring(0,5)} - {selectedTrajet.portDepart} <br />
                {selectedTrajet.heureArrivee.substring(0,5)} - {selectedTrajet.portArrivee}<br />
              </p>
            </div>
            
            {/* Section bouton de réservation */}
            <div className="py-5 w-full border-b-4 border-white">
              <Link 
                href={`/reservation/${selectedTrajet.num}`} 
                onClick={(e) => handleReservationClick(e, selectedTrajet.num)} 
                className="p-3 bg-sky-900 rounded-xl text-white w-[80%] m-auto block text-center"
              >
                Réserver ce trajet
              </Link>
            </div>
            
            {/* Section informations sur les places disponibles */}
            <div className="pt-5">
              <p>
                {selectedTrajet.nomBateau} <br/>
                Places disponibles:<br/>
              </p>
              <ul className="pl-2 border-l border-black">
                <li>Place passager: {selectedTrajet.placePassager} </li>
                <li>Place véhicule inférieur à 2m: {selectedTrajet.placePetitVehicule}</li>
                <li>Place véhicule supérieur à 2m: {selectedTrajet.placeGrandVehicule}</li>
              </ul>
            </div>
          </div>
        ) : (
          // Rien à afficher si aucun trajet n'est sélectionné
          <></>
        )}
      </div>
    </div>
  );
}