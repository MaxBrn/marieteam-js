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

export default function Admin() {
    const router = useRouter();
    const [prixTotal, setPrixTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(new Date('2025-01-01'));
    const [endDate, setEndDate] = useState(new Date('2025-01-31'));
    const [revenusParDate, setRevenusParDate] = useState({});
    const [passagerParDate, setPassagerParDate] = useState({});
    const [totalPassagers, setTotalPassagers] = useState({ catA: 0, catB: 0, catC: 0 });
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Vérification du rôle administrateur
    useEffect(() => {
        const checkAdminRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const userRole = user?.user_metadata?.role;
                
                if (userRole !== 'admin') {
                    router.push('/');
                    return;
                }
                
                setIsAuthorized(true);
            } catch (error) {
                console.error("Erreur lors de la vérification du rôle:", error);
                router.push('/');
            } finally {
                setIsChecking(false);
            }
        };

        checkAdminRole();
    }, [router]);

    // Effet pour récupérer les revenus
    useEffect(() => {
        if (isAuthorized) {
            fetchRevenus();
        }
    }, [startDate, endDate, isAuthorized]);

    const fetchRevenus = async () => {
        setLoading(true);
        setError(null);
        let prixTotalCalculé = 0;
        let revenusTemp = {};
        let passagerTemp = {}; 
        let totalPassagerTemp = { catA: 0, catB: 0, catC: 0 };

        try {
            // Formatage des dates en YYYY-MM-DD
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startDateFormatted = formatDate(startDate);
            const endDateFormatted = formatDate(endDate);

            // 1. Récupérer les revenus (basé sur la date de réservation)
            const { data: reservationsData, error: errorReservations } = await supabase
                .from('reservation')
                .select(`
                    num,
                    date,
                    idTrajet,
                    trajet:trajet (
                        idLiaison
                    ),
                    enregistrer (
                        quantite,
                        type_num
                    )
                `)
                .gte('date', startDateFormatted)
                .lte('date', endDateFormatted);

            if (errorReservations) throw errorReservations;

            // 2. Récupérer les passagers (basé sur la date du trajet)
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

            // Récupérer tous les tarifs en une seule fois
            const { data: tarifs, error: errorTarifs } = await supabase
                .from('tarifer')
                .select('*');

            if (errorTarifs) throw errorTarifs;

            // Créer un map des tarifs pour un accès rapide
            const tarifsMap = {};
            tarifs.forEach(tarif => {
                tarifsMap[`${tarif.liaison_code}-${tarif.type}`] = tarif.tarif;
            });

            // Traiter les revenus
            for (const reservation of reservationsData) {
                let montantTotal = 0;
                
                for (const enregistrement of reservation.enregistrer) {
                    const tarifKey = `${reservation.trajet.idLiaison}-${enregistrement.type_num}`;
                    const tarif = tarifsMap[tarifKey];
                    montantTotal += enregistrement.quantite * tarif;
                }

                prixTotalCalculé += montantTotal;
                revenusTemp[reservation.date] = (revenusTemp[reservation.date] || 0) + montantTotal;
            }

            // Traiter les passagers
            for (const trajet of trajetsData) {
                if (!passagerTemp[trajet.date]) {
                    passagerTemp[trajet.date] = { catA: 0, catB: 0, catC: 0 };
                }

                for (const reservation of trajet.reservation || []) {
                    for (const enregistrement of reservation.enregistrer) {
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

    // Génération des dates pour le graphique
    const allDates = [];
    let currentDate = new Date(startDate);
    const endDateForLoop = new Date(endDate);
    endDateForLoop.setHours(23, 59, 59, 999); // Pour s'assurer d'inclure le dernier jour

    while (currentDate <= endDateForLoop) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        allDates.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const chartData = allDates.map(date => ({
        date,
        revenus: revenusParDate[date] || 0
    }));

    const chartPassagerCategorie = allDates.map(date => ({
        date,
        catA: passagerParDate[date]?.catA || 0,
        catB: passagerParDate[date]?.catB || 0,
        catC: passagerParDate[date]?.catC || 0
    }));

    // Si la vérification est en cours ou si l'utilisateur n'est pas autorisé, afficher un chargement
    if (isChecking || !isAuthorized) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <LoadingSpinner text="Vérification des droits d'accès..." />
            </div>
        );
    }

    return (
        <div className="pt-16 pb-8 w-9/12 mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Tableau de Bord</h2>

            <div className="flex lg:flex-row flex-col justify-between items-center">
                {/* Filtres en haut */}
                <div className="flex flex-wrap items-center gap-4 bg-blue-50 p-4 rounded-xl mb-6 shadow-sm">
                    <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-500" size={20} />
                        <label className="text-sm font-medium text-gray-700">Date de début</label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            className="border p-2 rounded-md w-32 text-center"
                            dateFormat="dd-MM-yyyy"
                            locale={fr}
                        />
                    </div>
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
                <div className="mr-4 bg-blue-50 p-4 rounded-xl mb-6 shadow-sm">
                    <Link href="/gestionLiaison">Gestion des liaisons</Link>
                </div>

            </div>
            
            <div className="flex flex-col lg:flex-row gap-6">
                {loading ? (
                    <div className="w-full flex justify-center items-center min-h-[400px]">
                        <LoadingSpinner text="Chargement des données..." />
                    </div>
                ) : (
                    <>
                        {/* Détails et Stats */}
                        <div className="lg:w-1/4 space-y-6">
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

                            <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <FiBarChart2 className="text-blue-600" size={24} />
                                    <h3 className="text-lg font-semibold">Passager</h3>
                                </div>
                                <p className="text-lg">{totalPassagers.catA + totalPassagers.catB + totalPassagers.catC} passagers</p>
                                <ul className="pl-2 border-l border-black">
                                    <li>Cat A: {totalPassagers.catA}</li>
                                    <li>Cat B: {totalPassagers.catB}</li>
                                    <li>Cat C: {totalPassagers.catC}</li>
                                </ul>
                            </div>
                        </div>

                        {/* Graphiques (plus larges) */}
                        <div className="lg:w-3/4 space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-xl font-semibold mb-4">Revenus par date</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="revenus" stroke="#4CAF50" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="text-xl font-semibold mb-4">Passagers par catégorie</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartPassagerCategorie}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
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