import Link from 'next/link';
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from '@/lib/supabase';
import { fr } from 'date-fns/locale';
import { FiCalendar, FiBarChart2, FiDollarSign } from 'react-icons/fi';
export default function GestionLiaison() {
    // État pour stocker la liste des trajets
    const [liaisons, setLiaisons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [secteurs, setSecteurs] = useState([]);
    const [selectedSecteur, setSelectedSecteur] = useState('');
    const [ports, setPorts] = useState([]);
    const [selectedPortDepart, setSelectedPortDepart] = useState('');
    const [selectedPortArrivee, setSelectedPortArrivee] = useState('');

    const fetchSecteurs = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: secteurs, error: errorSecteurs } = await supabase
                .from('secteur')
                .select('*');

            const { data: ports, error: errorPorts } = await supabase
                .from('port')
                .select('*');
            
            setPorts(ports);
            setSecteurs(secteurs);
        }
        catch (error) {
            setError('Erreur lors de la récupération des trajets.');
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }

        
    }
    // Fonction pour récupérer les trajets
    const fetchLiaisons = async () => {
        setLoading(true);
        setError(null);

        try {
            // Récupérer les liaisons
            const { data: liaisons, error: errorLiaisons } = await supabase
                .from('liaison')
                .select('*');

            if (errorLiaisons) throw errorLiaisons;

            // Pour chaque liaison, récupérer les ports de départ et d'arrivée
            const liaisonsPorts = await Promise.all(
                liaisons.map(async (liaison) => {
                    const { data: depart, error: errorDepart } = await supabase
                        .from('port')
                        .select('*')
                        .eq('id', liaison.depart_id)
                        .single();

                    const { data: arrivee, error: errorArrivee } = await supabase
                        .from('port')
                        .select('*')
                        .eq('id', liaison.arrivee_id)
                        .single();

                    const {data: secteur, error: errorSecteur} = await supabase
                        .from('secteur')
                        .select('*')
                        .eq('id', liaison.secteur_id)
                        .single();

                    if (errorDepart || errorArrivee) {
                        throw errorDepart || errorArrivee;
                    }

                    return {
                        ...liaison,
                        depart: depart,
                        arrivee: arrivee,
                        secteur: secteur,
                    };
                })
            );

            setLiaisons(liaisonsPorts);
        } catch (error) {
            setError('Erreur lors de la récupération des trajets.');
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    // Appeler fetchTrajets au chargement du composant
    useEffect(() => {
        fetchLiaisons();
        fetchSecteurs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
      
        try {
            alert('yes');
        } catch (error) {
          setMessage(error.message);
        }
    };

    return (
        <div className="pt-16 pb-8 w-9/12 mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Gestion des Liaisons</h2>
            

            {loading ? (
                <p>Chargement en cours...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <>
                    {isAdding ? (
                        <>
                        <div>
                            <form className="grid lg:grid-cols-6 grid-cols-2 gap-4" onSubmit={handleSubmit}>
                                <select 
                                    value={selectedSecteur}
                                    onChange={(e) => setSelectedSecteur(e.target.value)}
                                    className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
                                >
                                    <option value="">Secteur</option>
                                    {secteurs.map((secteur) => (
                                        <option key={secteur.id} value={secteur.id}>
                                            {secteur.nom}
                                        </option>
                                    ))}
                                </select>
                                <select 
                                    value={selectedPortDepart}
                                    onChange={(e) => setSelectedPortDepart(e.target.value)}
                                    className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
                                >
                                    <option value="">Départ</option>
                                    {ports.map((port) => (
                                        <option key={port.id} value={port.id}>
                                            {port.nom}
                                        </option>
                                    ))}
                                </select>
                                <select 
                                    value={selectedPortArrivee}
                                    onChange={(e) => setSelectedPortArrivee(e.target.value)}
                                    className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
                                >
                                    <option value="">Arrivée</option>
                                    {ports.map((port) => (
                                        <option key={port.id} value={port.id}>
                                            {port.nom}
                                        </option>
                                    ))}
                                </select>
                                <input 
                                    placeholder='Distance' 
                                    type="number"  
                                    className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
                                />
                                <button
                                    type="submit"
                                    className="block w-full px-4 py-2 bg-sky-900 text-white rounded-md mb-4"
                                >
                                    Ajouter
                                </button>
                                <button onClick={() => setIsAdding(false)} className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg mb-4">Annuler</button>
                            </form>
                        </div>

                        </>
                    ) : (
                        <div>
                            <button onClick={() => setIsAdding(true)} className="mb-6 px-4 py-2 bg-green-500 text-white rounded-lg">Ajouter une liaison</button>
                        </div>
                    )}
                    <div className="space-y-4">
                        {liaisons.map((liaison) => (
                            <div key={liaison.code} className="p-6 rounded-lg shadow-sm bg-blue-50">
                                <p className="text-gray-600">
                                    Liaison {liaison.code} - {liaison.secteur.nom} - {liaison.depart.nom} → {liaison.arrivee.nom} ({liaison.distance} km) 
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}

        </div>
    );
}