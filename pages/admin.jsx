import Link from 'next/link';
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from '@/lib/supabase';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Enregistrement des composants Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Admin() {
    const [prixTotal, setPrixTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(new Date('2025-01-01'));
    const [endDate, setEndDate] = useState(new Date('2025-01-31'));
    const [revenusParDate, setRevenusParDate] = useState({});

    const fetchRevenus = async () => {
        setLoading(true);
        setError(null);
        let prixTotalCalculé = 0;
        let revenusTemp = {};

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

                for (const enregistrement of enregistrements) {
                    const { data: prix, error: errorPrix } = await supabase
                        .from('tarifer')
                        .select('*')
                        .eq('liaison_code', trajet.idLiaison)
                        .eq('type', enregistrement.type_num)
                        .single();

                    if (errorPrix) throw errorPrix;

                    const montant = enregistrement.quantite * prix.tarif;
                    prixTotalCalculé += montant;

                    const dateResa = reservation.date; // Assurez-vous que c'est bien stocké en format YYYY-MM-DD
                    revenusTemp[dateResa] = (revenusTemp[dateResa] || 0) + montant;
                }
            }

            setPrixTotal(prixTotalCalculé);
            setRevenusParDate(revenusTemp);
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

    // Générer toutes les dates entre startDate et endDate
    const allDates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const formattedDate = currentDate.toISOString().split('T')[0];
        allDates.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Associer chaque date à un revenu (0 si non présent)
    const formattedRevenus = allDates.map(date => revenusParDate[date] || 0);

    // Préparer les données pour Chart.js
    const chartData = {
        labels: allDates,
        datasets: [
            {
                label: 'Revenus (€)',
                data: formattedRevenus,
                borderColor: 'rgba(75,192,192,1)',
                backgroundColor: 'rgba(75,192,192,0.2)',
                fill: true,
            },
        ],
    };

    return (
        <div className="pt-16 pb-8 w-9/12 mx-auto">
            <h2 className="text-2xl font-bold mb-4">Statistiques des Revenus</h2>

            <div className="flex gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date de début</label>
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        className="border p-2 rounded-md"
                        dateFormat="yyyy-MM-dd"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        className="border p-2 rounded-md"
                        dateFormat="yyyy-MM-dd"
                    />
                </div>
            </div>

            {loading && <p>Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && (
                <p className="mb-4">Total des revenus : {prixTotal} € sur la période du {startDate.toISOString().split('T')[0]} au {endDate.toISOString().split('T')[0]}</p>
            )}

            {/* Affichage du graphique */}
            <div className="w-full bg-white p-4 rounded-md shadow-md">
                <Line data={chartData} />
            </div>
        </div>
    );
}
