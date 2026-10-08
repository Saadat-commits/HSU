import { useEffect } from "react";

import { SchemePreference, setPreferredScheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";

const SCHEME_KEY = "hsu.scheme";

// Applies the stored light/dark preference on app start.
export function useStoredScheme() {
  useEffect(() => {
    storage.getItem<string>(SCHEME_KEY, "system").then((value) => {
      if (value === "dark" || value === "light") setPreferredScheme(value);
    });
  }, []);
}

export async function saveScheme(preference: SchemePreference) {
  setPreferredScheme(preference);
  await storage.setItem(SCHEME_KEY, preference ?? "system");
}
