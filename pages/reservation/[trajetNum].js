'use client';

// Importation des modules nécessaires
import { useRouter } from 'next/router'; // Pour la navigation entre les pages
import { supabase } from '@/lib/supabase'; // Client Supabase pour les requêtes base de données
import { useState } from 'react'; // Hook React pour gérer l'état local
import Cookie from "js-cookie"; // Bibliothèque pour gérer les cookies (notez qu'il y a une duplication avec Cookies)
import { IoTicket } from "react-icons/io5"; // Icône de ticket
import LoadingSpinner from '@/components/LoadingSpinner'; // Composant de chargement
import Notification from '@/components/Notification'; // Composant de notification

// Importation des composants de dialogue d'alerte
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Composant reservation - Réservation d'un trajet
 * 
 * Fonctionnalités principales :
 * - Réserver un trajet
 * - Afficher la réservation effectuée en détail
 * - Afficher les tarifs en fonction de la période
 */

export default function Reservation({ trajet }) {
  // États pour gérer les différentes phases du composant
  const [done, setDone] = useState(false); // Indique si la réservation est terminée
  const [selectedReservation, setSelectedReservation] = useState(null); // Stocke les détails de la réservation créée
  const [loading, setLoading] = useState(false); // Indique si une opération de chargement est en cours
  const [notification, setNotification] = useState(null); // Stocke les notifications à afficher
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // Contrôle l'affichage du dialogue de confirmation
  const [reservationData, setReservationData] = useState(null); // Données temporaires pour la confirmation
  const router = useRouter(); // Hook pour la navigation
  
  // Vérification de l'authentification via le token en cookie
  const tokenFromCookie = Cookie.get("token");
  if(!tokenFromCookie) {
    router.push('/'); // Redirection vers l'accueil si pas de token
  }
  
  /**
   * Fonction pour afficher une notification temporaire
   * @param {string} type - Type de notification (error, success, etc.)
   * @param {string} message - Message à afficher
   */
  const showNotification = (type, message) => {
    setNotification({ type, message });
    // Suppression automatique de la notification après 3 secondes
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  /**
   * Calcule le prix total de la réservation
   * @returns {number} Total calculé en euros
   */
  const calculateTotal = () => {
    return types.reduce((total, { key, tarif }) => {
      return total + formData[key] * tarif;
    }, 0);
  };

  // État pour stocker les données du formulaire de réservation
  const [formData, setFormData] = useState({
    // Informations personnelles
    nom: '',
    prenom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    // Quantités de passagers par catégorie
    adulte: 0,
    junior: 0,
    enfant: 0,
    // Quantités de véhicules par type
    voiture: 0,
    camionnette: 0,
    campingCar: 0,
    camion: 0,
  });

  // Configuration des types de places avec leurs tarifs respectifs
  // Les tarifs proviennent de l'objet trajet passé en props
  const types = [
    { key: 'adulte', tarif: trajet.prix[0].tarif },
    { key: 'junior', tarif: trajet.prix[1].tarif },
    { key: 'enfant', tarif: trajet.prix[2].tarif },
    { key: 'voiture', tarif: trajet.prix[3].tarif },
    { key: 'camionnette', tarif: trajet.prix[4].tarif },
    { key: 'campingCar', tarif: trajet.prix[5].tarif },
    { key: 'camion', tarif: trajet.prix[6].tarif },
  ];

  // États additionnels pour gérer la soumission du formulaire
  const [isSubmitting, setIsSubmitting] = useState(false); // Empêche les soumissions multiples
  const [errorMessage, setErrorMessage] = useState(''); // Messages d'erreur à afficher

  // Vérification que les données du trajet sont bien chargées
  if (!trajet) {
    return <p>Chargement des données...</p>;
  }

  /**
   * Gestionnaire pour les champs texte du formulaire (nom, prénom, etc.)
   * @param {Event} e - Événement de changement de l'input
   */
  const handleInputChange2 = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Gestionnaire pour les champs numériques avec validation des capacités
   * @param {Event} e - Événement de changement de l'input
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Conversion en nombre entier (0 si vide)
    const numericValue = value === '' ? 0 : parseInt(value, 10);
    
    // Création d'un objet temporaire avec la nouvelle valeur
    const updatedFormData = { ...formData, [name]: numericValue };
  
    // Calcul des totaux par catégorie pour vérifier les limites
    const totalPassagers =
      updatedFormData.adulte + updatedFormData.junior + updatedFormData.enfant;
    const totalPetitsVehicules =
      updatedFormData.voiture + updatedFormData.camionnette;
    const totalGrandsVehicules =
      updatedFormData.campingCar + updatedFormData.camion;
  
    // Vérifications des limites de capacité avec messages d'erreur
    if (
      (name === 'adulte' || name === 'junior' || name === 'enfant') &&
      totalPassagers > trajet.placePassager
    ) {
      showNotification("error", "Nombre de passagers dépassé !");
      return; // Arrêt de la fonction si limite dépassée
    }
  
    if (
      (name === 'voiture' || name === 'camionnette') &&
      totalPetitsVehicules > trajet.placePetitVehicule
    ) {
      showNotification("error", "Nombre de petits véhicules dépassé !");
      return;
    }
  
    if (
      (name === 'campingCar' || name === 'camion') &&
      totalGrandsVehicules > trajet.placeGrandVehicule
    ) {
      showNotification("error", "Nombre de grands véhicules dépassé !");
      return;
    }
  
    // Mise à jour de l'état si toutes les vérifications passent
    setFormData(updatedFormData);
  };

  /**
   * Génère un numéro de réservation unique basé sur l'ID utilisateur et un timestamp
   * @param {string} idCompte - ID du compte utilisateur
   * @returns {string} Numéro de réservation unique
   */
  const generateUniqueReservationNum = (idCompte) => {
    const timestamp = Date.now();
    return `${idCompte}-${timestamp}`;
  };

  /**
   * Fonction pour récupérer les détails complets d'une réservation
   * @param {string} numRes - Numéro de la réservation
   * @returns {Object|null} Objet contenant tous les détails de la réservation ou null en cas d'erreur
   */
  async function recupRes(numRes) {
    try {
      // Récupération de la réservation principale
      const { data: reservation, error: reservationError } = await supabase
        .from("reservation")
        .select("*")
        .eq("num", numRes)
        .single();

      if (reservationError) throw reservationError;

      // Récupération des informations du trajet associé
      const { data: trajet } = await supabase
        .from("trajet")
        .select("*")
        .eq("num", reservation.idTrajet)
        .single();

      // Formatage de la date et des heures pour l'affichage
      const date = trajet.date.substring(8,10)+"/"+trajet.date.substring(5,7)+"/"+trajet.date.substring(0,4) + " de " 
      + trajet.heureDepart.substring(0,2)+"h"+trajet.heureDepart.substring(3,5) 
      + " à " + trajet.heureArrivee.substring(0,2)+"h"+trajet.heureArrivee.substring(3,5);

      // Récupération des informations de la liaison (ports de départ/arrivée)
      const { data: liaison } = await supabase
        .from("liaison")
        .select("*")
        .eq("code", trajet.idLiaison)
        .single();

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

      // Récupération des places réservées
      const { data: placesReserves } = await supabase
        .from("enregistrer")
        .select("*")
        .eq("reservation_num", reservation.num);

      // Récupération de la période tarifaire correspondant à la date du trajet
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

      // Enrichissement des données de places avec les types et tarifs
      const detailedSeats = await Promise.all(
        placesReserves.map(async (place) => {
          // Récupération du type de place (adulte, junior, etc.)
          const { data: seatType } = await supabase
            .from("type")
            .select("*")
            .eq("num", place.type_num)
            .single();
            
          // Récupération du tarif correspondant
          const { data: seatPrice } = await supabase
            .from("tarifer")
            .select("*")
            .eq("liaison_code", liaison.code)
            .eq("type", place.type_num)
            .eq("idPeriode",periode.id)
            .single();

          // Calcul du prix total pour cette catégorie de places
          const totalPrice = seatPrice.tarif * place.quantite;

          return { ...place, type: seatType, tarif: seatPrice.tarif, total: totalPrice };
        })
      );

      // Retour de l'objet complet avec toutes les informations formatées
      return {
        ...reservation,
        depart_nom: depart.nom,
        arrivee_nom: arrivee.nom,
        date: date,
        places: detailedSeats,
      };
    } catch (err) {
      console.error("Erreur lors de la récupération de la réservation:", err);
      return null;
    }
  }

  /**
   * Gestionnaire de soumission du formulaire
   * @param {Event} e - Événement de soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    setIsSubmitting(true);
    setErrorMessage('');
    setLoading(true);

    // Calcul du nombre total d'éléments réservés
    const totalQuantities =
      formData.adulte +
      formData.junior +
      formData.enfant +
      formData.voiture +
      formData.camionnette +
      formData.campingCar +
      formData.camion;

    // Vérification qu'au moins une place est sélectionnée
    if (totalQuantities === 0) {
      showNotification("error", "Veuillez sélectionner au moins une place avant de réserver.");
      setIsSubmitting(false);
      setLoading(false);
      return;
    }

    // Génération du récapitulatif textuel de la réservation
    let recap='';
    for (let i = 0; i < types.length; i++) {
      if (formData[types[i].key] > 0) {
        recap +=  `${formData[types[i].key]} ${types[i].key} = ${types[i].tarif * formData[types[i].key]} €\n`;
      }
    }

    // Préparation des données pour le dialogue de confirmation
    setReservationData({
      total: calculateTotal(),
      recap: recap
    });
    setShowConfirmDialog(true); // Affichage du dialogue de confirmation
    setIsSubmitting(false);
    setLoading(false);
  };

  /**
   * Fonction de confirmation finale de la réservation
   * Exécutée après validation par l'utilisateur dans le dialogue
   */
  const confirmReservation = async () => {
    setIsSubmitting(true);
    setLoading(true);
    setShowConfirmDialog(false);

    try {
      // Récupération de l'utilisateur authentifié
      const { data: { user } } = await supabase.auth.getUser();
      const idUser = user.id;
      const numReservation = generateUniqueReservationNum(idUser);
      const today = new Date().toISOString().split('T')[0]; // Date du jour au format YYYY-MM-DD

      // Insertion de la réservation principale dans la base de données
      const { error } = await supabase.from('reservation').insert([
        {
          num: numReservation,
          idTrajet: trajet.num,
          idCompte: idUser,
          nom: formData.nom,
          prenom: formData.prenom,
          adr: formData.adresse,
          cp: formData.codePostal,
          ville: formData.ville,
          date: today
        },
      ]);

      if (error) throw error;

      // Préparation des insertions pour chaque type de place réservée
      // Chaque condition vérifie s'il y a des places de ce type à insérer
      const insertPromises = [];
      if(formData.adulte > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 1, // ID du type "adulte"
            reservation_num: numReservation,
            quantite: formData.adulte
          }])
        );
      }
      if(formData.junior > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 2, // ID du type "junior"
            reservation_num: numReservation,
            quantite: formData.junior
          }])
        );
      }
      if(formData.enfant > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 3, // ID du type "enfant"
            reservation_num: numReservation,
            quantite: formData.enfant
          }])
        );
      }
      if(formData.voiture > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 4, // ID du type "voiture"
            reservation_num: numReservation,
            quantite: formData.voiture
          }])
        );
      }
      if(formData.camionnette > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 5, // ID du type "camionnette"
            reservation_num: numReservation,
            quantite: formData.camionnette
          }])
        );
      }
      if(formData.campingCar > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 6, // ID du type "camping-car"
            reservation_num: numReservation,
            quantite: formData.campingCar
          }])
        );
      }
      if(formData.camion > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 7, // ID du type "camion"
            reservation_num: numReservation,
            quantite: formData.camion
          }])
        );
      }

      // Exécution de toutes les insertions en parallèle
      await Promise.all(insertPromises);

      // Récupération des détails complets de la réservation créée
      const reservation = await recupRes(numReservation);
      setSelectedReservation(reservation);
      setDone(true); // Passage à l'écran de confirmation
      showNotification("success", "Réservation effectuée avec succès !");
      
    } catch (error) {
      console.error(error);
      showNotification("error", "Une erreur est survenue lors de la réservation.");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Rendu du composant avec affichage conditionnel selon l'état
  return (
    <>
    {!loading ? (
      <>
      {/* Affichage conditionnel des notifications */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
        />
      )}
      {/* Affichage du formulaire de réservation si pas encore terminé */}
      {!done ? (
        <div className="flex items-center justify-center min-h-screen py-16">
          <div className="w-full max-w-lg p-8 shadow-md rounded-lg bg-blue-50">
            {/* En-tête avec informations du trajet */}
            <p className="text-lg font-bold mb-4">
              {trajet.portDepart} - {trajet.portArrivee}
            </p>
            <p className="mb-4">
              le {trajet.dateFormat} de {trajet.heureDepartFormat} à {trajet.heureArriveeFormat}
            </p>
            
            {/* Formulaire principal de réservation */}
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              {/* Section informations personnelles */}
              <div className="flex gap-4">
                <div className="w-1/2 flex flex-col">
                  <label htmlFor="nom" className="text-gray-700">Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange2}
                    className="p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="w-1/2 flex flex-col">
                  <label htmlFor="prenom" className="text-gray-700">Prénom</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange2}
                    className="p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="flex flex-col">
                <label htmlFor="adresse" className="text-gray-700">Adresse</label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange2}
                  className="p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div className="flex gap-4">
                <div className="w-1/2 flex flex-col">
                  <label htmlFor="codePostal" className="text-gray-700">Code Postal</label>
                  <input
                    type="text"
                    name="codePostal"
                    value={formData.codePostal}
                    onChange={handleInputChange2}
                    className="p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="w-1/2 flex flex-col">
                  <label htmlFor="ville" className="text-gray-700">Ville</label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleInputChange2}
                    className="p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
              </div>
              
              {/* Section sélection des places et véhicules */}
              {types.map((item) => (
                <div
                  className="grid grid-cols-3 items-center gap-4 px-10"
                  key={item.key}
                >
                  <label
                    htmlFor={item.key}
                    className="text-gray-700 capitalize col-span-1"
                  >
                    {item.key}
                  </label>
                  <p className="text-gray-500 text-center col-span-1">{item.tarif} €</p>
                  <input
                    type="number"
                    name={item.key}
                    value={formData[item.key]}
                    onChange={handleInputChange} // Utilise le gestionnaire avec validation
                    className="p-2 border border-gray-300 rounded col-span-1"
                    min="0"
                  />
                </div>
              ))}

              {/* Section récapitulatif et places disponibles */}
              <div>
                <p>Total à payer: {calculateTotal()} €</p>
                <p className='pt-3'>Places disponibles:<br/></p>
                <ul className="pl-2 border-l border-black">
                  <li>Place passager: {trajet.placePassager - (formData.adulte+formData.junior+formData.enfant)} </li>
                  <li>Place véhicule inférieur à 2m: {trajet.placePetitVehicule - (formData.voiture+formData.camionnette)}</li>
                  <li>Place véhicule supérieur à 2m: {trajet.placeGrandVehicule - (formData.camion+formData.campingCar)}</li>
                </ul>
              </div>

              {/* Bouton de soumission */}
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-900 text-white rounded-lg hover:bg-sky-800 transition"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Réserver'}
                </button>
              </div>
              {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
            </form>
          </div>
        </div>
      ) : (
        // Écran de confirmation après réservation réussie
        <div className="flex flex-col items-center p-10">
          <div className='mb-10 text-center'>
            <p className='text-xl font-bold text-center mb-2'>Merci pour votre réservation !</p>
            <p>Votre réservation a bien été prise en compte.</p>
            <p>Nous vous remercions de nous avoir choisi, et avons hâte de vous retrouver sur les flots !</p>
            <p className='mt-4 text-right'>L'équipe MarieTeam</p>
          </div>
          
          {/* Récapitulatif détaillé de la réservation */}
          <div className="w-full max-w-2xl p-8 border-t-2">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Réservation {selectedReservation?.num}
              </h3>
              <p className="text-gray-500 mt-4">
                {selectedReservation?.depart_nom} - {selectedReservation?.arrivee_nom} le {selectedReservation?.date}
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div className="bg-blue-50 p-4 rounded-md shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="p-2 mr-2">
                    <IoTicket />
                  </span>
                  Places réservées
                </h4>
                <ul className="space-y-2">
                  {selectedReservation?.places?.map((place, i) => (
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

              <div className="text-right">
                <p className="text-lg font-semibold">
                  Prix total:{" "}
                  {selectedReservation?.places?.reduce((acc, place) => acc + place.total, 0).toFixed(2)} €
                </p>
              </div>
            </div>
          </div>
          
          {/* Bouton de retour à l'accueil */}
          <button className="bg-sky-900 text-white px-4 py-2 rounded shadow hover:bg-sky-800 transition my-10"
          onClick={() => router.push('/')}>
            Retourner à l'accueil
          </button>
        </div>
      )}
      </>
    ):
    (
      // Écran de chargement pendant les opérations
      <div className="w-full flex justify-center items-center min-h-[500px]">
        <LoadingSpinner text="Réservation en cours ..." />
      </div>
    )}

    {/* Dialogue de confirmation de réservation */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer votre réservation</AlertDialogTitle>
          <AlertDialogDescription>
            Confirmez-vous votre réservation pour un total de {reservationData?.total} € ?
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
              <p className="font-semibold">Récapitulatif :</p>
              {reservationData?.recap && reservationData.recap.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction className="bg-sky-900 hover:bg-sky-800" onClick={confirmReservation}>Confirmer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
      
    </>
  );
}

/**
 * Fonction getServerSideProps - Exécutée côté serveur avant le rendu de la page
 * Récupère toutes les données nécessaires pour afficher le formulaire de réservation
 * @param {Object} context - Contexte Next.js contenant les paramètres de la route
 * @returns {Object} Props à passer au composant
 */
export async function getServerSideProps(context) {
  const { trajetNum } = context.params; // Récupération du numéro de trajet depuis l'URL

  console.log(trajetNum);
  
  // Récupération des informations de base du trajet
  const { data: trajet, error } = await supabase
    .from('trajet')
    .select('num, heureDepart, heureArrivee, idBateau, idLiaison, date')
    .eq('num', trajetNum)
    .single();

  if (trajet) {
    console.log('trajet trouvé');
  } else {
    console.log('trajet non trouvé');
  }

  // Récupération du nom du bateau
  const { data: bateau } = await supabase
    .from('bateau')
    .select('nom')
    .eq('id', trajet.idBateau)
    .single();

  // Récupération des informations de liaison (ports de départ/arrivée)
  const { data: liaison } = await supabase
    .from('liaison')
    .select('code, depart_id, arrivee_id')
    .eq('code', trajet.idLiaison)
    .single();

  const { data: portDepart } = await supabase
    .from('port')
    .select('nom')
    .eq('id', liaison.depart_id)
    .single();

  const { data: portArrivee } = await supabase
    .from('port')
    .select('nom')
    .eq('id', liaison.arrivee_id)
    .single();

  // Récupération de toutes les réservations existantes pour ce trajet
  const {data: reservation, error:errorReservation} = await supabase
    .from('reservation')
    .select('num')
    .eq('idTrajet',trajet.num);

  // Initialisation des compteurs de places réservées
  let placePassagerReserv = 0;      // Total des passagers déjà réservés
  let placePetitVehReserv = 0;      // Total des petits véhicules déjà réservés
  let placeGrandVehReserv = 0;      // Total des grands véhicules déjà réservés
  
  // Calcul des places déjà réservées pour chaque catégorie
  await Promise.all(
    reservation.map(async (res) => {
      const reservationNum = res.num;
  
      // Comptage des passagers (adultes, juniors, enfants - types 1, 2, 3)
      const { data: passagerReserv, error: errorPassagerReserv } = await supabase
        .from('enregistrer')
        .select('quantite')
        .eq('reservation_num', reservationNum)
        .or('type_num.eq.1,type_num.eq.2,type_num.eq.3');
  
      if (!errorPassagerReserv) {
        placePassagerReserv += passagerReserv.reduce((sum, row) => sum + row.quantite, 0);
      }
  
      // Comptage des petits véhicules (voitures, camionnettes - types 4, 5)
      const { data: petitVehiculeReserv, error: errorPetitVehiculeReserv } = await supabase
        .from('enregistrer')
        .select('quantite')
        .eq('reservation_num', reservationNum)
        .or('type_num.eq.4,type_num.eq.5');
  
      if (!errorPetitVehiculeReserv) {
        placePetitVehReserv += petitVehiculeReserv.reduce((sum, row) => sum + row.quantite, 0);
      }
  
      // Comptage des grands véhicules (camping-cars, camions - types 6, 7)
      const { data: grandVehiculeReserv, error: errorGrandVehiculeReserv } = await supabase
        .from('enregistrer')
        .select('quantite')
        .eq('reservation_num', reservationNum)
        .or('type_num.eq.6,type_num.eq.7');
  
      if (!errorGrandVehiculeReserv) {
        placeGrandVehReserv += grandVehiculeReserv.reduce((sum, row) => sum + row.quantite, 0);
      }
    })
  );

  // Récupération des capacités maximales du bateau pour chaque type de place
  const { data: placePassager } = await supabase
    .from('contenir')
    .select('capacite')
    .eq('idBateau', trajet.idBateau)
    .eq('idPlace', 'A')  // 'A' correspond aux places passagers
    .single();

  const { data: placePetitVehicule } = await supabase
    .from('contenir')
    .select('capacite')
    .eq('idBateau', trajet.idBateau)
    .eq('idPlace', 'B')  // 'B' correspond aux petits véhicules
    .single();

  const { data: placeGrandVehicule } = await supabase
    .from('contenir')
    .select('capacite')
    .eq('idBateau', trajet.idBateau)
    .eq('idPlace', 'C')  // 'C' correspond aux grands véhicules
    .single();

  console.log(trajet.date);

  // Détermination de la période tarifaire pour ce trajet
  // La période est déterminée en fonction de la date du trajet
  const { data: periode, error: periodeError } = await supabase
    .from('periode')
    .select('id')
    .lte('dateDeb', trajet.date)  // dateDeb <= trajet.date
    .gte('dateFin', trajet.date)  // dateFin >= trajet.date
    .single();

  if (periodeError || !periode) {
    console.error("Erreur lors de la récupération de la période:", periodeError);
    // Retour d'une erreur 404 si aucune période n'est trouvée
    return {
      notFound: true,
    };
  }

  console.log("Période trouvée:", periode);

  // Récupération des tarifs en fonction de la liaison et de la période
  const { data: prix, error: prixError } = await supabase 
    .from('tarifer')
    .select('tarif, type')
    .eq('liaison_code', liaison.code)
    .eq('idPeriode', periode.id)
    .order('type', { ascending: true }); // Tri par type pour un ordre cohérent

  if (prixError) {
    console.error("Erreur lors de la récupération des tarifs:", prixError);
    return {
      notFound: true,
    };
  }

  console.log("Tarifs trouvés:", prix);

  // Formatage des heures pour l'affichage (HH:MM vers HHhMM)
  const heureDepartFormat = trajet.heureDepart.substring(0,2)+'h'+trajet.heureDepart.substring(3,5);
  const heureArriveeFormat = trajet.heureArrivee.substring(0,2)+'h'+trajet.heureArrivee.substring(3,5);
  // Formatage de la date pour l'affichage (YYYY-MM-DD vers DD/MM/YYYY)
  const dateFormat = trajet.date.substring(8,10)+'/'+trajet.date.substring(5,7)+'/'+trajet.date.substring(0,4);

  // Calcul de la durée du trajet
  const { hours, minutes } = (() => {
    const [heureD, minuteD] = trajet.heureDepart.split(':');
    const [heureA, minuteA] = trajet.heureArrivee.split(':');

    // Création d'objets Date pour calculer la différence
    const depart = new Date();
    depart.setHours(heureD, minuteD, 0, 0);

    const arrivee = new Date();
    arrivee.setHours(heureA, minuteA, 0, 0);

    // Calcul de la différence en millisecondes puis conversion en minutes
    const differenceInMillis = arrivee - depart;
    const differenceInMinutes = Math.floor(differenceInMillis / 60000);

    // Conversion en heures et minutes
    return {
      hours: Math.floor(differenceInMinutes / 60),
      minutes: differenceInMinutes % 60,
    };
  })();

  // Retour des props pour le composant
  // Toutes les données sont formatées et les places disponibles sont calculées
  return {
    props: {
      trajet: {
        ...trajet,
        num: trajetNum,
        nomBateau: bateau.nom,
        tempsTrajet: `${hours}h ${minutes}m`,
        portDepart: portDepart.nom,
        portArrivee: portArrivee.nom,
        // Calcul des places disponibles = capacité totale - places déjà réservées
        placePassager: placePassager.capacite - placePassagerReserv,
        placePetitVehicule: placePetitVehicule.capacite - placePetitVehReserv,
        placeGrandVehicule: placeGrandVehicule.capacite - placeGrandVehReserv,
        heureDepartFormat: heureDepartFormat,
        heureArriveeFormat: heureArriveeFormat,
        dateFormat: dateFormat,
        prix: prix // Tableau des tarifs par type
      },
    },
  };
}