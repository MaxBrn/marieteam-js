// === IMPORTATIONS ===

// Composants Next.js et React
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Composants tiers pour l'interface utilisateur
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { fr } from 'date-fns/locale';

// Icônes de différentes bibliothèques
import { FiCalendar, FiBarChart2, FiDollarSign } from 'react-icons/fi';
import { MdDelete } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";

// Client Supabase pour la base de données
import { supabase } from '@/lib/supabase';

// Composants personnalisés
import LoadingSpinner from '@/components/LoadingSpinner';
import Notification from '@/components/Notification';

// Composants UI pour les dialogues de confirmation
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
 * Composant Gestion Liaison - Gestion des liaisons
 * 
 * Fonctionnalités principales :
 * - Créer une liaison
 * - Modifier une liaison
 * - Supprimer une liaison
 */

export default function GestionLiaison() {
    // === HOOKS ET ÉTAT GLOBAL ===
    
    const router = useRouter(); // Pour la navigation programmatique
    
    // === ÉTATS POUR LES DONNÉES ===
    
    const [liaisons, setLiaisons] = useState([]);      // Liste des liaisons récupérées
    const [secteurs, setSecteurs] = useState([]);      // Liste des secteurs disponibles
    const [ports, setPorts] = useState([]);            // Liste des ports disponibles
    
    // === ÉTATS POUR L'INTERFACE UTILISATEUR ===
    
    const [loading, setLoading] = useState(false);             // Chargement général
    const [loadingCreate, setLoadingCreate] = useState(false); // Chargement lors de la création
    const [loadingUpdate, setLoadingUpdate] = useState(false); // Chargement lors de la mise à jour
    const [loadingDelete, setLoadingDelete] = useState(false); // Chargement lors de la suppression
    const [error, setError] = useState(null);                  // Messages d'erreur
    const [notification, setNotification] = useState(null);    // Notifications temporaires
    
    // === ÉTATS POUR LES MODES D'INTERACTION ===
    
    const [isAdding, setIsAdding] = useState(false);     // Mode ajout activé
    const [isEditing, setIsEditing] = useState(false);   // Mode édition activé
    const [editingLiaison, setEditingLiaison] = useState(null); // Liaison en cours d'édition
    
    // === ÉTATS POUR LE FORMULAIRE ===
    
    const [selectedSecteur, setSelectedSecteur] = useState('');       // Secteur sélectionné
    const [selectedPortDepart, setSelectedPortDepart] = useState(''); // Port de départ sélectionné
    const [selectedPortArrivee, setSelectedPortArrivee] = useState(''); // Port d'arrivée sélectionné
    const [distance, setDistance] = useState('');                     // Distance de la liaison
    
    // === ÉTATS POUR LA SÉCURITÉ ET AUTORISATION ===
    
    const [isAuthorized, setIsAuthorized] = useState(false);  // Utilisateur autorisé (admin)
    const [isChecking, setIsChecking] = useState(true);      // Vérification des droits en cours
    
    // === ÉTATS POUR LA SUPPRESSION ===
    
    const [showDeleteDialog, setShowDeleteDialog] = useState(false); // Affichage du dialogue de confirmation
    const [liaisonToDelete, setLiaisonToDelete] = useState(null);    // Liaison à supprimer

    // === VÉRIFICATION DU RÔLE ADMINISTRATEUR ===
    
    /**
     * Vérifie si l'utilisateur connecté a le rôle administrateur
     * Redirige vers l'accueil si ce n'est pas le cas
     */
    useEffect(() => {
        const checkAdminRole = async () => {
            try {
                // Récupération des informations de l'utilisateur connecté
                const { data: { user } } = await supabase.auth.getUser();
                const userRole = user?.user_metadata?.role;
                
                // Vérification du rôle administrateur
                if (userRole !== 'admin') {
                    router.push('/'); // Redirection si pas admin
                    return;
                }
                
                setIsAuthorized(true); // Autorisation accordée
            } catch (error) {
                console.error("Erreur lors de la vérification du rôle:", error);
                router.push('/'); // Redirection en cas d'erreur
            } finally {
                setIsChecking(false); // Fin de la vérification
            }
        };

        checkAdminRole();
    }, [router]);

    // === FONCTIONS DE RÉCUPÉRATION DES DONNÉES ===
    
    /**
     * Récupère la liste des secteurs et des ports depuis la base de données
     * Utilisée pour alimenter les listes déroulantes du formulaire
     */
    const fetchSecteurs = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Récupération parallèle des secteurs et des ports
            const { data: secteurs, error: errorSecteurs } = await supabase
                .from('secteur')
                .select('*');

            const { data: ports, error: errorPorts } = await supabase
                .from('port')
                .select('*');
            
            // Mise à jour des états avec les données récupérées
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

    /**
     * Récupère toutes les liaisons avec leurs informations détaillées
     * Joint les données des ports de départ/arrivée et du secteur
     */
    const fetchLiaisons = async () => {
        setLoading(true);
        setError(null);

        try {
            // Récupération des liaisons de base
            const { data: liaisons, error: errorLiaisons } = await supabase
                .from('liaison')
                .select('*');

            if (errorLiaisons) throw errorLiaisons;

            // Enrichissement de chaque liaison avec les détails des ports et secteur
            const liaisonsPorts = await Promise.all(
                liaisons.map(async (liaison) => {
                    // Récupération du port de départ
                    const { data: depart, error: errorDepart } = await supabase
                        .from('port')
                        .select('*')
                        .eq('id', liaison.depart_id)
                        .single();

                    // Récupération du port d'arrivée
                    const { data: arrivee, error: errorArrivee } = await supabase
                        .from('port')
                        .select('*')
                        .eq('id', liaison.arrivee_id)
                        .single();

                    // Récupération du secteur
                    const { data: secteur, error: errorSecteur } = await supabase
                        .from('secteur')
                        .select('*')
                        .eq('id', liaison.secteur_id)
                        .single();

                    if (errorDepart || errorArrivee) {
                        throw errorDepart || errorArrivee;
                    }

                    // Retour de la liaison enrichie avec toutes les informations
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

    // === CHARGEMENT INITIAL DES DONNÉES ===
    
    /**
     * Charge les données uniquement si l'utilisateur est autorisé
     */
    useEffect(() => {
        if (isAuthorized) {
            fetchLiaisons();
            fetchSecteurs();
        }
    }, [isAuthorized]);

    // === FONCTIONS UTILITAIRES ===
    
    /**
     * Affiche une notification temporaire à l'utilisateur
     * @param {string} type - Type de notification ('success', 'error', etc.)
     * @param {string} message - Message à afficher
     */
    const showNotification = (type, message) => {
        setNotification({ type, message });
        // Auto-suppression après 3 secondes
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    /**
     * Remet à zéro tous les champs du formulaire
     */
    const resetForm = () => {
        setSelectedSecteur('');
        setSelectedPortDepart('');
        setSelectedPortArrivee('');
        setDistance('');
    };

    // === FONCTIONS DE VALIDATION ===
    
    /**
     * Vérifie si une liaison existe déjà avec les mêmes paramètres
     * @param {string} secteur - ID du secteur
     * @param {string} depart - ID du port de départ
     * @param {string} arrivee - ID du port d'arrivée
     * @returns {Object|null} La liaison existante ou null
     */
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

    // === GESTION DU FORMULAIRE DE CRÉATION ===
    
    /**
     * Gère la soumission du formulaire pour créer une nouvelle liaison
     * @param {Event} e - Événement de soumission du formulaire
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingCreate(true);
        
        // Vérification que tous les champs sont remplis
        if (selectedSecteur !== "" && selectedPortArrivee !== "" && selectedPortDepart !== "" && distance !== "") {
            
            // === VALIDATIONS MÉTIER ===
            
            // Vérification que les ports de départ et d'arrivée sont différents
            if (selectedPortArrivee === selectedPortDepart) {
                showNotification("error", "Le port d'arrivée ne peut pas être le même que celui de départ");
                setLoadingCreate(false);
                return;
            }
            
            // Vérification que la distance est positive
            if (distance <= 0) {
                showNotification("error", "Une liaison ne peut pas avoir une distance inférieure à 0");
                setLoadingCreate(false);
                return;
            }
            
            try {
                // Vérification de l'unicité de la liaison
                const exist = await isExisting(selectedSecteur, selectedPortDepart, selectedPortArrivee);
                
                if (exist) {
                    showNotification("error", "La liaison existe déjà");
                } else {
                    // === INSERTION EN BASE DE DONNÉES ===
                    
                    const { data, error } = await supabase
                        .from("liaison")
                        .insert([{
                            secteur_id: selectedSecteur,
                            depart_id: selectedPortDepart,
                            arrivee_id: selectedPortArrivee,
                            distance: Number(distance), // Conversion en nombre
                        }]);
                        
                    if (error) {
                        showNotification("error", `Erreur d'insertion : ${error.message}`);
                    } else {
                        // === SUCCÈS DE LA CRÉATION ===
                        
                        showNotification("success", "Liaison créée avec succès");
                        fetchLiaisons();    // Rechargement de la liste
                        resetForm();        // Reset du formulaire
                        setIsAdding(false); // Sortie du mode ajout
                    }
                }
            } catch (error) {
                showNotification("error", error.message);
            } finally {
                setLoadingCreate(false);
            }
        } else {
            showNotification("error", "Veuillez remplir tous les champs");
            setLoadingCreate(false);
        }
    };

    // === GESTION DE L'ÉDITION ===
    
    /**
     * Prépare le formulaire pour l'édition d'une liaison existante
     * @param {Object} liaison - La liaison à modifier
     */
    const handleEdit = (liaison) => {
        setIsEditing(true);           // Activation du mode édition
        setEditingLiaison(liaison);   // Stockage de la liaison en cours d'édition
        
        // Pré-remplissage du formulaire avec les valeurs actuelles
        setSelectedSecteur(liaison.secteur_id);
        setSelectedPortDepart(liaison.depart_id);
        setSelectedPortArrivee(liaison.arrivee_id);
        setDistance(liaison.distance);
    };

    /**
     * Gère la soumission du formulaire pour mettre à jour une liaison
     * @param {Event} e - Événement de soumission du formulaire
     */
    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoadingUpdate(true);
        
        // Même logique de validation que pour la création
        if (selectedSecteur !== "" && selectedPortArrivee !== "" && selectedPortDepart !== "" && distance !== "") {
            
            // === VALIDATIONS MÉTIER ===
            
            if (selectedPortArrivee === selectedPortDepart) {
                showNotification("error", "Le port d'arrivée ne peut pas être le même que celui de départ");
                setLoadingUpdate(false);
                return;
            }
            
            if (distance <= 0) {
                showNotification("error", "Une liaison ne peut pas avoir une distance inférieure à 0");
                setLoadingUpdate(false);
                return;
            }
            
            try {
                // Vérification de l'unicité (en excluant la liaison en cours d'édition)
                const exist = await isExisting(selectedSecteur, selectedPortDepart, selectedPortArrivee);
                
                if (exist && exist.code != editingLiaison.code) {
                    showNotification("error", "La liaison existe déjà");
                } else {
                    // === MISE À JOUR EN BASE DE DONNÉES ===
                    
                    const { data, error } = await supabase
                        .from('liaison')
                        .update({
                            secteur_id: selectedSecteur,
                            depart_id: selectedPortDepart,
                            arrivee_id: selectedPortArrivee,
                            distance: Number(distance)
                        })
                        .eq('code', editingLiaison.code); // Condition sur l'ID de la liaison

                    if (error) {
                        showNotification("error", `Erreur de mise à jour : ${error.message}`);
                    } else {
                        // === SUCCÈS DE LA MISE À JOUR ===
                        
                        showNotification("success", "Liaison mise à jour avec succès");
                        fetchLiaisons();          // Rechargement de la liste
                        resetForm();              // Reset du formulaire
                        setIsEditing(false);      // Sortie du mode édition
                        setEditingLiaison(null);  // Réinitialisation de la liaison en édition
                    }
                }
            } catch (error) {
                showNotification("error", `Erreur de mise à jour : ${error.message}`);
            } finally {
                setLoadingUpdate(false);
            }
        } else {
            showNotification("error", "Veuillez remplir tous les champs");
            setLoadingUpdate(false);
        }
    };

    // === GESTION DE LA SUPPRESSION ===
    
    /**
     * Ouvre le dialogue de confirmation pour la suppression
     * @param {Object} liaison - La liaison à supprimer
     */
    const openDeleteDialog = (liaison) => {
        setLiaisonToDelete(liaison);   // Stockage de la liaison à supprimer
        setShowDeleteDialog(true);     // Affichage du dialogue de confirmation
    };

    /**
     * Confirme et exécute la suppression d'une liaison
     * Vérifie d'abord si la liaison n'est pas utilisée dans des trajets
     */
    const confirmDelete = async () => {
        setLoadingDelete(true);
        setShowDeleteDialog(false);
        
        // === VÉRIFICATION DES DÉPENDANCES ===
        
        // Vérification si la liaison est utilisée dans des trajets
        const { data: trajets, error: errorTrajets } = await supabase
            .from('trajet')
            .select('*')
            .eq('idLiaison', liaisonToDelete.code);

        if (trajets && trajets.length > 0) {
            showNotification("error", "Impossible de supprimer cette liaison : elle est utilisée dans un ou plusieurs trajets");
            setLoadingDelete(false);
            return;
        }

        // === SUPPRESSION EN BASE DE DONNÉES ===
        
        const { error } = await supabase
            .from('liaison')
            .delete()
            .eq('code', liaisonToDelete.code);

        if (error) {
            showNotification("error", `Erreur de suppression : ${error.message}`);
        } else {
            showNotification("success", "Liaison supprimée avec succès");
            fetchLiaisons(); // Rechargement de la liste
        }
        
        // Nettoyage des états de suppression
        setLoadingDelete(false);
        setLiaisonToDelete(null);
    };

    // === RENDU CONDITIONNEL POUR LA SÉCURITÉ ===
    
    // Affichage du chargement pendant la vérification des droits
    if (isChecking || !isAuthorized) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <LoadingSpinner text="Vérification des droits d'accès..." />
            </div>
        );
    }

    // === RENDU PRINCIPAL DU COMPOSANT ===
    
    return (
        <div className="pt-16 pb-8 w-9/12 mx-auto">
            
            {/* Affichage conditionnel des notifications */}
            {notification && (
                <Notification
                    type={notification.type}
                    message={notification.message}
                />
            )}

            {/* Affichage conditionnel selon l'état de chargement */}
            {loading || loadingCreate || loadingUpdate || loadingDelete ? (
                <div className="w-full flex justify-center items-center min-h-[400px]">
                    <LoadingSpinner text={
                        loadingCreate ? "Création de la liaison..." :
                        loadingUpdate ? "Mise à jour de la liaison..." :
                        loadingDelete ? "Suppression de la liaison..." :
                        "Chargement des liaisons..."
                    } />
                </div>
            ) : error ? (
                // Affichage des erreurs
                <p className="text-red-500">{error}</p>
            ) : (
                <>
                    {/* Titre de la page */}
                    <h2 className="text-3xl font-bold mb-6 text-center">Gestion des Liaisons</h2>
                    
                    {/* === FORMULAIRE D'AJOUT/ÉDITION === */}
                    
                    {(isAdding || isEditing) ? (
                        <form className="grid mx-auto lg:w-1/2 grid-cols-2 gap-4" onSubmit={isEditing ? handleUpdate : handleSubmit}>
                            
                            {/* Sélection du secteur */}
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
                            
                            {/* Champ distance */}
                            <input
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                                placeholder='Distance'
                                type="number"
                                className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition duration-200 ease-in-out"
                            />
                            
                            {/* Sélection du port de départ */}
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
                            
                            {/* Sélection du port d'arrivée */}
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
                            
                            {/* Bouton de soumission */}
                            <button
                                type="submit"
                                className="block w-full px-4 py-2 bg-sky-900 text-white rounded-md mb-4"
                            >
                                {isEditing ? 'Mettre à jour' : 'Ajouter'}
                            </button>
                            
                            {/* Bouton d'annulation */}
                            <button 
                                onClick={() => { 
                                    setIsAdding(false); 
                                    setIsEditing(false); 
                                    resetForm(); 
                                }} 
                                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg mb-4"
                            >
                                Annuler
                            </button>
                        </form>
                    ) : (
                        // === BOUTON D'AJOUT (MODE LISTE) ===
                        
                        <div>
                            <div className='mx-auto lg:w-1/2 flex'>
                                <button 
                                    onClick={() => setIsAdding(true)} 
                                    className="mb-6 px-4 py-2 bg-green-500 text-white rounded-lg ml-auto flex gap-2"
                                >
                                    <IoMdAdd className='text-xl'/> Ajouter une liaison
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* === LISTE DES LIAISONS === */}
                    
                    <div className="space-y-4">
                        {liaisons.map((liaison) => (
                            <div key={liaison.code} className="p-6 rounded-lg shadow-sm bg-blue-50 flex lg:w-1/2 justify-between mx-auto gap-3">
                                
                                {/* Informations de la liaison */}
                                <div>
                                    <p className="text-gray-600">
                                        Liaison {liaison.code} - {liaison.secteur.nom} - {liaison.depart.nom} → {liaison.arrivee.nom} ({liaison.distance} km)
                                    </p>
                                </div>
                                
                                {/* Boutons d'action (masqués pendant l'ajout/édition) */}
                                {(isAdding || isEditing) ? (
                                   <></>
                                ) : (
                                    <div className='flex gap-3'>
                                        {/* Bouton d'édition */}
                                        <button onClick={() => handleEdit(liaison)}>
                                            <FaEdit className='text-xl text-blue-600' />
                                        </button>
                                        
                                        {/* Bouton de suppression */}
                                        <button onClick={() => openDeleteDialog(liaison)}>
                                            <MdDelete className='text-xl text-red-600' />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* === DIALOGUE DE CONFIRMATION DE SUPPRESSION === */}
            
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la liaison {liaisonToDelete?.code} entre {liaisonToDelete?.depart?.nom} et {liaisonToDelete?.arrivee?.nom} ?
                            <p className="mt-2 text-red-500 font-semibold">Cette action est irréversible.</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}