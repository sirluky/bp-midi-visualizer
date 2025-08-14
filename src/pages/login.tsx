import { signIn } from "next-auth/react";
import Link from "next/link";
import { type ChangeEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSignInWithEmail = () => {
    void signIn("email", { email });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-y-hidden">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold ">Vítejte v Karaoke MIDI Vizualizátoru</h1>
        <p className="mt-2 text-xl text-gray-600">Přihlaste se a začněte přehrávat vaše oblíbené MIDI.</p>
      </div>
      {/* <h1 className="mb-8 text-3xl font-bold">Přihlášení</h1> */}
      <div className="login-options">
        <div className="bg-discord hover:bg-discord/80 flex cursor-pointer items-center justify-center rounded-lg border p-4 shadow-md transition-colors" onClick={() => signIn("discord")}>
          <DiscordIcon className="mr-4 w-8 dark:fill-black" />
          <span className="font-semibold dark:text-white">Přihlásit se přes Discord</span>
        </div>
        <div className="bg-google hover:bg-google/80 mt-4 flex cursor-pointer items-center justify-center rounded-lg border p-4 shadow-md transition-colors" onClick={() => signIn("google")}>
          <GoogleIcon className="mr-4 w-8" />
          <span className="font-semibold dark:text-white">Přihlásit se přes Google</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">nebo</p>
      <div className="mt-4">
        <input type="email" placeholder="Zadejte svůj email" value={email} onChange={handleEmailChange} className="rounded-lg border border-gray-300 px-4 py-2 text-black focus:border-blue-400 focus:outline-none" />
        <button
          onClick={handleSignInWithEmail}
          className="bg-email hover:bg-email/80 bg-google hover:bg-google/80 mt-4 flex cursor-pointer items-center justify-center rounded-lg border p-4 px-4 py-2 font-semibold dark:text-white shadow-md transition-colors focus:outline-none"
        >
          <EmailIcon className="mr-4 w-8" />
          <span className="font-semibold dark:text-white">Přihlásit se přes Email</span>
        </button>
      </div>
      <p className="mt-5 text-gray-500">Případně si můžete s limitovanou funkcionalitou vyzkoušet:</p>
      <Link href="/play/local" className="link link-warning mt-4">
        Přehrát lokální soubor
      </Link>
    </div>
  );
}

function EmailIcon({ className = "", color = "#fff" }: { className?: string; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
      />
    </svg>
  );
}

function DiscordIcon({ className = "", color: _color = "#fff" }: { className?: string; color?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
      <path
        fill="currentColor"
        d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
      />
    </svg>
  );
}

function GoogleIcon({ className = "", color: _color = "#fff" }: { className?: string; color?: string }) {
  return (
    <svg className={className} fill={color} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      />
    </svg>
  );
}
