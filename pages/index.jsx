import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
export default function Home() {
    return (
        <>
            <section className="pt-16 pb-8 w-9/12 m-auto">
                <div className="flex justify-center">
                    <div className="w-1/2 p-12 text-s border-t border-l border-b border-slate-300 rounded-l-xl">
                        <p className="mt-5">
                            Bienvenue à bord du navire Marieteam, votre partenaire d’aventure en mer ! 
                            Notre compagnie de croisière est dédiée à offrir des voyages uniques et inoubliables, alliant confort, élégance et exploration. 
                            Que vous rêviez de plages exotiques, de villes côtières historiques ou d’escapades sur des îles secrètes, nos navires vous amènent vers des horizons où chaque vague raconte une histoire.
                        </p>
                    </div>
                    <div className="w-1/2">
                        <video
                            className="object-cover rounded-r-xl"
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

            <section className="pb-16 pt-8 w-9/12 m-auto">
                <div className="flex justify-center">
                    <div className="w-1/2">
                        <Image 
                            src="/images/imageAccueil.jpg" 
                            alt="Image de bienvenue à bord de MarieTeam" 
                            width={800}
                            height={500} 
                            className="object-cover rounded-l-xl"
                        />
                    </div>
                    <div className="w-1/2 p-12 text-s border-t border-r border-b border-slate-300 rounded-r-xl">
                        <h1 className="text-center">Réserver votre trajet</h1>
                        <p className="mt-5">
                            N'oubliez pas de réserver votre trajet en bateau dès que possible. Plus vous réservez tôt, meilleures seront vos chances d'obtenir la date et l'heure que vous souhaitez.
                        </p>
                        <div className="flex gap-20 mt-10 justify-center">
                            <Link href="/listetrajet" className="p-3 bg-sky-900 rounded-xl text-white">Réserver votre trajet</Link>
                            <button className="p-3 bg-sky-100 rounded-xl">Consulter liaison</button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
