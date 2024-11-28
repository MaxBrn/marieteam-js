import { useState } from 'react';
import Link from 'next/link';

export default function ListeTrajet() {
    // Liste des trajets récupérés
    const [trajetList, setTrajetList] = useState([]);
    const [selectedTrajet, setSelectedTrajet] = useState(null);
    const [depart, setDepart] = useState('');
    const [arrivee, setArrivee] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Fonction pour afficher les détails d'un trajet
    const handleClick = (trajet) => {
        setSelectedTrajet(trajet);
    };

    // Fonction pour gérer la soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault(); // Empêche le rafraîchissement de la page
        const dateFormat = date.substring(8,10)+'-'+date.substring(5,7)+'-'+date.substring(0,4);
        setLoading(true);
        setMessage('');
    
        const response = await fetch('/api/rechercheTrajetAPI', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ depart, arrivee, dateFormat}),
        });
    
        const data = await response.json();
        setLoading(false);
    
        if (response.ok) {
            setTrajetList(data.trajets); // Met à jour la liste des trajets récupérés
        } else {
            setMessage(data.message); // Affiche un message d'erreur
        }
    };
    
    return (
        <>
            <div className="py-16 w-9/12 m-auto">
                <div>
                    <form className="w-1/2 m-auto mb-10" onSubmit={handleSubmit}>
                        <input
                            id="depart"
                            type="text"
                            placeholder={"Saisir un départ"}
                            value={depart} // Liaison avec l'état
                            onChange={(e) => setDepart(e.target.value)} // Met à jour l'état
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                            id="arrivee"
                            type="text"
                            placeholder={"Saisir une arrivée"}
                            value={arrivee} // Liaison avec l'état
                            onChange={(e) => setArrivee(e.target.value)} // Met à jour l'état
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                            id="date"
                            type="date"
                            value={date} // Liaison avec l'état
                            onChange={(e) => setDate(e.target.value)} // Met à jour l'état
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                            id="submit"
                            type="submit"
                            value="Rechercher"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </form>
                </div>

                <div className="flex">
                    {/* Conteneur des trajets avec hauteur fixe et défilement vertical */}
                    <div
                        className="flex flex-col w-2/3 overflow-y-auto max-h-[400px] pr-4
                        [&::-webkit-scrollbar]:w-1
                        [&::-webkit-scrollbar-track]:rounded-full
                        [&::-webkit-scrollbar-track]:bg-gray-100
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-gray-300 mr-40 snap-y gap-y-10"
                        style={{
                            height: '270px',  // Hauteur correspondant à 4 éléments visibles
                        }}
                    >
                        {/* Liste des trajets */}
                        {trajetList.map((trajet) => (
                            <div
                                key={trajet.id}
                                className="w-full m-auto flex rounded-md bg-blue-50 snap-start cursor-pointer"
                                onClick={() => handleClick(trajet)}
                            >
                                <div className="w-[10%] text-center border-r-4 border-white py-2">
                                    <p>{trajet.heureDepart}<br />{trajet.heureArrivee}</p>
                                </div>
                                <div className="w-[90%] pl-5 m-auto">
                                    <p>{trajet.idBateau}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="w-1/3 m-auto rounded-md bg-blue-50 p-3">
                        {selectedTrajet ? (
                            <>
                                <div>
                                    <p>
                                        {selectedTrajet.heureDepart} - Lieu1 <br />
                                        {selectedTrajet.heureArrivee} - Lieu 2<br />
                                    </p>
                                </div>
                                <div className="py-5 w-full border-b-4 border-white">
                                    <Link href="/" className="p-3 bg-sky-900 rounded-xl text-white w-[80%] m-auto block text-center">
                                        Réserver ce trajet
                                    </Link>
                                </div>
                                <div className="pt-5">
                                    <p>
                                        {selectedTrajet.idBateau} <br/>
                                        Places disponibles:<br/>
                                    </p>
                                
                                    <ul className='pl-2 border-l border-black'>
                                        <li>Place passager: </li>
                                        <li>Place véhicule inférieur à 2m:</li>
                                        <li>Place véhicule supérieur à 2m: </li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <p className="text-center">Sélectionnez un trajet pour voir les détails.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
