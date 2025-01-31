import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Admin() {
    const [prixTotal, setPrixTotal] = useState(0); // State pour stocker le prix total
    const [loading, setLoading] = useState(true); // State pour gérer le chargement
    const [error, setError] = useState(null); // State pour gérer les erreurs
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';
    const revenusPeriode = async () => {
       
        let prixTotalCalculé = 0;

        try {
            const { data: reservations, error: errorReservation } = await supabase
                .from('reservation')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate);

            if (errorReservation) throw errorReservation;

            for (const reservation of reservations) {
                const { data: enregistrements, error: errorEnregistrements } = await supabase
                    .from('enregistrer')
                    .select('*')
                    .eq('reservation_num', reservation.num);
                
                console.log('enregistrement: ',enregistrements);


                if (errorEnregistrements) throw errorEnregistrements;

                const { data: trajet, error: errorTrajet } = await supabase
                    .from('trajet')
                    .select('*')
                    .eq('num', reservation.idTrajet)
                    .single();
                for (const enregistrement of enregistrements) {
                    
                    console.log('trajet: ',trajet);
                    if (errorTrajet) throw errorTrajet;
                    console.log('🔎 Vérification des valeurs avant requête tarifer');
                    console.log('liaison_code:', trajet.idLiaison);
                    console.log('type:', enregistrement?.type_num);

                    const { data: prix, error: errorPrix } = await supabase
                        .from('tarifer')
                        .select('*')
                        .eq('liaison_code', trajet.idLiaison)
                        .eq('type', enregistrement.type_num)
                        .single();

                    console.log('🔎 Résultat de la requête tarifer:', prix.tarif);


                    if (errorPrix) throw errorPrix;

                    prixTotalCalculé += enregistrement.quantite * prix.tarif; // Assure-toi que `prix.amount` existe et contient le prix
                    console.log("prix total: ",prixTotalCalculé);
                }
            }

            // Mettre à jour l'état avec le prix total calculé
            setPrixTotal(prixTotalCalculé);

        } catch (err) {
            setError('Une erreur est survenue lors du calcul des revenus.');
            console.error('Erreur:', err);
        } finally {
            setLoading(false); // On peut maintenant arrêter le chargement
        }
    };

    useEffect(() => {
        revenusPeriode();
    }, []); // Appelle la fonction au montage du composant

    return (
        <div className="pt-16 pb-8 w-9/12 mx-auto">
            {loading && <p>Chargement...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && <p>Total des revenus : {prixTotal} € sur la période du {startDate} au {endDate} </p>}
        </div>
    );
}
