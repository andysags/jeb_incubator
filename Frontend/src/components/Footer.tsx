import React, { useState } from "react";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react";
import { useRouter } from "next/router";
import usePersonalizedNavigation from "../hooks/usePersonalizedNavigation";

function Footer() {
  const router = useRouter();
  const { userProfile, navigationItems } = usePersonalizedNavigation();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-3 md:grid-cols-3 gap-[100px]">
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/logo.jpeg" 
                alt=" JEB Logo" 
                className="h-12 w-auto cursor-pointer"
                onClick={() => handleNavigation('/')}
                loading="lazy"
              />
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Platform showcasing incubated startups. Discover tomorrow's innovations and connect with promising entrepreneurs.
            </p>
            <div className="flex space-x-4 mt-2">
              <a href="#" aria-label="Facebook">
                <Facebook className="h-6 w-6 text-gray-400 hover:text-blue-600 transition-colors" />
              </a>
              <a href="#" aria-label="Twitter">
                <Twitter className="h-6 w-6 text-gray-400 hover:text-blue-500 transition-colors" />
              </a>
              <a href="#" aria-label="LinkedIn">
                <Linkedin className="h-6 w-6 text-gray-400 hover:text-blue-700 transition-colors" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick links</h3>
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => handleNavigation(item.href)}
                    className="text-gray-600 hover:text-blue-600 transition-colors text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button 
                  onClick={() => handleNavigation('/about')}
                  className="text-gray-600 hover:text-blue-600 transition-colors text-left"
                >
                  About
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-red-300" />
                <a href="mailto:contact@jeb.com" className="text-gray-600 hover:underline">contact@jeb.com</a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-red-300" />
                <a href="tel:+33123456789" className="text-gray-600 hover:underline">+33 1 23 45 67 89</a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-red-300 mt-1" />
                <div className="text-gray-600">
                  <p>123 Avenue Innovation</p>
                  <p>75001 Paris, France</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600 text-sm">
          <p>&copy; 2025 JEB — All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;