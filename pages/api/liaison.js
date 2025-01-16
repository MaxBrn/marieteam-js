import { supabase } from "@/lib/supabase";  // Importer la connexion Supabase

export default async function handler(req, res) {
  const { method } = req;
  const id = req.query.id;  // Récupérer l'ID depuis la query string

  switch (method) {
    case 'GET':
        if (id) {
          // Si un ID est fourni dans l'URL, on cherche cet enregistrement spécifique
          const { data, error } = await supabase
            .from('liaison')
            .select('*')
            .eq('code', id)  // Filtrer les résultats avec l'ID spécifié

          if (error) return res.status(500).json({ message: 'Erreur lors de la récupération des données' });
          if (data.length === 0) return res.status(404).json({ message: 'Enregistrement non trouvé' });

          return res.status(200).json(data);
        } else {
          // Si aucun ID n'est fourni, récupérer toutes les données
          const { data, error } = await supabase
            .from('liaison')
            .select('*');

          if (error) return res.status(500).json({ message: 'Erreur lors de la récupération des catégories' });
          return res.status(200).json(data);
        }
    default:
      return res.status(405).json({ message: 'Méthode non autorisée' });
  }
}

