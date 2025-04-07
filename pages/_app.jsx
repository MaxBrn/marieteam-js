// pages/_app.tsx
import '@/app/globals.css'; // ton fichier CSS global
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer'
import Head from 'next/head';

const MyApp = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Marieteam</title>
      </Head>
      <NavBar /> 
      <Component {...pageProps} /> 
      <Footer/>
    </>
  );
};

export default MyApp;
