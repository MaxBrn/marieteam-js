import { NextApiRequest, NextApiResponse } from 'next';
import { promisePool } from '@/lib/db'; // Assurez-vous que vous avez correctement configuré votre pool MySQL
import bcrypt from 'bcryptjs'; // Pour hasher les mots de passe

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { nom, prenom, mail, mdp } = req.body;

    // Validation des entrées
    if (!nom || !prenom || !mail || !mdp) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
    }

    try {
      // Vérifier si l'email est déjà utilisé
      const [result] = await promisePool.query('SELECT * FROM compte WHERE mail = ?', [mail]);

      // Si result est un tableau (pour une requête SELECT), on vérifie la longueur
      if (Array.isArray(result)) {
        if (result.length > 0) {
          return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        }
      } else {
        // Si result n'est pas un tableau (cas d'une autre requête comme INSERT, UPDATE)
        console.log(result);
      }

      // Hacher le mot de passe avant de le stocker
      const hashedPassword = await bcrypt.hash(mdp, 10);

      // Générer un ID unique pour l'utilisateur
      const userId = 'user_' + Date.now(); // Par exemple, un ID basé sur le timestamp

      // Insérer l'utilisateur dans la base de données
      const [insertResult] = await promisePool.query(
        'INSERT INTO compte (prenom, nom, mail, mdp) VALUES (?, ?, ?, ?)',
        [prenom, nom, mail, hashedPassword]
      );

      // Retourner une réponse de succès
      return res.status(201).json({ message: 'Utilisateur créé avec succès', userId: userId });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
  } else {
    res.status(405).json({ message: 'Méthode non autorisée' });
  }
}

