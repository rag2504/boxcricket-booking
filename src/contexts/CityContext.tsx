import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { indianCities, type City } from "@/lib/cities";

const STORAGE_KEY = "boxcric_selected_city";

function readStoredCity(): City | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<City>;
    if (!parsed?.id) return undefined;
    const canonical = indianCities.find((c) => c.id === parsed.id);
    return canonical ?? (parsed as City);
  } catch {
    return undefined;
  }
}

type CityContextValue = {
  selectedCity: City | undefined;
  setSelectedCity: (city: City | undefined) => void;
  isLocationSelectorOpen: boolean;
  setLocationSelectorOpen: (open: boolean) => void;
};

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<City | undefined>(() =>
    readStoredCity()
  );
  const [isLocationSelectorOpen, setLocationSelectorOpen] = useState(false);

  const setSelectedCity = useCallback((city: City | undefined) => {
    setSelectedCityState(city);
    try {
      if (city) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setSelectedCityState(readStoredCity());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      selectedCity,
      setSelectedCity,
      isLocationSelectorOpen,
      setLocationSelectorOpen,
    }),
    [selectedCity, setSelectedCity, isLocationSelectorOpen]
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity(): CityContextValue {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error("useCity must be used within CityProvider");
  }
  return ctx;
}
