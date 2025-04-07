// pages/_app.tsx
import '@/app/globals.css';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Head from 'next/head';

const MyApp = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Marieteam</title>
      </Head>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-grow">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default MyApp;
