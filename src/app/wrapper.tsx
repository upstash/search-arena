"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { unstable_ViewTransition as ViewTransition } from "react";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white border-b view-transition-header transition-shadow duration-200 ${
          isScrolled ? "shadow-lg" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center space-x-4">
              {pathname !== "/" && (
                <ViewTransition name="back-button">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/">
                      <ArrowLeft size={16} className="mr-2" />
                      Back
                    </Link>
                  </Button>
                </ViewTransition>
              )}
              <h1 className="text-xl font-semibold text-gray-900 view-transition-title">
                Search Arena
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 view-transition-main">
        <ViewTransition>{children}</ViewTransition>
      </main>
    </div>
  );
};
