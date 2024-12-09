'use client';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ListeTrajet() {
  const [trajetList, setTrajetList] = useState([]);
  const [selectedTrajet, setSelectedTrajet] = useState(null);
  const [depart, setDepart] = useState('');
  const [arrivee, setArrivee] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fonction pour calculer la différence en minutes entre l'heure de départ et l'heure d'arrivée
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

  const rechercheTrajets = async (depart, arrivee, date) => {
    try {
      // Recherche du port de départ
      const { data: portDepart, error: errorPortDepart } = await supabase
        .from('port')
        .select('id, nom')
        .ilike('nom', `%${depart}%`)
        .single();

      if (errorPortDepart || !portDepart) {
        throw new Error('Port de départ introuvable');
      }

      // Recherche du port d'arrivée
      const { data: portArrivee, error: errorPortArrivee } = await supabase
        .from('port')
        .select('id, nom')
        .ilike('nom', `%${arrivee}%`)
        .single();

      if (errorPortArrivee || !portArrivee) {
        throw new Error("Port d'arrivée introuvable");
      }

      // Recherche de la liaison entre les ports
      const { data: liaison, error: errorLiaison } = await supabase
        .from('liaison')
        .select('code')
        .eq('depart_id', portDepart.id)
        .eq('arrivee_id', portArrivee.id)
        .single();

      if (errorLiaison || !liaison) {
        throw new Error('Aucune liaison trouvée entre ces ports');
      }

      // Recherche des trajets pour la liaison et la date spécifiée
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


      // Recherche des informations sur les bateaux pour chaque trajet
      const trajetsAvecBateau = await Promise.all(
        trajets.map(async (trajet) => {
          const { data: bateau, error: errorBateau } = await supabase
            .from('bateau')
            .select('nom')
            .eq('id', trajet.idBateau)
            .single();

          if (errorBateau) {
            console.error('Erreur lors de la récupération du bateau pour le trajet', trajet.id);
            return { ...trajet, nomBateau: 'Inconnu' };
          }

          const {data: reservation, error:errorReservation} = await supabase
            .from('reservation')
            .select('num')
            .eq('idTrajet',trajet.num);

          console.log(reservation);
          

          
          const {data: placePassager, error: errorPassager} = await supabase
            .from('contenir')
            .select('capacite')
            .eq('idBateau',trajet.idBateau)
            .eq('idPlace','A')
            .single();

          const {data: placePetitVehicule, error: errorPetitVehicule} = await supabase
            .from('contenir')
            .select('capacite')
            .eq('idBateau',trajet.idBateau)
            .eq('idPlace','B')
            .single();

          const {data: placeGrandVehicule, error: errorGrandVehicule} = await supabase
            .from('contenir')
            .select('capacite')
            .eq('idBateau', trajet.idBateau)
            .eq('idPlace','C')
            .single();

          // Calcul du temps de trajet
          const { hours, minutes } = calculerTempsTrajet(trajet.heureDepart, trajet.heureArrivee);
          if(hours > 0) {
            return { ...trajet, nomBateau: bateau.nom, tempsTrajet: `${hours}h ${minutes}m`, portDepart: portDepart.nom,
             portArrivee: portArrivee.nom, placePassager: placePassager.capacite, placePetitVehicule: placePetitVehicule.capacite,
             placeGrandVehicule: placeGrandVehicule.capacite };
          }
          else {
            return { ...trajet, nomBateau: bateau.nom, tempsTrajet: `${minutes}m`, portDepart: portDepart.nom, 
            portArrivee: portArrivee.nom, placePassager: placePassager.capacite, placePetitVehicule: placePetitVehicule.capacite,
            placeGrandVehicule: placeGrandVehicule.capacite };
          }
        })
      );

      return trajetsAvecBateau;
    } catch (error) {
      console.error('Erreur lors de la recherche des trajets :', error.message);
      throw error;
    }
  };

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

  const handleTrajetClick = (trajet) => {
    setSelectedTrajet(trajet);
  };

  return (
    <div className="py-16 w-9/12 m-auto">
      <form className="w-1/2 m-auto mb-10" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Saisir un départ"
          value={depart}
          onChange={(e) => setDepart(e.target.value)}
          className="block w-full px-4 py-2 border rounded-md mb-2"
        />
        <input
          type="text"
          placeholder="Saisir une arrivée"
          value={arrivee}
          onChange={(e) => setArrivee(e.target.value)}
          className="block w-full px-4 py-2 border rounded-md mb-2"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="block w-full px-4 py-2 border rounded-md mb-4"
        />
        <button
          type="submit"
          className="block w-full px-4 py-2 bg-sky-900 text-white rounded-md"
        >
          {loading ? 'Recherche en cours...' : 'Rechercher'}
        </button>
      </form>
      {message && <p className="text-red-500">{message}</p>}

      <div className="flex">
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
            <div
              key={trajet.id}
              className="w-full m-auto flex rounded-md bg-blue-50 snap-start cursor-pointer"
              onClick={() => handleTrajetClick(trajet)}
            >
              <div className="w-[10%] text-center border-r-4 border-white py-2">
                <p>
                  {trajet.heureDepart.substring(0,5)}<br />
                  {trajet.heureArrivee.substring(0,5)}
                </p>
              </div>
              <div className="w-[90%] pl-5 m-auto">
                <p>{trajet.nomBateau}</p>
                <p>{trajet.tempsTrajet}</p>
              </div>
            </div>
          ))}
        </div>
        
          {selectedTrajet ? (
            <>
            <div className="w-1/3 m-auto rounded-md bg-blue-50 p-3">
              <div>
                <p>
                  {selectedTrajet.heureDepart.substring(0,5)} - {selectedTrajet.portDepart} <br />
                  {selectedTrajet.heureArrivee.substring(0,5)} - {selectedTrajet.portArrivee}<br />
                </p>
              </div>
              <div className="py-5 w-full border-b-4 border-white">
                <Link href="/" className="p-3 bg-sky-900 rounded-xl text-white w-[80%] m-auto block text-center">
                  Réserver ce trajet
                </Link>
              </div>
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
              
            </>
          ) : (
            <></>
          )}
        
      </div>
    </div>
  );
}
