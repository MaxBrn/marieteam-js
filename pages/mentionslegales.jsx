import React from 'react';

const MentionsLegales = () => {
  return (
    <>
      {/* Section principale des mentions légales */}
      <section className="pt-16 pb-8 w-16/12 mx-auto">
        <div className="flex flex-col lg:flex-row justify-center items-stretch">
          {/* Texte des mentions légales */}
          <div className="lg:w-1/2 p-6 lg:p-12 text-s border border-slate-300 rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none bg-white">
            <h1 className="text-center text-2xl font-semibold">Mentions Légales</h1>
            <h2 className="mt-5 text-xl font-semibold">1. Présentation du site</h2>
            <p>
              En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site https://mariteam.vercel.app l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.
            </p>

            <h2 className="mt-5 text-xl font-semibold">2. Propriétaire du site</h2>
            <p>
              Nom de l'entreprise : MarieTeam<br />
              Adresse : Avenue Gaston Berger,59000 Lille, France<br />
              Téléphone : +33 6 78 90 12 34<br />
              Email : ylian.bertrand@gastonberger.fr, maxime.brunin@gastonberger.fr ou auxence.dupuis@gastonberger.fr<br />
              Capital social : 10 000 000 €<br />
              RCS : Paris B 123 456 789
            </p>

            <h2 className="mt-5 text-xl font-semibold">3. Directeurs de la publication</h2>
            <p>
              Nom : Ylian BERTRAND<br />
              Email : ylian.bertrand@gastonberger.fr<br />
              Nom : Maxime BRUNIN<br />
              Email : maxime.brunin@gastonberger.fr<br />
              Nom : Auxence DUPUIS<br />
              Email : auxence.dupuis@gastonberger.fr<br />
            </p>

            <h2 className="mt-5 text-xl font-semibold">4. Hébergeur</h2>
            <p>
              Hébergeur : Vercel<br />
              Adresse : San Fransisco, Etats-Unis<br />
            </p>

            <h2 className="mt-5 text-xl font-semibold">5. Propriété intellectuelle</h2>
            <p>
              L'ensemble des contenus présents sur le site https://mariteam.vercel.app, incluant, de façon non limitative, les graphismes, images, textes, vidéos, animations, sons, logos, gifs et icônes ainsi que leur mise en forme sont la propriété exclusive de MarieTeam, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
            </p>

            <h2 className="mt-5 text-xl font-semibold">6. Données personnelles</h2>
            <p>
              Les informations recueillies sur ce site sont enregistrées dans un fichier informatisé par MarieTeam pour la gestion de la relation client. Elles sont conservées pendant 3 ans et sont destinées uniquement à l'usage de MarieTeam. Conformément à la loi "Informatique et Libertés", vous pouvez exercer votre droit d'accès aux données vous concernant et les faire rectifier en contactant : ylian.bertrand@gastonberger.fr, maxime.brunin@gastonberger.fr ou auxence.dupuis@gastonberger.fr.
            </p>

            <h2 className="mt-5 text-xl font-semibold">7. Cookies</h2>
            <p>
              Le site https://mariteam.vercel.app utilise des cookies pour améliorer l'expérience utilisateur. Vous pouvez choisir de désactiver les cookies en modifiant les paramètres de votre navigateur.
            </p>

            <h2 className="mt-5 text-xl font-semibold">8. Liens hypertextes</h2>
            <p>
              Le site https://mariteam.vercel.app peut contenir des liens hypertextes vers d'autres sites. MarieTeam n'est pas responsable du contenu de ces sites et ne peut être tenue responsable des dommages résultant de leur utilisation.
            </p>

            <h2 className="mt-5 text-xl font-semibold">9. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par la loi française. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default MentionsLegales;
``