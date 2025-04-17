"use client";

import { ModeToggle } from "@/components/layout/ModeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          ResumeMatch
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/" passHref>
              <Button variant={pathname === "/" ? "default" : "ghost"}>
                Single Resume
              </Button>
            </Link>
            <Link href="/batch" passHref>
              <Button variant={pathname === "/batch" ? "default" : "ghost"}>
                Multiple Resumes
              </Button>
            </Link>
            <Link href="/interview-questions" passHref>
              <Button
                variant={
                  pathname === "/interview-questions" ? "default" : "ghost"
                }
              >
                Generate Interview Questions
              </Button>
            </Link>
          </nav>

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
