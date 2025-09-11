import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Menu, User, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useRouter } from "next/router";
import usePersonalizedNavigation from "../hooks/usePersonalizedNavigation";
const jebLogo = new URL("../../public/logo.jpeg", import.meta.url).href;

interface HeaderProps {
  currentPage?: string;
}

export function Header({ currentPage = "home" }: HeaderProps) {
  const router = useRouter();
  const { userProfile, navigationItems, userActions, handleLogout } = usePersonalizedNavigation();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!userProfile.isAuthenticated) return;
    const fetchUnread = async () => {
      try {
  const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
  const url = base ? `${base}/api/messages/unread_count/` : '/api/messages/unread_count/';
  const res = await fetch(url, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setUnreadCount(json.unread_count || 0);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchUnread();
    // could add websocket or polling here for realtime updates
  }, [userProfile.isAuthenticated]);

  const handleNavigation = (href: string, action?: string) => {
    if (action === 'logout') {
      handleLogout();
    } else {
      router.push(href);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => handleNavigation("/")}>
            <img 
              src={jebLogo} 
              alt="JEB Logo" 
              className="h-10 w-auto"
            />
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`px-3 py-2 rounded-md transition-colors ${
                  currentPage === item.id
                    ? "text-primary bg-primary/10"
                    : "text-gray-700 hover:text-primary hover:bg-gray-50"
                }`}
              >
                  <div className="flex items-center space-x-2">
                    <span>{item.label}</span>
                    {item.id === 'messages' && unreadCount > 0 ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </div>
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {userProfile.isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {userProfile.type.charAt(0).toUpperCase() + userProfile.type.slice(1)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLogout()}
                    className="hidden sm:inline-flex"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                {userActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.id === 'login' ? "ghost" : "default"}
                    size="sm"
                    onClick={() => handleNavigation(action.href, action.action)}
                    className="hidden sm:inline-flex"
                  >
                    {action.label}
                  </Button>
                ))}
              </>
            )}

            {/* Menu Mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.href)}
                      className={`text-left px-4 py-3 rounded-md transition-colors ${
                        currentPage === item.id
                          ? "text-primary bg-primary/10"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  
                  {/* User Actions Mobile */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    {userProfile.isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600 px-4">
                          Logged in as: {userProfile.type.charAt(0).toUpperCase() + userProfile.type.slice(1)}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleLogout()}
                          className="w-full"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {userActions.map((action) => (
                          <Button
                            key={action.id}
                            variant={action.id === 'login' ? "outline" : "default"}
                            onClick={() => handleNavigation(action.href, action.action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
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