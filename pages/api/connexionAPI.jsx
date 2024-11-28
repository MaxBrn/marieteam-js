import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase'; // Assurez-vous que le client Supabase est bien initialisé dans lib/supabase
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'votre-secret-pour-jwt';

export default async function login(req, res) {
  if (req.method === 'POST') {
    const { mail, mdp } = req.body;

    if (!mail || !mdp) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    try {
      // Authentifier l'utilisateur avec Supabase
      const { data: user, error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: mdp,
      });

      // Si l'authentification échoue
      if (error) {
        return res.status(400).json({ message: 'Mot de passe incorrect ou utilisateur non trouvé' });
      }

      // Créer un token JWT
      const token = jwt.sign(
        { id: user.id, mail: user.email },
        secretKey,
        { expiresIn: '1h' } // Le token expire dans 1 heure
      );

      // Retourner une réponse avec le token
      return res.status(200).json({ message: 'Connexion réussie', token });
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return res.status(500).json({ message: 'Une erreur est survenue' });
    }
  } else {
    // Si ce n'est pas une requête POST
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }
}
