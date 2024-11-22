import { useState } from 'react';
import Link from 'next/link';

export default function ListeTrajet() {
    const n = 10;  // Nombre total de trajets (affichés dans la liste)

    // Liste des trajets avec des données fictives
    const trajetList = new Array(n).fill(null).map((_, index) => ({
        id: index + 1,
        heureDepart: '10h',
        heureArrivee: '11h',
        numeroBateau: `Bateau N°${index + 123456}`,
        placesPassager: 100,
        placesVehiculeInf2m: 15,
        placesVehiculeSup2m: 10,
    }));

    // État pour gérer la div sélectionnée
    const [selectedTrajet, setSelectedTrajet] = useState(null);

    const handleClick = (trajet) => {
        setSelectedTrajet(trajet);
    };
    const [depart, setDepart] = useState('');
    const [arrivee, setArrivee] = useState('');
    const [date, setDate] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage('');

        const response = await fetch('/api/rechercheTrajetAPI', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ depart, arrivee,date }),
        });

        const data = await response.json();
        setLoading(false);

        if (response.ok) {
        // Si la connexion est réussie, stocker le token JWT dans un cookie
        Cookies.set('token', data.token, { expires: 1, secure: true, path: '/' });
        router.push('/');
        window.location.reload;
        } else {
        setMessage(data.message || 'Erreur de connexion.');
        }
    };
    

    return (
        <>
            <div className="py-16 w-9/12 m-auto">
                <div>
                    <form className="w-1/2 m-auto mb-10">
                        <input
                            id="depart"
                            type="text"
                            placeholder={"Saisir un départ"}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                            id="arrivee"
                            type="text"
                            placeholder={"Saisir une arrivée"}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                            id="date"
                            type="date"
                            placeholder={"Saisir une date"}
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
                                    <p>{trajet.numeroBateau}</p>
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
                                        {selectedTrajet.numeroBateau} <br/>
                                        Places disponibles:<br/>
                                    </p>
                                
                                    <ul className='pl-2 border-l border-black'>
                                        <li>Place passager: {selectedTrajet.placesPassager}</li>
                                        <li>Place véhicule inférieur à 2m: {selectedTrajet.placesVehiculeInf2m}</li>
                                        <li>Place véhicule supérieur à 2m: {selectedTrajet.placesVehiculeSup2m}</li>
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
