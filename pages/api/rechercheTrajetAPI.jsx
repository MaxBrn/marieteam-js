import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { depart, arrivee, dateFormat } = req.body;

    // Validation des entrées
    if (!depart || !arrivee || !dateFormat) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    try {
      const { data, error } = await supabase
        .rpc('recherche_trajets_combined', {
            depart: depart,
            arrivee: arrivee,
            date: dateFormat
        });

      if (error) {
          console.error('Error fetching trajets:', error);
      } else {
          console.log('Combined data:', data);
      }


      if (!data || data.length === 0) {
        return res.status(404).json({ message: 'Aucun trajet trouvé avec ces critères.' });
      }

      return res.status(200).json({ trajets: data });

    } catch (error) {
      console.error('Erreur lors de la recherche des trajets:', error);
      return res.status(500).json({ message: 'Erreur lors de la recherche des trajets.' });
    }
  } else {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
}
