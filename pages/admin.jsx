import Link from 'next/link';
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from '@/lib/supabase';
import { fr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { FiCalendar, FiBarChart2, FiDollarSign } from 'react-icons/fi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/router';

/**
 * Composant Admin - Tableau de bord administrateur
 * 
 * Ce composant affiche un dashboard avec :
 * - Vérification des droits d'accès (rôle admin requis)
 * - Filtrage par période de dates
 * - Statistiques de revenus et de passagers
 * - Graphiques de visualisation des données
 */
export default function Admin() {
    const router = useRouter();

    // ================================
    // ÉTATS DE GESTION DES DONNÉES
    // ================================
    
    // État pour le prix total calculé sur la période sélectionnée
    const [prixTotal, setPrixTotal] = useState(0);
    
    // États de gestion du chargement et des erreurs
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // États pour les filtres de dates (par défaut : mois en cours)
    // startDate : premier jour du mois actuel
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    // endDate : dernier jour du mois actuel
    const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

    // États pour stocker les données des graphiques
    // revenusParDate : objet {date: montant} pour le graphique des revenus
    const [revenusParDate, setRevenusParDate] = useState({});
    // passagerParDate : objet {date: {catA, catB, catC}} pour le graphique des passagers
    const [passagerParDate, setPassagerParDate] = useState({});
    // totalPassagers : totaux globaux par catégorie sur la période
    const [totalPassagers, setTotalPassagers] = useState({ catA: 0, catB: 0, catC: 0 });

    // États de gestion de l'autorisation d'accès
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // ================================
    // VÉRIFICATION DES DROITS D'ACCÈS
    // ================================
    
    /**
     * Effect pour vérifier si l'utilisateur connecté a le rôle 'admin'
     * Redirige vers la page d'accueil si l'utilisateur n'est pas admin
     */
    useEffect(() => {
        const checkAdminRole = async () => {
            try {
                // Récupération de l'utilisateur connecté depuis Supabase Auth
                const { data: { user } } = await supabase.auth.getUser();
                const userRole = user?.user_metadata?.role;
                
                // Vérification du rôle admin
                if (userRole !== 'admin') {
                    router.push('/'); // Redirection si pas admin
                    return;
                }
                
                setIsAuthorized(true);
            } catch (error) {
                console.error("Erreur lors de la vérification du rôle:", error);
                router.push('/'); // Redirection en cas d'erreur
            } finally {
                setIsChecking(false);
            }
        };

        checkAdminRole();
    }, [router]);

    // ================================
    // RÉCUPÉRATION DES DONNÉES
    // ================================
    
    /**
     * Effect pour déclencher la récupération des données quand :
     * - Les dates de filtre changent
     * - L'utilisateur est autorisé
     */
    useEffect(() => {
        if (isAuthorized) {
            fetchRevenus();
        }
    }, [startDate, endDate, isAuthorized]);

    /**
     * Fonction principale pour récupérer et calculer toutes les données du dashboard
     * 
     * Logique :
     * 1. Récupère les revenus basés sur la date de réservation
     * 2. Récupère les passagers basés sur la date du trajet
     * 3. Calcule les tarifs en croisant avec les périodes et tarifications
     */
    const fetchRevenus = async () => {
        setLoading(true);
        setError(null);
        
        // Variables temporaires pour les calculs
        let prixTotalCalculé = 0;
        let revenusTemp = {};
        let passagerTemp = {}; 
        let totalPassagerTemp = { catA: 0, catB: 0, catC: 0 };

        try {
            // === FORMATAGE DES DATES ===
            /**
             * Fonction utilitaire pour formater une date en YYYY-MM-DD
             * Format requis par Supabase pour les comparaisons de dates
             */
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startDateFormatted = formatDate(startDate);
            const endDateFormatted = formatDate(endDate);

            // === RÉCUPÉRATION DES REVENUS ===
            /**
             * Récupération des réservations avec leurs trajets et enregistrements
             * Filtre basé sur la date de réservation (pas la date du trajet)
             * 
             * Structure de données :
             * - reservation : informations de base de la réservation
             * - trajet : informations du trajet associé (liaison, date)
             * - enregistrer : détails des passagers (quantité, type)
             */
            const { data: reservationsData, error: errorReservations } = await supabase
                .from('reservation')
                .select(`
                    num,
                    date,
                    idTrajet,
                    trajet:trajet (
                        idLiaison,
                        date
                    ),
                    enregistrer (
                        quantite,
                        type_num
                    )
                `)
                .gte('date', startDateFormatted) // >= date de début
                .lte('date', endDateFormatted);  // <= date de fin

            if (errorReservations) throw errorReservations;

            // === RÉCUPÉRATION DES PASSAGERS ===
            /**
             * Récupération des trajets avec leurs réservations
             * Filtre basé sur la date du trajet (pas la date de réservation)
             * 
             * Utilisé pour calculer le nombre de passagers par jour de voyage
             */
            const { data: trajetsData, error: errorTrajets } = await supabase
                .from('trajet')
                .select(`
                    num,
                    date,
                    idLiaison,
                    reservation!reservation_idTrajet_fkey (
                        num,
                        enregistrer (
                            quantite,
                            type_num
                        )
                    )
                `)
                .gte('date', startDateFormatted)
                .lte('date', endDateFormatted);

            if (errorTrajets) throw errorTrajets;

            // === TRAITEMENT DES REVENUS ===
            /**
             * Pour chaque réservation :
             * 1. Trouve la période tarifaire correspondante à la date du trajet
             * 2. Récupère les tarifs pour cette période et liaison
             * 3. Calcule le montant total (quantité × tarif)
             * 4. Accumule par date de réservation
             */
            for (const reservation of reservationsData) {
                let montantTotal = 0;
                
                // Recherche de la période tarifaire active pour la date du trajet
                const { data: periode, error: periodeError } = await supabase
                    .from('periode')
                    .select('id')
                    .lte('dateDeb', reservation.trajet.date)  // dateDeb <= trajet.date
                    .gte('dateFin', reservation.trajet.date)  // dateFin >= trajet.date
                    .single();

                if (periodeError || !periode) {
                    console.error("Erreur lors de la récupération de la période:", periodeError);
                    // Gestion d'erreur : période non trouvée
                    return {
                        notFound: true,
                    };
                }

                // Récupération de tous les tarifs pour cette période
                const { data: tarifs, error: errorTarifs } = await supabase
                    .from('tarifer')
                    .select('*')
                    .eq("idPeriode", periode.id);

                if (errorTarifs) throw errorTarifs;

                // Création d'un index des tarifs pour un accès rapide
                // Structure : {"liaison_code-type": tarif}
                const tarifsMap = {};
                tarifs.forEach(tarif => {
                    tarifsMap[`${tarif.liaison_code}-${tarif.type}`] = tarif.tarif;
                });

                // Calcul du montant pour chaque enregistrement de la réservation
                for (const enregistrement of reservation.enregistrer) {
                    const tarifKey = `${reservation.trajet.idLiaison}-${enregistrement.type_num}`;
                    const tarif = tarifsMap[tarifKey];
                    montantTotal += enregistrement.quantite * tarif;
                }

                // Accumulation des totaux
                prixTotalCalculé += montantTotal;
                revenusTemp[reservation.date] = (revenusTemp[reservation.date] || 0) + montantTotal;
            }

            // === TRAITEMENT DES PASSAGERS ===
            /**
             * Classification des passagers par catégories :
             * - Cat A : types 1-3
             * - Cat B : types 4-5  
             * - Cat C : types 6+
             * 
             * Regroupement par date de trajet (jour de voyage effectif)
             */
            for (const trajet of trajetsData) {
                // Initialisation des compteurs pour cette date si nécessaire
                if (!passagerTemp[trajet.date]) {
                    passagerTemp[trajet.date] = { catA: 0, catB: 0, catC: 0 };
                }

                // Parcours des réservations de ce trajet
                for (const reservation of trajet.reservation || []) {
                    for (const enregistrement of reservation.enregistrer) {
                        // Classification par catégorie selon le type_num
                        if (enregistrement.type_num <= 3) {
                            passagerTemp[trajet.date].catA += enregistrement.quantite;
                            totalPassagerTemp.catA += enregistrement.quantite;
                        } else if (enregistrement.type_num <= 5) {
                            passagerTemp[trajet.date].catB += enregistrement.quantite;
                            totalPassagerTemp.catB += enregistrement.quantite;
                        } else {
                            passagerTemp[trajet.date].catC += enregistrement.quantite;
                            totalPassagerTemp.catC += enregistrement.quantite;
                        }
                    }
                }
            }

            // === MISE À JOUR DES ÉTATS ===
            setPrixTotal(prixTotalCalculé);
            setRevenusParDate(revenusTemp);
            setPassagerParDate(passagerTemp);
            setTotalPassagers(totalPassagerTemp);
            
        } catch (err) {
            setError('Une erreur est survenue lors du calcul des revenus.');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    // ================================
    // PRÉPARATION DES DONNÉES POUR LES GRAPHIQUES
    // ================================
    
    /**
     * Génération de toutes les dates entre startDate et endDate
     * Nécessaire pour afficher les jours sans données (valeur 0)
     * sur les graphiques pour une continuité visuelle
     */
    const allDates = [];
    let currentDate = new Date(startDate);
    const endDateForLoop = new Date(endDate);
    endDateForLoop.setHours(23, 59, 59, 999); // Inclusion du dernier jour complet

    while (currentDate <= endDateForLoop) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        allDates.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Données formatées pour le graphique des revenus
    const chartData = allDates.map(date => ({
        date,
        revenus: revenusParDate[date] || 0 // 0 si pas de données pour cette date
    }));

    // Données formatées pour le graphique des passagers par catégorie
    const chartPassagerCategorie = allDates.map(date => ({
        date,
        catA: passagerParDate[date]?.catA || 0,
        catB: passagerParDate[date]?.catB || 0,
        catC: passagerParDate[date]?.catC || 0
    }));

    // ================================
    // GESTION DE L'AFFICHAGE CONDITIONNEL
    // ================================
    
    /**
     * Affichage du loader pendant la vérification des droits
     * ou si l'utilisateur n'est pas autorisé
     */
    if (isChecking || !isAuthorized) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <LoadingSpinner text="Vérification des droits d'accès..." />
            </div>
        );
    }

    // ================================
    // RENDU DU COMPOSANT
    // ================================
    
    return (
        <div className="pt-16 pb-8 w-9/12 mx-auto">
            {/* En-tête du tableau de bord */}
            <h2 className="text-3xl font-bold mb-6 text-center">Tableau de Bord</h2>

            {/* Section des filtres et navigation */}
            <div className="flex lg:flex-row flex-col justify-between items-center">
                
                {/* Filtres de dates */}
                <div className="flex flex-wrap items-center gap-4 bg-blue-50 p-4 rounded-xl mb-6 shadow-sm">
                    {/* Sélecteur de date de début */}
                    <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-500" size={20} />
                        <label className="text-sm font-medium text-gray-700">Date de début</label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            className="border p-2 rounded-md w-32 text-center"
                            dateFormat="dd-MM-yyyy"
                            locale={fr} // Localisation française
                        />
                    </div>
                    
                    {/* Sélecteur de date de fin */}
                    <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-500" size={20} />
                        <label className="text-sm font-medium text-gray-700">Date de fin</label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            className="border p-2 rounded-md w-32 text-center"
                            dateFormat="dd-MM-yyyy"
                            locale={fr}
                        />
                    </div>
                </div>
                
                {/* Lien vers la gestion des liaisons */}
                <div className="mr-4 bg-blue-50 p-4 rounded-xl mb-6 shadow-sm">
                    <Link href="/gestionLiaison">Gestion des liaisons</Link>
                </div>
            </div>
            
            {/* Contenu principal : statistiques et graphiques */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Affichage conditionnel : loader ou contenu */}
                {loading ? (
                    <div className="w-full flex justify-center items-center min-h-[400px]">
                        <LoadingSpinner text="Chargement des données..." />
                    </div>
                ) : (
                    <>
                        {/* === COLONNE GAUCHE : STATISTIQUES === */}
                        <div className="lg:w-1/4 space-y-6">
                            
                            {/* Carte des revenus totaux */}
                            <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <FiDollarSign className="text-green-600" size={24} />
                                    <h3 className="text-lg font-semibold">Revenus</h3>
                                </div>
                                {error ? (
                                    <p className="text-red-500">{error}</p>
                                ) : (
                                    <p className="text-2xl font-bold text-green-700">{prixTotal} €</p>
                                )}
                            </div>

                            {/* Carte des statistiques de passagers */}
                            <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <FiBarChart2 className="text-blue-600" size={24} />
                                    <h3 className="text-lg font-semibold">Passager</h3>
                                </div>
                                {/* Total général */}
                                <p className="text-lg">{totalPassagers.catA + totalPassagers.catB + totalPassagers.catC} passagers</p>
                                {/* Détail par catégorie */}
                                <ul className="pl-2 border-l border-black">
                                    <li>Cat A: {totalPassagers.catA}</li>
                                    <li>Cat B: {totalPassagers.catB}</li>
                                    <li>Cat C: {totalPassagers.catC}</li>
                                </ul>
                            </div>
                        </div>

                        {/* === COLONNE DROITE : GRAPHIQUES === */}
                        <div className="lg:w-3/4 space-y-6">
                            
                            {/* Graphique linéaire des revenus */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-xl font-semibold mb-4">Revenus par date</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line 
                                            type="monotone" 
                                            dataKey="revenus" 
                                            stroke="#4CAF50" 
                                            strokeWidth={2} 
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Graphique en barres empilées des passagers */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-xl font-semibold mb-4">Passagers par catégorie</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartPassagerCategorie}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        {/* Barres empilées pour chaque catégorie */}
                                        <Bar dataKey="catA" stackId="a" fill="#8884d8" name="Catégorie A" />
                                        <Bar dataKey="catB" stackId="a" fill="#82ca9d" name="Catégorie B" />
                                        <Bar dataKey="catC" stackId="a" fill="#ffc658" name="Catégorie C" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}