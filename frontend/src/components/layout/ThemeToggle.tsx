import { Theme, getStoredTheme, getSystemTheme, setTheme } from "@/lib/utils/theme-utils";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');

  useEffect(() => {
    setMounted(true);
    const storedTheme = getStoredTheme();
    const theme = storedTheme || getSystemTheme();
    setCurrentTheme(theme);
    setTheme(theme);
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    setTheme(newTheme);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 left-4 rounded-full w-10 h-10 z-50"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {currentTheme === 'light' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
