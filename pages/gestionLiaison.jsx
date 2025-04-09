import Link from 'next/link';
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from '@/lib/supabase';
import { fr } from 'date-fns/locale';
import { FiCalendar, FiBarChart2, FiDollarSign } from 'react-icons/fi';
import { MdDelete } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import LoadingSpinner from '@/components/LoadingSpinner';

export default function GestionLiaison() {
    const [liaisons, setLiaisons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);  // Nouvel état pour l'édition
    const [secteurs, setSecteurs] = useState([]);
    const [ports, setPorts] = useState([]);
    const [selectedSecteur, setSelectedSecteur] = useState('');
    const [selectedPortDepart, setSelectedPortDepart] = useState('');
    const [selectedPortArrivee, setSelectedPortArrivee] = useState('');
    const [distance, setDistance] = useState('');
    const [editingLiaison, setEditingLiaison] = useState(null); // Liaison en cours d'édition

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
            setError('Erreur lors de la récupération des secteurs et ports.');
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLiaisons = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: liaisons, error: errorLiaisons } = await supabase
                .from('liaison')
                .select('*');

            if (errorLiaisons) throw errorLiaisons;

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

                    const { data: secteur, error: errorSecteur } = await supabase
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
            setError('Erreur lors de la récupération des liaisons.');
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiaisons();
        fetchSecteurs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedSecteur !== "" && selectedPortArrivee !== "" && selectedPortDepart !== "" && distance !== "") {
            if (selectedPortArrivee === selectedPortDepart) {
                alert("Le port d'arrivée ne peut pas être le même que celui de départ");
                return;
            }
            if (distance <= 0) {
                alert("Une liaison ne peut pas avoir une distance inférieure à 0");
                return;
            }
            try {
                const exist = await isExisting(selectedSecteur, selectedPortDepart, selectedPortArrivee);
                if (exist) {
                    alert('La liaison existe déjà');
                } else {
                    const { data, error } = await supabase
                        .from("liaison")
                        .insert([{
                            secteur_id: selectedSecteur,
                            depart_id: selectedPortDepart,
                            arrivee_id: selectedPortArrivee,
                            distance: Number(distance),
                        }]);
                    if (error) {
                        alert("Erreur d'insertion :", error.message);
                    } else {
                        alert("Liaison créée :", data);
                        fetchLiaisons();
                        resetForm();
                        setIsAdding(false);
                    }
                }
            } catch (error) {
                setMessage(error.message);
            }
        } else {
            alert("Veuillez remplir les champs");
        }
    };

    const handleEdit = (liaison) => {
        setIsEditing(true);
        setEditingLiaison(liaison);
        setSelectedSecteur(liaison.secteur_id);
        setSelectedPortDepart(liaison.depart_id);
        setSelectedPortArrivee(liaison.arrivee_id);
        setDistance(liaison.distance);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (selectedSecteur !== "" && selectedPortArrivee !== "" && selectedPortDepart !== "" && distance !== "") {
            if (selectedPortArrivee === selectedPortDepart) {
                alert("Le port d'arrivée ne peut pas être le même que celui de départ");
                return;
            }
            if (distance <= 0) {
                alert("Une liaison ne peut pas avoir une distance inférieure à 0");
                return;
            }
            try {
                const exist = await isExisting(selectedSecteur, selectedPortDepart, selectedPortArrivee);
                if (exist && exist.code != editingLiaison.code) {
                    alert('La liaison existe déjà');
                }
                else {
                    const { data, error } = await supabase
                    .from('liaison')
                    .update({
                        secteur_id: selectedSecteur,
                        depart_id: selectedPortDepart,
                        arrivee_id: selectedPortArrivee,
                        distance: Number(distance)
                    })
                    .eq('code', editingLiaison.code);

                if (error) {
                    alert("Erreur de mise à jour :", error.message);
                } else {
                    alert("Liaison mise à jour !");
                    fetchLiaisons();
                    resetForm();
                    setIsEditing(false);
                    setEditingLiaison(null);
                }
                }
                
            } catch (error) {
                console.error('Erreur de mise à jour:', error);
            }
        } else {
            alert("Veuillez remplir tous les champs");
        }
    };

    async function isExisting(secteur, depart, arrivee) {
        const { data: liaison, error: errorLiaison } = await supabase
            .from('liaison')
            .select('*')
            .eq('secteur_id', secteur)
            .eq('depart_id', depart)
            .eq('arrivee_id', arrivee)
            .single();

        return liaison;
    }

    async function deleteLiaison(code) {
        // Vérifie si la liaison est utilisée dans un trajet
        const { data: trajets, error: errorTrajets } = await supabase
          .from('trajet')
          .select('*')
          .eq('idLiaison', code); // ou autre colonne selon ta structure
      
        if (trajets && trajets.length > 0) {
          alert("Impossible de supprimer cette liaison : elle est utilisée dans un ou plusieurs trajets.");
          return;
        }
      
        const { error } = await supabase
          .from('liaison')
          .delete()
          .eq('code', code);
      
        if (error) {
          console.error("Erreur de suppression :", error.message);
        } else {
          alert("Liaison supprimée avec succès !");
          fetchLiaisons();
        }
      }

    const resetForm = () => {
        setSelectedSecteur('');
        setSelectedPortDepart('');
        setSelectedPortArrivee('');
        setDistance('');
    };

    return (
        <div className="pt-16 pb-8 w-9/12 mx-auto">

            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <>

            <h2 className="text-3xl font-bold mb-6 text-center">Gestion des Liaisons</h2>
                    {(isAdding || isEditing) ? (
                        <form className="grid mx-auto lg:w-1/2 grid-cols-2 gap-4" onSubmit={isEditing ? handleUpdate : handleSubmit}>
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
                            <input
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                                placeholder='Distance'
                                type="number"
                                className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
                            />
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
                            
                            <button
                                type="submit"
                                className="block w-full px-4 py-2 bg-sky-900 text-white rounded-md mb-4"
                            >
                                {isEditing ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                            <button onClick={() => { setIsAdding(false); setIsEditing(false); resetForm(); }} className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg mb-4">
                                Annuler
                            </button>
                        </form>
                    ) : (
                        <div>
                            <div className='mx-auto lg:w-1/2 flex'>
                                <button onClick={() => setIsAdding(true)} className="mb-6 px-4 py-2 bg-green-500 text-white rounded-lg ml-auto flex gap-2"><IoMdAdd className='text-xl'/> Ajouter une liaison</button>
                            </div>

                        </div>
                    )}
                    <div className="space-y-4">
                        {liaisons.map((liaison) => (
                            <div key={liaison.code} className="p-6 rounded-lg shadow-sm bg-blue-50 flex lg:w-1/2 justify-between mx-auto gap-3">
                                <div>
                                    <p className="text-gray-600">
                                        Liaison {liaison.code} - {liaison.secteur.nom} - {liaison.depart.nom} → {liaison.arrivee.nom} ({liaison.distance} km)
                                    </p>
                                </div>
                                {(isAdding || isEditing) ? (
                                   <></>
                                ) :
                                <div className='flex gap-3'>
                                <button onClick={() => handleEdit(liaison)}>
                                    <FaEdit className='text-xl text-blue-600' />
                                </button>
                                <button onClick={() => deleteLiaison(liaison.code)}>
                                    <MdDelete className='text-xl text-red-600' />
                                </button>
                            </div>
                                }
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
