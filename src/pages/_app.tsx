import { type Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { type AppType } from "next/app";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";

import { trpc } from "~/utils/api";

import "~/styles/globals.css";
import Header from "~/components/layout/Header";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { atomWithLocalStorage, cn } from "~/lib/utils";
import { SpectodaConnectionProvider } from "~/lib/SpectodaConnectionContext";
import Footer from "~/components/layout/Footer";
import Head from "next/head";
import { useAtom } from "jotai";
import { createPortal } from "react-dom";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const MyApp: AppType<{ session: Session | null }> = ({ Component, pageProps: { session, ...pageProps } }) => {
  return (
    <>
      <Head>
        <title>Karaoke Midi přehrávač s vizualizací</title>
        <meta name="description" content="Karaoke MIDI přehrávač s vizualizací na světlech, vytvořeno v rámci bakalářské práce" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta property="og:locale" content="cs_CZ" />
      </Head>
      <SessionProvider session={session}>
        <LukyAppProvider>
          <div className={`min-h-[100vh] dark:bg-black bg-white font-sans dark:text-white text-black transition-colors duration-300 ease-in-out ${inter.variable}`}>
            <Header />
            <main className={cn(`mx-auto w-full max-w-[1280px] px-8 text-center min-h-[calc(100vh-200px)] `)}>
              <Component {...pageProps} />
              <Toaster />
            </main>
            <Footer />
          </div>
        </LukyAppProvider>
      </SessionProvider>
    </>
  );
};

function LukyAppProvider({ children }: React.PropsWithChildren) {
  return (
    <AuthProvider>
      <ClientOnlyRender>
        <ThemeProvider>
          <SpectodaConnectionProvider>{children}</SpectodaConnectionProvider>
        </ThemeProvider>
      </ClientOnlyRender>
    </AuthProvider>
  );
}

export const themeAtom = atomWithLocalStorage<"dark" | "light">("theme", "dark");

function ThemeProvider({ children }: React.PropsWithChildren) {
  const [theme] = useAtom(themeAtom);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return <div className={theme}>{children}</div>;
}

function ClientOnlyRender({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}

function AuthProvider({ children }: React.PropsWithChildren) {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (typeof session !== "undefined") {
      console.log({ session });

      if (router.pathname === "/play/local" || router.pathname.includes("/play/demo")) {
        return;
      }
      // If the user is logged in and tries to access the login page, redirect to the home page
      if (session?.user && router.pathname === "/login") {
        void router.push("/");
      }
      // If the user is not logged in and tries to access a protected page, redirect to the login page
      if (!session?.user && router.pathname !== "/login") {
        void router.push("/login");
      }
    }
  }, [session, router]);

  return children;
}

export default trpc.withTRPC(MyApp);
