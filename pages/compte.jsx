import { useState, useEffect } from "react";
import { AiFillEdit } from "react-icons/ai"; // Icône de stylo
import { supabase } from "@/lib/supabase";

const Compte = () => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    display_name: "",
    prenom: "",
    nom: "",
    email: "",
  });

  // Fonction pour récupérer les données utilisateur
  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      setUserData({
        display_name: user.user_metadata?.display_name || "Nom inconnu", // Si tu utilises user_metadata pour le display_name
        prenom: user.user_metadata?.prenom || "",
        nom: user.user_metadata?.nom || "",
        email: user.email,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Récupération initiale des données utilisateur
  useEffect(() => {
    fetchUser();
  }, []);

  // Gestion des modifications
  const handleChange = (key, value) => {
    setUserData((prev) => ({ ...prev, [key]: value }));
  };

  // Enregistrement des modifications dans Supabase
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mise à jour des données utilisateur dans Supabase
      const { error } = await supabase.auth.updateUser({
        email: userData.email,
        data: {
          display_name: `${userData.prenom} ${userData.nom}`,
          prenom: userData.prenom,
          nom: userData.nom,
        },
      });

      if (error) throw error;

      // Réactualiser les données utilisateur après sauvegarde
      await fetchUser();

      setEditing(false); // Sort du mode édition après succès
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white-100 flex justify-center items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white shadow rounded-lg p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mon Compte</h1>
          {!editing && (
            <button
              className="bg-zinc-700 text-white px-4 py-2 rounded shadow hover:bg-zinc-600 focus:outline-none flex items-center justify-center ml-4"
              onClick={() => setEditing(true)}
            >
              <AiFillEdit className="text-xl" />
            </button>
          )}
        </div>

        <div className="space-y-6 flex-grow">
          {/* Affichage ou édition des données */}
          {["prenom", "nom", "email"].map((key) => (
            <div
              key={key}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-4 rounded-md border border-gray-200"
            >
              <div>
                <p className="text-sm font-medium text-gray-500 capitalize">{key.replace("_", " ")}</p>
                {!editing ? (
                  <p className="text-lg font-semibold text-gray-800">{userData[key]}</p>
                ) : (
                  <input
                    type={key === "email" ? "email" : "text"}
                    value={userData[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bouton de validation des modifications */}
        {editing && (
          <div className="flex justify-center mt-8">
            <button
              className="bg-zinc-700 text-white px-4 py-2 rounded shadow hover:bg-zinc-600 focus:outline-none"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Valider"}
            </button>
          </div>
        )}

        {/* Affichage des erreurs */}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Compte;
