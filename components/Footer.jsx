import Image from "next/image";
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="flex flex-col justify-center items-center border border-slate-300 pt-4 lg:w-9/12 m-auto lg:rounded-xl lg:mb-4 mt-4" >
      <div className="justify-center">
        <Image
          src="/images/logoMarieteam.png"
          width={70}
          height={70}
          alt="Logo MarieTeam"
          className="mb-4"
        />
      </div>

      <div className="flex justify-between bg-blue-50 w-full py-2 px-4 rounded-b-xl">
        <Link href="/" className="ml-10">Copyright @ 2024 MarieTeam</Link>
        <Link href="/politiquesconf" className="mr-10">Politiques de Confidentialité</Link>
        <Link href="/mentionslegales" className="mr-10">Mentions légales</Link>
      </div>
    </footer>
  );
}
