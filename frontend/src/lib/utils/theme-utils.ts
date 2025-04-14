export type Theme = "light" | "dark";

export function getSystemTheme(): Theme {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

export function setTheme(theme: Theme): void {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }
}

export function getStoredTheme(): Theme | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("theme") as Theme | null;
  }
  return null;
}
