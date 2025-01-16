import Image from "next/image";
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="flex flex-col justify-center items-center border border-slate-300 pt-4 w-9/12 m-auto rounded-xl mb-4" >
      <div className="justify-center">
        <Image
          src="/images/logoMarieteam.png"
          width={70}
          height={70}
          alt="Logo MarieTeam"
        />
      </div>
      
      <div className="gap-10 flex mt-3 mb-3 ">
        <Link href="/listetrajet">Réserver Trajet</Link>
      </div>

      <div className="flex justify-between bg-blue-50 w-full py-2 px-4 rounded-b-xl">
        <Link href="/" className="ml-10">Copyright @ 2024 MarieTeam</Link>
        <Link href="/politiquesconf" className="mr-10">Politiques de Confidentialité</Link>
        <Link href="/mentionslegales" className="mr-10">Mentions légales</Link>
      </div>
    </footer>
  );
}
