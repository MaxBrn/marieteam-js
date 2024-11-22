import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { promisePool } from '@/lib/db'; // Assurez-vous que vous avez une fonction promisePool pour la connexion à la BDD
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'votre-secret-pour-jwt';

export default async function login(req, res) {
  if (req.method === 'POST') {
    const { mail, mdp } = req.body;

    if (!mail || !mdp) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    try {
      // Vérifier si l'utilisateur existe
      const [rows]= await promisePool.query('SELECT * FROM compte WHERE mail = ?', [mail]);

      // Si l'utilisateur n'existe pas, retourner une erreur
      if (rows.length === 0) {
        return res.status(400).json({ message: 'Utilisateur non trouvé' });
      }

      const user = rows[0];

      // Comparer le mot de passe fourni avec le mot de passe stocké
      const isPasswordValid = await bcrypt.compare(mdp, user.mdp);

      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Mot de passe incorrect' });
      }

      // Créer un token JWT
      const token = jwt.sign(
        { id: user.id, mail: user.mail },
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
