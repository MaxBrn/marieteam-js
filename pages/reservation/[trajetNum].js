'use client';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import Cookie from "js-cookie";
import Cookies from "js-cookie";
export default function Reservation({ trajet }) {
  const calculateTotal = () => {
    return types.reduce((total, { key, tarif }) => {
      return total + formData[key] * tarif;
    }, 0);
  };
  const router = useRouter();
  const tokenFromCookie = Cookie.get("token");
  if(!tokenFromCookie) {
    alert('Veuillez vous connecter !');
    Cookies.set('resTrajet', trajet.num, { expires: 1, path: '/' });
    router.push('/connexion');
  }

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    adulte: 0,
    junior: 0,
    enfant: 0,
    voiture: 0,
    camionnette: 0,
    campingCar: 0,
    camion: 0,
  });

  const types = [
    { key: 'adulte', tarif: trajet.prix[0].tarif },
    { key: 'junior',tarif: trajet.prix[1].tarif },
    { key: 'enfant', tarif: trajet.prix[2].tarif},
    { key: 'voiture', tarif: trajet.prix[3].tarif },
    { key: 'camionnette', tarif: trajet.prix[4].tarif },
    { key: 'campingCar', tarif: trajet.prix[5].tarif },
    { key: 'camion', tarif: trajet.prix[6].tarif },
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!trajet) {
    return <p>Chargement des données...</p>;
  }
  const handleInputChange2 = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? 0 : parseInt(value, 10); // Remplace NaN par 0 si le champ est vide ou invalide
    
    const updatedFormData = { ...formData, [name]: numericValue };
  
    // Vérification des limites par catégorie
    const totalPassagers =
      updatedFormData.adulte + updatedFormData.junior + updatedFormData.enfant;
    const totalPetitsVehicules =
      updatedFormData.voiture + updatedFormData.camionnette;
    const totalGrandsVehicules =
      updatedFormData.campingCar + updatedFormData.camion;
  
    if (
      (name === 'adulte' || name === 'junior' || name === 'enfant') &&
      totalPassagers > trajet.placePassager
    ) {
      alert('Nombre de passagers dépassé !');
      return;
    }
  
    if (
      (name === 'voiture' || name === 'camionnette') &&
      totalPetitsVehicules > trajet.placePetitVehicule
    ) {
      alert('Nombre de petits véhicules dépassé !');
      return;
    }
  
    if (
      (name === 'campingCar' || name === 'camion') &&
      totalGrandsVehicules > trajet.placeGrandVehicule
    ) {
      alert('Nombre de grands véhicules dépassé !');
      return;
    }
  
    setFormData(updatedFormData);
  };
  
  

  const generateUniqueReservationNum = (idCompte) => {
    const timestamp = Date.now(); // Obtenir le timestamp actuel
    return `${idCompte}-${timestamp}`; // Combinaison du compte et du timestamp
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const totalQuantities =
    formData.adulte +
    formData.junior +
    formData.enfant +
    formData.voiture +
    formData.camionnette +
    formData.campingCar +
    formData.camion;

    if (totalQuantities === 0) {
      setErrorMessage('Veuillez sélectionner au moins une place avant de réserver.');
      setIsSubmitting(false);
      return;
    }

    try {
      
      const { data: { user } } = await supabase.auth.getUser()

      console.log(user);
      const idUser = user.id;
      const numReservation = generateUniqueReservationNum(idUser)
      const { data, error } = await supabase.from('reservation').insert([
        {
          num: numReservation,
          idTrajet: trajet.num,
          idCompte: idUser,
          nom: formData.nom,
          prenom: formData.prenom,
          adr: formData.adresse,
          cp: formData.codePostal,
          ville: formData.ville,
        },
      ]);

      if (error) {
        throw error;
      }

      if(formData.adulte > 0) {
        const {dataRéservation,error} = await supabase.from('enregistrer').insert([
          {
            type_num: 1,
            reservation_num: numReservation,
            quantite: formData.adulte
          }
        ]);
      }
      if(formData.junior > 0) {
        const {dataRéservation,error} = await supabase.from('enregistrer').insert([
          {
            type_num: 2,
            reservation_num: numReservation,
            quantite: formData.junior
          }
        ]);
      }
      if(formData.enfant > 0) {
        const {dataRéservation,error} = await supabase.from('enregistrer').insert([
          {
            type_num: 3,
            reservation_num: numReservation,
            quantite: formData.enfant
          }
        ]);
      }
      if(formData.voiture > 0) {
        const {dataRéservation,error} = await supabase.from('enregistrer').insert([
          {
            type_num: 4,
            reservation_num: numReservation,
            quantite: formData.voiture
          }
        ]);
      }
      if(formData.camionnette > 0) {
        const {dataRéservation,error} = await supabase.from('enregistrer').insert([
          {
            type_num: 5,
            reservation_num: numReservation,
            quantite: formData.camionnette
          }
        ]);
      }
      if(formData.campingCar > 0) {
        const {dataRéservation,error} = await supabase.from('enregistrer').insert([
          {
            type_num: 6,
            reservation_num: numReservation,
            quantite: formData.campingCar
          }
        ]);
      }
      if(formData.camion > 0) {
        const {dataRéservation,error} = await supabase.from('enregistrer').insert([
          {
            type_num: 7,
            reservation_num: numReservation,
            quantite: formData.camion
          }
        ]);
      }
      
      // Redirection ou message de succès
      alert('Réservation enregistrée avec succès !');
      router.push('/'); // Redirige vers une page des réservations, par exemple
    } catch (error) {
      console.error(error);
      setErrorMessage('Une erreur est survenue lors de la réservation.');
    } finally {
      setIsSubmitting(false);
    }

    
    
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-16">
      <div className="w-full max-w-lg p-8 shadow-md rounded-lg bg-blue-50">
        <p className="text-lg font-bold mb-4">
          {trajet.portDepart} - {trajet.portArrivee}
        </p>
        <p className="mb-4">
          le {trajet.dateFormat} de {trajet.heureDepartFormat} à {trajet.heureArriveeFormat}
        </p>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Champs de formulaire */}
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
          
          {/* Champs pour les réservations */}
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
                onChange={handleInputChange}
                className="p-2 border border-gray-300 rounded col-span-1"
                min="0"
              />
            </div>
          ))}


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
          {/* Message d'erreur */}
          {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
        </form>
      </div>
    </div>
  );
}


