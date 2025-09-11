import React from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Header } from '../components/Header';
import Footer from '../components/Footer';

function mapPathToPageId(pathname: string) {
  if (!pathname) return 'home';
  const p = pathname.toLowerCase();
  if (p.includes('admindashboard')) return 'admin';
  if (p.includes('startups')) return 'startups';
  if (p.includes('news')) return 'news';
  if (p.includes('events') || p.includes('calendar')) return 'events';
  if (p.includes('opportunities')) return 'opportunities';
  if (p.includes('message')) return 'messages';
  return 'home';
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const currentPage = mapPathToPageId(router.pathname);

  return (
    <>
      <div id="top-level-header">
        <Header currentPage={currentPage} />
      </div>
      <Component {...pageProps} />
      <Footer />
    </>
  );
}
