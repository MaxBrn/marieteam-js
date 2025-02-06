import Link from 'next/link';
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from '@/lib/supabase';
import { fr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { FiCalendar, FiBarChart2, FiDollarSign } from 'react-icons/fi';

export default function Admin() {
    const [prixTotal, setPrixTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(new Date('2025-01-01'));
    const [endDate, setEndDate] = useState(new Date('2025-01-31'));
    const [revenusParDate, setRevenusParDate] = useState({});
    const [passagerParDate, setPassagerParDate] = useState({});
    const [totalPassagers, setTotalPassagers] = useState({ catA: 0, catB: 0, catC: 0 });

    const fetchRevenus = async () => {
        setLoading(true);
        setError(null);
        let prixTotalCalculé = 0;
        let revenusTemp = {};
        let passagerTemp = {}; 
        let totalPassagerTemp = { catA: 0, catB: 0, catC: 0 };

        try {
            const { data: reservations, error: errorReservation } = await supabase
                .from('reservation')
                .select('*')
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0]);

            if (errorReservation) throw errorReservation;

            for (const reservation of reservations) {
                const { data: enregistrements, error: errorEnregistrements } = await supabase
                    .from('enregistrer')
                    .select('*')
                    .eq('reservation_num', reservation.num);

                if (errorEnregistrements) throw errorEnregistrements;

                const { data: trajet, error: errorTrajet } = await supabase
                    .from('trajet')
                    .select('*')
                    .eq('num', reservation.idTrajet)
                    .single();

                if (errorTrajet) throw errorTrajet;

                let catA = 0, catB = 0, catC = 0;

                for (const enregistrement of enregistrements) {
                    const { data: prix, error: errorPrix } = await supabase
                        .from('tarifer')
                        .select('*')
                        .eq('liaison_code', trajet.idLiaison)
                        .eq('type', enregistrement.type_num)
                        .single();

                    if (errorPrix) throw errorPrix;

                    if (enregistrement.type_num == 1 || enregistrement.type_num == 2 || enregistrement.type_num == 3) {
                        catA += enregistrement.quantite;
                    } else if (enregistrement.type_num == 4 || enregistrement.type_num == 5) {
                        catB += enregistrement.quantite;
                    } else if (enregistrement.type_num == 6 || enregistrement.type_num == 7) {
                        catC += enregistrement.quantite;
                    }

                    const montant = enregistrement.quantite * prix.tarif;
                    prixTotalCalculé += montant;

                    const dateResa = reservation.date;
                    
                    if (!passagerTemp[dateResa]) {
                        passagerTemp[dateResa] = { catA: 0, catB: 0, catC: 0 };
                    }

                    totalPassagerTemp.catA += catA;
                    totalPassagerTemp.catB += catB;
                    totalPassagerTemp.catC += catC;

                    passagerTemp[dateResa].catA += catA;
                    passagerTemp[dateResa].catB += catB;
                    passagerTemp[dateResa].catC += catC;

                    revenusTemp[dateResa] = (revenusTemp[dateResa] || 0) + montant;
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

    useEffect(() => {
        fetchRevenus();
    }, [startDate, endDate]);

    const allDates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const formattedDate = currentDate.toISOString().split('T')[0];
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
                {/* Détails et Stats */}
                <div className="lg:w-1/4 space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <FiDollarSign className="text-green-600" size={24} />
                            <h3 className="text-lg font-semibold">Revenus</h3>
                        </div>
                        {loading ? (
                            <p>Chargement...</p>
                        ) : error ? (
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
            </div>
        </div>
    );
}