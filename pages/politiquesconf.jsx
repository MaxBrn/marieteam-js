import React from 'react';

const PolitiqueDeConfidentialite = () => {
  return (
    <>
      {/* Section principale de la politique de confidentialité */}
      <section className="pt-16 pb-8 w-16/12 mx-auto">
        <div className="flex flex-col lg:flex-row justify-center items-stretch">
          {/* Texte de la politique de confidentialité */}
          <div className="lg:w-1/2 p-6 lg:p-12 text-s border border-slate-300 rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none bg-white">
            <h1 className="text-center text-2xl font-semibold">Politique de Confidentialité</h1>
            
            <h2 className="mt-5 text-xl font-semibold">1. Introduction</h2>
            <p>
              Cette politique de confidentialité décrit comment MarieTeam collecte, utilise et protège les informations personnelles des utilisateurs de son site web. En utilisant notre site, vous consentez à la collecte et à l'utilisation de vos informations conformément à cette politique.
            </p>

            <h2 className="mt-5 text-xl font-semibold">2. Informations collectées</h2>
            <p>
              Nous pouvons collecter les informations suivantes :<br />
              - Nom et prénom<br />
              - Adresse e-mail<br />
              - Numéro de téléphone<br />
              - Informations de paiement (le cas échéant)<br />
              - Données de navigation (cookies, adresses IP, etc.)
            </p>

            <h2 className="mt-5 text-xl font-semibold">3. Utilisation des informations</h2>
            <p>
              Les informations que nous collectons peuvent être utilisées pour :<br />
              - Gérer votre compte et vos réservations<br />
              - Améliorer notre service client<br />
              - Vous envoyer des informations et mises à jour concernant votre réservation<br />
              - Vous contacter pour des études de marché ou des enquêtes de satisfaction
            </p>

            <h2 className="mt-5 text-xl font-semibold">4. Protection des informations</h2>
            <p>
              Nous mettons en œuvre une variété de mesures de sécurité pour maintenir la sécurité de vos informations personnelles. Cependant, aucune méthode de transmission sur Internet ou méthode de stockage électronique n'est sécurisée à 100 %.
            </p>

            <h2 className="mt-5 text-xl font-semibold">5. Partage des informations</h2>
            <p>
              Nous ne vendons, n'échangeons ni ne transférons vos informations personnelles à des tiers sans votre consentement, sauf si cela est nécessaire pour fournir nos services ou si la loi l'exige.
            </p>

            <h2 className="mt-5 text-xl font-semibold">6. Vos droits</h2>
            <p>
              Conformément à la législation en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, veuillez nous contacter à l'adresse suivante : ylian.bertrand@gastonberger.fr, maxime.brunin@gastonberger.fr ou auxence.dupuis@gastonberger.fr.
            </p>

            <h2 className="mt-5 text-xl font-semibold">7. Cookies</h2>
            <p>
              Notre site utilise des cookies pour améliorer votre expérience. Vous pouvez choisir de désactiver les cookies via les paramètres de votre navigateur.
            </p>

            <h2 className="mt-5 text-xl font-semibold">8. Liens vers d'autres sites</h2>
            <p>
              Notre site peut contenir des liens vers d'autres sites. Nous ne sommes pas responsables des pratiques de confidentialité de ces sites et vous encourageons à lire leurs politiques de confidentialité.
            </p>

            <h2 className="mt-5 text-xl font-semibold">9. Modifications de la politique</h2>
            <p>
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour.
            </p>

            <h2 className="mt-5 text-xl font-semibold">10. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à : ylian.bertrand@gastonberger.fr, maxime.brunin@gastonberger.fr ou auxence.dupuis@gastonberger.fr.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default PolitiqueDeConfidentialite;