import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase'; // Assurez-vous que vous avez correctement configuré votre client Supabase

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { nom, prenom, mail, mdp } = req.body;

    // Validation des entrées
    if (!nom || !prenom || !mail || !mdp) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
    }

    try {
      // Vérifier si l'email est déjà utilisé via Supabase
      const { data, error } = await supabase
        .from('compte')
        .select('mail')
        .eq('mail', mail)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 signifie "Aucune ligne trouvée"
        console.error(error);
        return res.status(500).json({ message: 'Erreur de vérification de l\'email' });
      }

      if (data) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé' });
      }

      // Créer un nouvel utilisateur dans Supabase (authentification)
      const { user, signupError } = await supabase.auth.signUp({
        email: mail,
        password: mdp,
      });

      if (signupError) {
        console.error(signupError);
        return res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
      }

      // Ajouter des informations supplémentaires à la table "compte" (prénom, nom)
      const { error: insertError } = await supabase
        .from('compte')
        .insert([
          {
            id: user.id,  // L'ID utilisateur généré par Supabase
            prenom,
            nom,
            mail,
          }
        ]);

      if (insertError) {
        console.error(insertError);
        return res.status(500).json({ message: 'Erreur lors de l\'enregistrement des informations utilisateur' });
      }

      // Retourner une réponse de succès
      return res.status(201).json({ message: 'Utilisateur créé avec succès', userId: user.id });

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
  } else {
    // Si la méthode HTTP n'est pas POST
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
}
