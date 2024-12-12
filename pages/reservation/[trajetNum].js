'use client'
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function Reservation({ trajet }) {
  const router = useRouter();

  if (!trajet) {
    return <p>Chargement des données...</p>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-16 ">
      <div className="w-full max-w-lg p-8 shadow-md rounded-lg bg-blue-50">
        <p className="text-lg font-bold mb-4">
          {trajet.portDepart} - {trajet.portArrivee}
        </p>
        <p className="mb-4">
          le {trajet.dateFormat} de {trajet.heureDepartFormat} à {trajet.heureArriveeFormat}
        </p>
        <form className="flex flex-col gap-6">
          <div className='flex flex-col'>
            <label htmlFor="adresse" className="w-1/4 text-gray-700">
              Adresse
            </label>
            <input 
              type="text"
              name="adresse"
              className="w-4/4 p-2 border border-gray-300 rounded"
            />
          </div>
          <div className='flex'>
            <div className='w-1/2 flex flex-col'>
              <label htmlFor="codePostal" className="w-2/4 text-gray-700 mr-2">
                Code Postal
              </label>
              <input 
                type="text"
                name="codePostal"
                className="w-3/4 p-2 border border-gray-300 rounded"
              />
            </div>
            <div className='w-1/2 flex flex-col'>
              <label htmlFor="ville" className="w-1/4 text-gray-700">
                Ville
              </label>
              <input 
                type="text"
                name="ville"
                className="w-3/4 p-2 border border-gray-300 rounded"
              />
            </div>
            
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="adulte" className="w-1/2 text-gray-700">
              Adulte
            </label>
            <p className="w-1/4 text-gray-500">50€</p>
            <input
              type="number"
              name="adulte"
              className="w-1/4 p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="junior" className="w-1/2 text-gray-700">
              Junior
            </label>
            <p className="w-1/4 text-gray-500">50€</p>
            <input
              type="number"
              name="junior"
              className="w-1/4 p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="enfant" className="w-1/2 text-gray-700">
              Enfant
            </label>
            <p className="w-1/4 text-gray-500">50€</p>
            <input
              type="number"
              name="enfant"
              className="w-1/4 p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="voiture" className="w-1/2 text-gray-700">
              Voiture
            </label>
            <p className="w-1/4 text-gray-500">50€</p>
            <input
              type="number"
              name="voiture"
              className="w-1/4 p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="camionnette" className="w-1/2 text-gray-700">
              Camionnette
            </label>
            <p className="w-1/4 text-gray-500">50€</p>
            <input
              type="number"
              name="camionnette"
              className="w-1/4 p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="campingCar" className="w-1/2 text-gray-700">
              Camping Car
            </label>
            <p className="w-1/4 text-gray-500">50€</p>
            <input
              type="number"
              name="campingCar"
              className="w-1/4 p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="camion" className="w-1/2 text-gray-700">
              Camion
            </label>
            <p className="w-1/4 text-gray-500">50€</p>
            <input
              type="number"
              name="camion"
              className="w-1/4 p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className="px-6 py-2 bg-sky-900 text-white rounded-lg hover:bg-sky-800 transition"
            >
              Réserver
            </button>
          </div>
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
    .select('depart_id, arrivee_id')
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
        nomBateau: bateau.nom,
        tempsTrajet: `${hours}h ${minutes}m`,
        portDepart: portDepart.nom,
        portArrivee: portArrivee.nom,
        placePassager: placePassager.capacite,
        placePetitVehicule: placePetitVehicule.capacite,
        placeGrandVehicule: placeGrandVehicule.capacite,
        heureDepartFormat: heureDepartFormat,
        heureArriveeFormat: heureArriveeFormat,
        dateFormat: dateFormat
      },
    },
  };
}
