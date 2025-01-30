// pages/_app.jsx
import { Poppins } from '@next/font/google';
import '@/app/globals.css'; // Ton fichier CSS global
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Head from 'next/head';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'], // Ajoute les poids nécessaires
  variable: '--font-poppins' // Crée une variable CSS
});

const MyApp = ({ Component, pageProps }) => {
  return (
    <div className={poppins.variable}>
      <Head>
        <title>Marieteam</title>
      </Head>
      <NavBar />
      <Component {...pageProps} />
      <Footer />
    </div>
  );
};

export default MyApp;
