'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ListeTrajet() {
  const [trajetList, setTrajetList] = useState([]);
  const [selectedTrajet, setSelectedTrajet] = useState(null);
  const [depart, setDepart] = useState('');
  const [arrivee, setArrivee] = useState('');
  const [date, setDate] = useState('');
  const [secteurs, setSecteurs] = useState([]);  // État pour stocker les secteurs
  const [selectedSecteur, setSelectedSecteur] = useState(''); // État pour la sélection du secteur
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [liaisons, setLiaisons] = useState([]);
  const [selectedLiaison, setSelectedLiaison] = useState('');
  

  useEffect(() => {
    const fetchSecteurs = async () => {
      const { data: secteurs, error } = await supabase.from('secteur').select('*');
      if (error) {
        console.error('Erreur lors de la récupération des secteurs:', error.message);
      } else {
        setSecteurs(secteurs);
      }
    };
    fetchSecteurs();
  }, []);

  useEffect(() => {
    if (!selectedSecteur) return;
    
    const fetchLiaisons = async () => {
      const { data: liaisons, error } = await supabase
        .from('liaison')
        .select('*')
        .eq('secteur_id', selectedSecteur);

      if (error) {
        console.error('Erreur lors de la récupération des liaisons:', error.message);
      } else {
        // Récupération des noms des ports associés
        const liaisonsAvecPorts = await Promise.all(
          liaisons.map(async (liaison) => {
            const { data: portDepart, error: errorDepart } = await supabase
              .from('port')
              .select('nom')
              .eq('id', liaison.depart_id)
              .single();

            const { data: portArrivee, error: errorArrivee } = await supabase
              .from('port')
              .select('nom')
              .eq('id', liaison.arrivee_id)
              .single();

            return {
              ...liaison,
              portDepart: portDepart?.nom || 'Inconnu',
              portArrivee: portArrivee?.nom || 'Inconnu',
            };
          })
        );

        setLiaisons(liaisonsAvecPorts);
      }
    };

    fetchLiaisons();
  }, [selectedSecteur]);

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
      console.log(selectedLiaison);
      const nomDepart = selectedLiaison?.split(' → ')[0] || '';  // Marseille
      const nomArrivee= selectedLiaison?.split(' → ')[1] || '';
      const { data: portDepart, error: errorPortDepart } = await supabase
        .from('port')
        .select('id, nom')
        .ilike('nom', `%${nomDepart}%`)
        .single();

      if (errorPortDepart || !portDepart) {
        throw new Error('Port de départ introuvable');
      }

      // Recherche du port d'arrivée
      const { data: portArrivee, error: errorPortArrivee } = await supabase
        .from('port')
        .select('id, nom')
        .ilike('nom', `%${nomArrivee}%`)
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
          
          
          console.log("Réservation grand vehicule: "+placeGrandVehReserv);

          
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
             portArrivee: portArrivee.nom, placePassager: placePassager.capacite - placePassagerReserv, placePetitVehicule: placePetitVehicule.capacite - placePetitVehReserv,
             placeGrandVehicule: placeGrandVehicule.capacite - placeGrandVehReserv };
          }
          else {
            return { ...trajet, nomBateau: bateau.nom, tempsTrajet: `${minutes}m`, portDepart: portDepart.nom, 
            portArrivee: portArrivee.nom, placePassager: placePassager.capacite - placePassagerReserv, placePetitVehicule: placePetitVehicule.capacite - placePetitVehReserv,
            placeGrandVehicule: placeGrandVehicule.capacite - placeGrandVehReserv};
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

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
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
              <Link href={`/reservation/${selectedTrajet.num}`} className="p-3 bg-sky-900 rounded-xl text-white w-[80%] m-auto block text-center">
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
