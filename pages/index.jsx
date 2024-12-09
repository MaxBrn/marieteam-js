import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
    return (
        <>
            {/* Section vidéo et texte */}
            <section className="pt-16 pb-8 w-9/12 mx-auto">
                <div className="flex flex-col lg:flex-row justify-center items-stretch">
                    {/* Texte */}
                    <div className="lg:w-1/2 p-6 lg:p-12 text-s border border-slate-300 rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none bg-white">
                        <p className="mt-5">
                            Bienvenue à bord du navire Marieteam, votre partenaire d’aventure en mer ! 
                            Notre compagnie de croisière est dédiée à offrir des voyages uniques et inoubliables, alliant confort, élégance et exploration. 
                            Que vous rêviez de plages exotiques, de villes côtières historiques ou d’escapades sur des îles secrètes, nos navires vous amènent vers des horizons où chaque vague raconte une histoire.
                        </p>
                    </div>
                    {/* Vidéo */}
                    <div className="lg:w-1/2">
                        <video
                            className="w-full h-full object-cover rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none"
                            autoPlay
                            muted
                            loop
                        >
                            <source src="/videos/videoAccueil.mp4" type="video/mp4" />
                            Votre navigateur ne supporte pas la lecture de vidéo.
                        </video>
                    </div>
                </div>
            </section>

            {/* Section image et texte */}
            <section className="pb-16 pt-8 w-9/12 mx-auto">
                <div className="flex flex-col lg:flex-row justify-center items-stretch">
                    {/* Image */}
                    <div className="lg:w-1/2">
                        <Image 
                            src="/images/imageAccueil.jpg" 
                            alt="Image de bienvenue à bord de MarieTeam" 
                            width={800}
                            height={500} 
                            className="w-full h-full object-cover rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none"
                        />
                    </div>
                    {/* Texte */}
                    <div className="lg:w-1/2 p-6 lg:p-12 text-s border border-slate-300 rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none bg-white">
                        <h1 className="text-center text-xl font-semibold">Réserver votre trajet</h1>
                        <p className="mt-5">
                            N'oubliez pas de réserver votre trajet en bateau dès que possible. Plus vous réservez tôt, meilleures seront vos chances d'obtenir la date et l'heure que vous souhaitez.
                        </p>
                        <div className="flex gap-4 mt-10 justify-center">
                            <Link href="/listetrajet" className="p-3 bg-sky-900 rounded-xl text-white hover:bg-sky-800 transition">
                                    Réserver votre trajet
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
