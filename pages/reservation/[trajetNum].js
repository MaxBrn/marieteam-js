'use client';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import Cookie from "js-cookie";
import Cookies from "js-cookie";
import { IoTicket } from "react-icons/io5";
import { BsTicketDetailed } from "react-icons/bs";

export default function Reservation({ trajet }) {
  const [done, setDone] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const calculateTotal = () => {
    return types.reduce((total, { key, tarif }) => {
      return total + formData[key] * tarif;
    }, 0);
  };

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
    { key: 'junior', tarif: trajet.prix[1].tarif },
    { key: 'enfant', tarif: trajet.prix[2].tarif },
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
    const numericValue = value === '' ? 0 : parseInt(value, 10);
    
    const updatedFormData = { ...formData, [name]: numericValue };
  
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
    const timestamp = Date.now();
    return `${idCompte}-${timestamp}`;
  };

  async function recupRes(numRes) {
    try {
      const { data: reservation, error: reservationError } = await supabase
        .from("reservation")
        .select("*")
        .eq("num", numRes)
        .single();

      if (reservationError) throw reservationError;

      const { data: trajet } = await supabase
        .from("trajet")
        .select("*")
        .eq("num", reservation.idTrajet)
        .single();

      const date = trajet.date.substring(8,10)+"/"+trajet.date.substring(5,7)+"/"+trajet.date.substring(0,4) + " de " 
      + trajet.heureDepart.substring(0,2)+"h"+trajet.heureDepart.substring(3,5) 
      + " à " + trajet.heureArrivee.substring(0,2)+"h"+trajet.heureArrivee.substring(3,5);

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

      const { data: placesReserves } = await supabase
        .from("enregistrer")
        .select("*")
        .eq("reservation_num", reservation.num);

      const detailedSeats = await Promise.all(
        placesReserves.map(async (place) => {
          const { data: seatType } = await supabase
            .from("type")
            .select("*")
            .eq("num", place.type_num)
            .single();

          const { data: seatPrice } = await supabase
            .from("tarifer")
            .select("*")
            .eq("liaison_code", liaison.code)
            .eq("type", place.type_num)
            .single();

          const totalPrice = seatPrice.tarif * place.quantite;

          return { ...place, type: seatType, tarif: seatPrice.tarif, total: totalPrice };
        })
      );

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setLoading(true);

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

    let recap='\nRécapitulatif :\n';
    for (let i = 0; i < types.length; i++) {
      if (formData[types[i].key] > 0) {
        recap +=  `${formData[types[i].key]} ${types[i].key} = ${types[i].tarif * formData[types[i].key]} €\n`;
      }
    }

    const confirmation = window.confirm(
      `Confirmez-vous votre réservation pour un total de ${calculateTotal()} € ?\n`+recap
    );

    if (!confirmation) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const idUser = user.id;
      const numReservation = generateUniqueReservationNum(idUser);
      const today = new Date().toISOString().split('T')[0];

      // Insertion de la réservation principale
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

      // Insertion des places réservées
      const insertPromises = [];
      if(formData.adulte > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 1,
            reservation_num: numReservation,
            quantite: formData.adulte
          }])
        );
      }
      if(formData.junior > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 2,
            reservation_num: numReservation,
            quantite: formData.junior
          }])
        );
      }
      if(formData.enfant > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 3,
            reservation_num: numReservation,
            quantite: formData.enfant
          }])
        );
      }
      if(formData.voiture > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 4,
            reservation_num: numReservation,
            quantite: formData.voiture
          }])
        );
      }
      if(formData.camionnette > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 5,
            reservation_num: numReservation,
            quantite: formData.camionnette
          }])
        );
      }
      if(formData.campingCar > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 6,
            reservation_num: numReservation,
            quantite: formData.campingCar
          }])
        );
      }
      if(formData.camion > 0) {
        insertPromises.push(
          supabase.from('enregistrer').insert([{
            type_num: 7,
            reservation_num: numReservation,
            quantite: formData.camion
          }])
        );
      }

      await Promise.all(insertPromises);

      // Récupération des détails de la réservation
      const reservation = await recupRes(numReservation);
      setSelectedReservation(reservation);
      setDone(true);
      
    } catch (error) {
      console.error(error);
      setErrorMessage('Une erreur est survenue lors de la réservation.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <>
    {!loading ? (
      <>
{!done ? (
        <div className="flex items-center justify-center min-h-screen py-16">
          <div className="w-full max-w-lg p-8 shadow-md rounded-lg bg-blue-50">
            <p className="text-lg font-bold mb-4">
              {trajet.portDepart} - {trajet.portArrivee}
            </p>
            <p className="mb-4">
              le {trajet.dateFormat} de {trajet.heureDepartFormat} à {trajet.heureArriveeFormat}
            </p>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
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
        <div className="flex flex-col items-center p-10">
          <div className='mb-10 text-center'>
            <p className='text-xl font-bold text-center mb-2'>Merci pour votre réservation !</p>
            <p>Votre réservation a bien été prise en compte.</p>
            <p>Nous vous remercions de nous avoir choisi, et avons hâte de vous retrouver sur les flots !</p>
            <p className='mt-4 text-right'>L'équipe MarieTeam</p>
          </div>
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
          <button className="bg-sky-900 text-white px-4 py-2 rounded shadow hover:bg-sky-800 transition my-10"
          onClick={() => router.push('/')}>
            Retourner à l'accueil
          </button>
        </div>
      )}
      </>
    ):
    (
      <div className='flex items-center justify-center  py-16'>
        <p className='text-center'>Chargement...</p>
      </div>
    )

    }
      
    </>
  );
}

export async function getServerSideProps(context) {
  const { trajetNum } = context.params;

  console.log(trajetNum);
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
  
  await Promise.all(
    reservation.map(async (res) => {
      const reservationNum = res.num;
  
      const { data: passagerReserv, error: errorPassagerReserv } = await supabase
        .from('enregistrer')
        .select('quantite')
        .eq('reservation_num', reservationNum)
        .or('type_num.eq.1,type_num.eq.2,type_num.eq.3');
  
      if (!errorPassagerReserv) {
        placePassagerReserv += passagerReserv.reduce((sum, row) => sum + row.quantite, 0);
      }
  
      const { data: petitVehiculeReserv, error: errorPetitVehiculeReserv } = await supabase
        .from('enregistrer')
        .select('quantite')
        .eq('reservation_num', reservationNum)
        .or('type_num.eq.4,type_num.eq.5');
  
      if (!errorPetitVehiculeReserv) {
        placePetitVehReserv += petitVehiculeReserv.reduce((sum, row) => sum + row.quantite, 0);
      }
  
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