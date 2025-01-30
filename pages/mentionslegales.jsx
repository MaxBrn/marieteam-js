import React from 'react';

const MentionsLegales = () => {
  return (
    <>
      <section className="pt-16 pb-8 w-9/12 mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-center items-center">
          <div className="lg:w-full p-6 lg:p-12">
            <h1 className="text-center text-3xl font-bold text-gray-800">Mentions Légales</h1>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">1. Présentation du site</h2>
            <p className="mt-2 text-gray-600">
              En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site <a href="https://mariteam.vercel.app" className="text-blue-500 hover:underline">https://mariteam.vercel.app</a> l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">2. Propriétaire du site</h2>
            <p className="mt-2 text-gray-600">
              Nom de l'entreprise : MarieTeam<br />
              Adresse : Avenue Gaston Berger, 59000 Lille, France<br />
              Téléphone : +33 6 78 90 12 34<br />
              Email : <a href="mailto:ylian.bertrand@gastonberger.fr" className="text-blue-500 hover:underline">ylian.bertrand@gastonberger.fr</a>, <a href="mailto:maxime.brunin@gastonberger.fr" className="text-blue-500 hover:underline">maxime.brunin@gastonberger.fr</a>, <a href="mailto:auxence.dupuis@gastonberger.fr" className="text-blue-500 hover:underline">auxence.dupuis@gastonberger.fr</a><br />
              Capital social : 10 000 000 €<br />
              RCS : Paris B 123 456 789
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">3. Directeurs de la publication</h2>
            <ul className="mt-2 list-disc list-inside text-gray-600">
              <li>Ylian BERTRAND - <a href="mailto:ylian.bertrand@gastonberger.fr" className="text-blue-500 hover:underline">ylian.bertrand@gastonberger.fr</a></li>
              <li>Maxime BRUNIN - <a href="mailto:maxime.brunin@gastonberger.fr" className="text-blue-500 hover:underline">maxime.brunin@gastonberger.fr</a></li>
              <li>Auxence DUPUIS - <a href="mailto:auxence.dupuis@gastonberger.fr" className="text-blue-500 hover:underline">auxence.dupuis@gastonberger.fr</a></li>
            </ul>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">4. Hébergeur</h2>
            <p className="mt-2 text-gray-600">
              Hébergeur : Vercel<br />
              Adresse : San Francisco, États-Unis
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">5. Propriété intellectuelle</h2>
            <p className="mt-2 text-gray-600">
              L'ensemble des contenus présents sur le site <a href="https://mariteam.vercel.app" className="text-blue-500 hover:underline">https://mariteam.vercel.app</a>, incluant, de façon non limitative, les graphismes, images, textes, vidéos, animations, sons, logos, gifs et icônes ainsi que leur mise en forme sont la propriété exclusive de MarieTeam.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">6. Données personnelles</h2>
            <p className="mt-2 text-gray-600">
              Les informations recueillies sur ce site sont enregistrées dans un fichier informatisé par MarieTeam pour la gestion de la relation client. Elles sont conservées pendant 3 ans et sont destinées uniquement à l'usage de MarieTeam. Pour exercer votre droit d'accès et de rectification, contactez : <a href="mailto:ylian.bertrand@gastonberger.fr" className="text-blue-500 hover:underline">ylian.bertrand@gastonberger.fr</a>, <a href="mailto:maxime.brunin@gastonberger.fr" className="text-blue-500 hover:underline">maxime.brunin@gastonberger.fr</a>, ou <a href="mailto:auxence.dupuis@gastonberger.fr" className="text-blue-500 hover:underline">auxence.dupuis@gastonberger.fr</a>.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">7. Cookies</h2>
            <p className="mt-2 text-gray-600">
              Le site <a href="https://mariteam.vercel.app" className="text-blue-500 hover:underline">https://mariteam.vercel.app</a> utilise des cookies pour améliorer l'expérience utilisateur. Vous pouvez les désactiver dans les paramètres de votre navigateur.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">8. Liens hypertextes</h2>
            <p className="mt-2 text-gray-600">
              Ce site peut contenir des liens vers d'autres sites. MarieTeam n'est pas responsable du contenu de ces sites et ne peut être tenue responsable des dommages résultant de leur utilisation.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">9. Droit applicable</h2>
            <p className="mt-2 text-gray-600">
              Les présentes mentions légales sont régies par la loi française. En cas de litige, seuls les tribunaux français seront compétents.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default MentionsLegales;
