import mysql from 'mysql2';

// Configuration de la connexion à la base de données MySQL
const pool = mysql.createPool({
  host: 'localhost', // adresse de votre serveur MySQL
  user: 'root', // votre nom d'utilisateur MySQL
  password: '', // votre mot de passe MySQL
  database: 'bdd-marieteam', // le nom de votre base de données
});

// Exportation du pool pour réutilisation dans d'autres fichiers
export const promisePool = pool.promise();
