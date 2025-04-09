import { useState, useEffect } from "react";
import { AiFillEdit } from "react-icons/ai"; // Icône de stylo
import { AiOutlineClose, AiOutlineCheckCircle } from "react-icons/ai"; // Icône de fermeture
import { supabase } from "@/lib/supabase";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { IoTicket } from "react-icons/io5";
import { BsTicketDetailed } from "react-icons/bs";
import LoadingSpinner from "@/components/LoadingSpinner";

const Compte = () => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [userData, setUserData] = useState({
    display_name: "",
    prenom: "",
    nom: "",
    email: "",
    reservation: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Nombre d'éléments par page
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' pour ascendant, 'desc' pour descendant

  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      const { data: reservation, error: reservationError } = await supabase
        .from("reservation")
        .select("*")
        .eq("idCompte", user.id);

      if (reservationError) throw reservationError;

      const detailedReservations = await Promise.all(
        reservation.map(async (res) => {
          const { data: trajet } = await supabase
            .from("trajet")
            .select("*")
            .eq("num", res.idTrajet)
            .single();

          const date = trajet.date.substring(8,10)+"/"+trajet.date.substring(5,7)+"/"+trajet.date.substring(0,4) + " de " 
          + trajet.heureDepart.substring(0,2)+"h"+trajet.heureDepart.substring(3,5) 
          + " à " + trajet.heureArrivee.substring(0,2)+"h"+trajet.heureArrivee.substring(3,5);

          const { data: liaison } = await supabase
            .from("liaison")
            .select("*")
            .eq("code", trajet.idLiaison)
            .single();

          const { data: depart } = await supabase
            .from("port")
            .select("nom")
            .eq("id", liaison.depart_id)
            .single();

          const { data: arrivee } = await supabase
            .from("port")
            .select("nom")
            .eq("id", liaison.arrivee_id)
            .single();

          const { data: placesReserves } = await supabase
            .from("enregistrer")
            .select("*")
            .eq("reservation_num", res.num);

          const detailedSeats = await Promise.all(
            placesReserves.map(async (place) => {
              const { data: seatType } = await supabase
                .from("type")
                .select("*")
                .eq("num", place.type_num)
                .single();

              const { data: seatPrice } = await supabase
                .from("tarifer")
                .select("*")
                .eq("liaison_code", liaison.code)
                .eq("type", place.type_num)
                .single();

              const totalPrice = seatPrice.tarif * place.quantite;

              return { ...place, type: seatType, tarif: seatPrice.tarif, total: totalPrice };
            })
          );

          return {
            ...res,
            depart_nom: depart.nom,
            arrivee_nom: arrivee.nom,
            date: date,
            places: detailedSeats,
          };
        })
      );

      setUserData({
        display_name: user.user_metadata?.display_name || "Nom inconnu",
        prenom: user.user_metadata?.prenom || "",
        nom: user.user_metadata?.nom || "",
        email: user.email,
        reservation: detailedReservations,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchUser().finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setUserData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        email: userData.email,
        data: {
          display_name: `${userData.prenom} ${userData.nom}`,
          prenom: userData.prenom,
          nom: userData.nom,
        },
      });

      if (error) throw error;

      await fetchUser();

      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setSelectedReservation(null);

  // Fonction pour trier les réservations
  const sortedReservations = [...userData.reservation].sort((a, b) => {
    const dateA = new Date(a.date.split(' ')[0].split('/').reverse().join('-'));
    const dateB = new Date(b.date.split(' ')[0].split('/').reverse().join('-'));
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Calcul des indices pour la pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedReservations.slice(indexOfFirstItem, indexOfLastItem);

  // Fonction pour changer de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Fonction pour changer l'ordre de tri
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1); // Réinitialiser à la première page lors du changement de tri
  };

  // Fonction pour générer les numéros de page à afficher
  const getPageNumbers = () => {
    const totalPages = Math.ceil(sortedReservations.length / itemsPerPage);
    const pageNumbers = [];
    
    // Calculer la plage de pages autour de la page courante
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Ajuster si on est proche du début
    if (currentPage <= 2) {
      endPage = Math.min(5, totalPages);
    }
    
    // Ajuster si on est proche de la fin
    if (currentPage >= totalPages - 1) {
      startPage = Math.max(1, totalPages - 4);
    }
    
    // Ajouter les pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  return (
    <>
      {loading ? (
        <div className="w-full flex justify-center items-center min-h-[500px]">
          <LoadingSpinner text="Chargement des données utilisateur..." />
        </div>
      ) : (
        <div className="min-h-screen bg-white-100 flex justify-center items-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl w-full p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Mon Compte</h1>
              {!editing && (
                <button
                  className="bg-zinc-700 text-white px-4 py-2 rounded shadow hover:bg-zinc-600 focus:outline-none flex items-center justify-center ml-4"
                  onClick={() => setEditing(true)}
                >
                  <AiFillEdit className="text-xl" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow">
              {["prenom", "nom", "email"].map((key, index) => (
                <div
                  key={key}
                  className={`bg-blue-50 p-4 rounded shadow ${
                    index === 2 ? "sm:col-span-2" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace("_", " ")}
                    </p>
                    {!editing ? (
                      <p className="text-lg font-semibold text-gray-800">
                        {userData[key]}
                      </p>
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

            <div className="mt-8">
              <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Mes Réservations</h2>
              <button 
                onClick={toggleSortOrder} 
                className="mb-4 px-4 py-2 bg-zinc-700 text-white rounded shadow hover:bg-zinc-600 focus:outline-none"
              >
                Trier par date {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              </div>
              
              {currentItems.length > 0 ? (
                <div className="space-y-4">
                  {currentItems.map((res, index) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 rounded-md shadow flex justify-between items-center"
                    >
                      <div>
                        <p className="">
                          {res.depart_nom} - {res.arrivee_nom} le {res.date}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedReservation(res)}
                      >
                        <BsTicketDetailed className="text-2xl"/>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune réservation trouvée.</p>
              )}
              <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  ←
                </button>
                
                {getPageNumbers().map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`px-3 py-1 rounded ${
                      currentPage === pageNumber 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === Math.ceil(sortedReservations.length / itemsPerPage)}
                  className={`px-3 py-1 rounded ${
                    currentPage === Math.ceil(sortedReservations.length / itemsPerPage)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  →
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>
        </div>
      )}

      {/* Modal pour les détails de réservation */}
      {selectedReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton de fermeture */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              <AiOutlineClose className="text-xl" />
            </button>

            {/* En-tête */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Réservation {selectedReservation.num}
              </h3>
              <p className="text-gray-500 mt-4">
                {selectedReservation.depart_nom} - {selectedReservation.arrivee_nom} le {selectedReservation.date}
              </p>
            </div>

            <hr className="border-gray-200 mb-6" />

            {/* Détails des places */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className=" p-2 mr-2">
                    <IoTicket />
                  </span>
                  Places réservées
                </h4>
                <ul className="space-y-2">
                  {selectedReservation.places.map((place, i) => (
                    <li
                      className="flex justify-between items-center pl-3 text-gray-700"
                      key={i}
                    >
                      <span>{place.type.libelle}</span>
                      <span>
                        {place.quantite} places, {place.tarif} € / place
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total */}
              <div className="text-right">
                <p className="text-lg font-semibold">
                  Prix total :{" "}
                  {selectedReservation.places
                    .reduce((acc, place) => acc + place.total, 0)
                    .toFixed(2)}{" "}
                  €
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Compte;
