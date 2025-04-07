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
      <div className="lg:flex lg:flex-col lg:min-h-screen">
        <NavBar />
        <main className="lg:flex-grow">
          <Component {...pageProps} />
        </main>
        <Footer className="mt-4"/>
      </div>
    </>
  );
};

export default MyApp;
