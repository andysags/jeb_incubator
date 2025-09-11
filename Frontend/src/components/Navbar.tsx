import React from "react";
import { Button } from "./ui/button";
import { Menu, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
const jebLogo = new URL("../../public/logo.jpeg", import.meta.url).href;

interface HeaderProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}


interface NavHeaderProps extends HeaderProps {
  adminOnly?: boolean;
}

export function NavHeader({ currentPage = "Administration", onNavigate, adminOnly = false }: NavHeaderProps) {
  const menuItems = adminOnly
    ? [
        { id: "Administration", label: "Administration" },
      ]
    : [
        { id: "Administration", label: "Administration" },
        { id: "Messagerie", label: "Messagerie" },
        { id: "Opportunity", label: "Opportunity" },
      ];

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavigation("Administration")}>
            <img 
              src={jebLogo}
              alt="JEB Logo"
              className="h-10 w-auto"
            />
            <h1 className="text-red-300 font-bold text-lg ml-2">Admin</h1>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`px-3 py-2 rounded-md transition-colors ${
                  currentPage === item.id
                    ? "text-primary bg-primary/10"
                    : "text-gray-700 hover:text-primary hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h3>Admin JEB </h3>
            {/* Styled like the Exporter button in AdminDashboard */}
            <Button
              className="shadow-sm bg-rose-300 text-white hover:bg-rose-400 border border-rose-200"
              size="sm"
              onClick={() => handleNavigation("login")}
            >
              Logout
            </Button>

            {/* Menu Mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="mr-2 h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`text-left px-4 py-3 rounded-md transition-colors ${
                        currentPage === item.id
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleNavigation("login")}
                    >
                      Logout
                    </Button>
                    <Button onClick={() => handleNavigation("signup")}>Logout</Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}