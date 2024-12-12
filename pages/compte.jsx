import { useState } from 'react';
import { AiFillEdit } from "react-icons/ai"; // Icône de stylo
 
const Compte = () => {
  const [userData, setUserData] = useState({
    display_name: 'Dupuis Auxence', // Exemple de données utilisateur
    email: 'auxence.dupuis@gastonberger.fr',
    phone: '0665652048',
  });
  const [editing, setEditing] = useState(false); // Indicateur pour savoir si on est en mode édition
  const [newUserData, setNewUserData] = useState(userData); // Stocke les nouvelles valeurs à appliquer
 
  // Fonction pour activer ou désactiver le mode édition
  const handleEdit = () => {
    setEditing(true);
  };
 
  // Fonction pour gérer la mise à jour des champs modifiés
  const handleChange = (field, value) => {
    setNewUserData({ ...newUserData, [field]: value });
  };
 
  // Fonction pour valider et enregistrer les modifications
  const handleSave = () => {
    setUserData(newUserData);
    setEditing(false);
  };
 
  return (
    <div className="min-h-screen bg-white-100 flex justify-center items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white shadow rounded-lg p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mon Compte</h1>
          {!editing && (
            <button
              className="bg-zinc-700 text-white px-4 py-2 rounded shadow hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:bg-zinc-700 focus:ring-offset-2 flex items-center justify-center ml-4"
              onClick={handleEdit}
            >
              <AiFillEdit className="text-xl" />
            </button>
          )}
        </div>
 
        <div className="space-y-6 flex-grow">
          {Object.entries(newUserData).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-4 rounded-md border border-gray-200"
            >
              <div>
                <p className="text-sm font-medium text-gray-500 capitalize">{key.replace('_', ' ')}</p>
                {!editing ? (
                  <p className="text-lg font-semibold text-gray-800">{value}</p>
                ) : (
                  <input
                    type={key === 'email' ? 'email' : 'text'}
                    value={newUserData[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
 
        {editing && (
          <div className="flex justify-center mt-8">
            <button
              className="bg-zinc-700 text-white px-4 py-2 rounded shadow hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:bg-zinc-700 focus:ring-offset-2"
              onClick={handleSave}
            >
              Valider
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
 
export default Compte;