"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {pathname !== "/" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/">
                    <ArrowLeft size={16} className="mr-2" />
                    Back
                  </Link>
                </Button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                Search Arena
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
