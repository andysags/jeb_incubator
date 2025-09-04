import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[#F8FAFC] shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo à gauche */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <div className="cursor-pointer">
                <Image 
                  src="/assets/logo_jeb.png"
                  alt="JEB Incubator Logo"
                  width={120} 
                  height={40}
                  objectFit="contain"
                />
              </div>
            </Link>
          </div>
          
          {/* Liens de navigation au centre - visible sur desktop */}
          <div className="hidden md:ml-6 md:flex md:items-center md:justify-center md:flex-1">
            <div className="flex space-x-4">
              <Link href="/">
                <span className="px-3 py-2 rounded-md text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-200 cursor-pointer">
                  Accueil
                </span>
              </Link>
              <Link href="/startups">
                <span className="px-3 py-2 rounded-md text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-200 cursor-pointer">
                  Startups
                </span>
              </Link>
              <Link href="/news">
                <span className="px-3 py-2 rounded-md text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-200 cursor-pointer">
                  News
                </span>
              </Link>
              <Link href="/events">
                <span className="px-3 py-2 rounded-md text-sm font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-200 cursor-pointer">
                  Événements
                </span>
              </Link>
            </div>
          </div>
          
          {/* Bouton de connexion à droite */}
          <div className="hidden md:flex md:items-center">
            <Link href="/login">
              <span className="inline-flex items-center px-4 py-2 border border-[#475569] rounded-md shadow-sm text-sm font-medium text-white bg-[#475569] hover:bg-[#334155] transition-colors duration-200 cursor-pointer">
                Connexion
              </span>
            </Link>
          </div>
          
          {/* Menu burger pour mobile */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              aria-expanded="false"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Ouvrir le menu principal</span>
              {/* Icône menu (trois barres) */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icône fermer (X) */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu mobile */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/">
            <span className="block px-3 py-2 rounded-md text-base font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors duration-200 cursor-pointer">
              Accueil
            </span>
          </Link>
          <Link href="/startups">
            <span className="block px-3 py-2 rounded-md text-base font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors duration-200 cursor-pointer">
              Startups
            </span>
          </Link>
          <Link href="/news">
            <span className="block px-3 py-2 rounded-md text-base font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors duration-200 cursor-pointer">
              News
            </span>
          </Link>
          <Link href="/events">
            <span className="block px-3 py-2 rounded-md text-base font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors duration-200 cursor-pointer">
              Événements
            </span>
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-100">
          <div className="px-2 space-y-1">
            <Link href="/login">
              <span className="block px-3 py-2 rounded-md text-base font-medium bg-[#475569] text-white hover:bg-[#334155] transition-colors duration-200 cursor-pointer">
                Connexion
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;