// Récupération des données côté serveur
export async function getServerSideProps(context) {
  const { trajetNum } = context.params;

  console.log(trajetNum);
  // Requête pour récupérer les informations détaillées du trajet
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


  // Récupération des informations supplémentaires (bateau, ports, etc.)
  const { data: bateau } = await supabase
    .from('bateau')
    .select('nom')
    .eq('id', trajet.idBateau)
    .single();

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




  const {data: reservation, error:errorReservation} = await supabase
    .from('reservation')
    .select('num')
    .eq('idTrajet',trajet.num);

  let placePassagerReserv = 0;
  let placePetitVehReserv = 0;
  let placeGrandVehReserv = 0;
  console.log("Test num res "+reservation[0]);
  await Promise.all(
    reservation.map(async (res) => {
      const reservationNum = res.num; // Supposons que chaque élément contient un champ `num`
  
      // Réservations passager
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
  
      // Réservations petit véhicule
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
  
      // Réservations grand véhicule
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

  const { data: placePassager } = await supabase
    .from('contenir')
    .select('capacite')
    .eq('idBateau', trajet.idBateau)
    .eq('idPlace', 'A')
    .single();

  const { data: placePetitVehicule } = await supabase
    .from('contenir')
    .select('capacite')
    .eq('idBateau', trajet.idBateau)
    .eq('idPlace', 'B')
    .single();

  const { data: placeGrandVehicule } = await supabase
    .from('contenir')
    .select('capacite')
    .eq('idBateau', trajet.idBateau)
    .eq('idPlace', 'C')
    .single();

  const {data: prix } = await supabase 
    .from('tarifer')
    .select('tarif')
    .eq('liaison_code',liaison.code)
    .order('type', {ascending: true});


  const heureDepartFormat = trajet.heureDepart.substring(0,2)+'h'+trajet.heureDepart.substring(3,5);
  const heureArriveeFormat = trajet.heureArrivee.substring(0,2)+'h'+trajet.heureArrivee.substring(3,5);
  const dateFormat = trajet.date.substring(8,10)+'/'+trajet.date.substring(5,7)+'/'+trajet.date.substring(0,4);

  // Calcul du temps de trajet
  const { hours, minutes } = (() => {
    const [heureD, minuteD] = trajet.heureDepart.split(':');
    const [heureA, minuteA] = trajet.heureArrivee.split(':');

    const depart = new Date();
    depart.setHours(heureD, minuteD, 0, 0);

    const arrivee = new Date();
    arrivee.setHours(heureA, minuteA, 0, 0);

    const differenceInMillis = arrivee - depart;
    const differenceInMinutes = Math.floor(differenceInMillis / 60000);

    

    return {
      hours: Math.floor(differenceInMinutes / 60),
      minutes: differenceInMinutes % 60,
    };
  })();

  return {
    props: {
      trajet: {
        ...trajet,
        num: trajetNum,
        nomBateau: bateau.nom,
        tempsTrajet: `${hours}h ${minutes}m`,
        portDepart: portDepart.nom,
        portArrivee: portArrivee.nom,
        placePassager: placePassager.capacite - placePassagerReserv,
        placePetitVehicule: placePetitVehicule.capacite - placePetitVehReserv,
        placeGrandVehicule: placeGrandVehicule.capacite - placeGrandVehReserv,
        heureDepartFormat: heureDepartFormat,
        heureArriveeFormat: heureArriveeFormat,
        dateFormat: dateFormat,
        prix: prix
      },
    },
  };
}