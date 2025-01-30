import React from 'react';

const PolitiqueDeConfidentialite = () => {
  return (
    <>
      <section className="pt-16 pb-8 w-9/12 mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-center items-center">
          <div className="lg:w-full p-6 lg:p-12">
            <h1 className="text-center text-3xl font-bold text-gray-800">Politique de Confidentialité</h1>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">1. Introduction</h2>
            <p className="mt-2 text-gray-600">
              Cette politique de confidentialité décrit comment MarieTeam collecte, utilise et protège les informations personnelles des utilisateurs de son site web. En utilisant notre site, vous consentez à la collecte et à l'utilisation de vos informations conformément à cette politique.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">2. Informations collectées</h2>
            <ul className="mt-2 list-disc list-inside text-gray-600">
              <li>Nom et prénom</li>
              <li>Adresse e-mail</li>
              <li>Numéro de téléphone</li>
              <li>Informations de paiement (le cas échéant)</li>
              <li>Données de navigation (cookies, adresses IP, etc.)</li>
            </ul>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">3. Utilisation des informations</h2>
            <p className="mt-2 text-gray-600">
              Les informations que nous collectons peuvent être utilisées pour :<br />
              - Gérer votre compte et vos réservations<br />
              - Améliorer notre service client<br />
              - Vous envoyer des informations et mises à jour concernant votre réservation<br />
              - Vous contacter pour des études de marché ou des enquêtes de satisfaction
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">4. Protection des informations</h2>
            <p className="mt-2 text-gray-600">
              Nous mettons en œuvre une variété de mesures de sécurité pour maintenir la sécurité de vos informations personnelles. Cependant, aucune méthode de transmission sur Internet ou méthode de stockage électronique n'est sécurisée à 100 %.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">5. Partage des informations</h2>
            <p className="mt-2 text-gray-600">
              Nous ne vendons, n'échangeons ni ne transférons vos informations personnelles à des tiers sans votre consentement, sauf si cela est nécessaire pour fournir nos services ou si la loi l'exige.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">6. Vos droits</h2>
            <p className="mt-2 text-gray-600">
              Conformément à la législation en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, veuillez nous contacter à l'adresse suivante : <br />
              <a href="mailto:ylian.bertrand@gastonberger.fr" className="text-blue-500 hover:underline">ylian.bertrand@gastonberger.fr</a>, 
              <a href="mailto:maxime.brunin@gastonberger.fr" className="text-blue-500 hover:underline"> maxime.brunin@gastonberger.fr</a>, ou 
              <a href="mailto:auxence.dupuis@gastonberger.fr" className="text-blue-500 hover:underline"> auxence.dupuis@gastonberger.fr</a>.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">7. Cookies</h2>
            <p className="mt-2 text-gray-600">
              Notre site utilise des cookies pour améliorer votre expérience. Vous pouvez choisir de désactiver les cookies via les paramètres de votre navigateur.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">8. Liens vers d'autres sites</h2>
            <p className="mt-2 text-gray-600">
              Notre site peut contenir des liens vers d'autres sites. Nous ne sommes pas responsables des pratiques de confidentialité de ces sites et vous encourageons à lire leurs politiques de confidentialité.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">9. Modifications de la politique</h2>
            <p className="mt-2 text-gray-600">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour.
            </p>

            <h2 className="mt-6 text-2xl font-semibold text-gray-700">10. Contact</h2>
            <p className="mt-2 text-gray-600">
              Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à : <br />
              <a href="mailto:ylian.bertrand@gastonberger.fr" className="text-blue-500 hover:underline">ylian.bertrand@gastonberger.fr</a>, 
              <a href="mailto:maxime.brunin@gastonberger.fr" className="text-blue-500 hover:underline"> maxime.brunin@gastonberger.fr</a>, ou 
              <a href="mailto:auxence.dupuis@gastonberger.fr" className="text-blue-500 hover:underline"> auxence.dupuis@gastonberger.fr</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default PolitiqueDeConfidentialite;
