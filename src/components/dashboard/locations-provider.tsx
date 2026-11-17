"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PageLoader } from "@/src/components/ui/page-loader";
import { useCurrentUser } from "@/src/components/dashboard/current-user-provider";
import { api, type ApiLocation } from "@/src/lib/api";
import type { Location, LocationInput } from "@/src/lib/mock-locations";

type LocationsContextValue = {
  locations: Location[];
  /** Names of locations that can take users, for the "Location" dropdowns */
  names: string[];
  /** The location the dashboard is showing. A global admin picks it in the top bar; everyone else is fixed to their own. */
  active: Location;
  /** POST /api/auth/location, then reloads the page so every list is fetched again for that location. Rejects with the server's message. */
  setActive: (id: string) => Promise<void>;
  /** POST /api/locations. These three reject with the server's message when it says no. */
  addLocation: (values: LocationInput) => Promise<Location>;
  updateLocation: (id: string, values: LocationInput) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;
};

const LocationsContext = createContext<LocationsContextValue | null>(null);

const toLocation = (l: ApiLocation): Location => ({
  id: l.id,
  name: l.name,
  address: l.address,
  city: l.city,
  status: l.status,
  primary: l.primary,
  created: new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
});

/**
 * Lives in app/dashboard/layout.tsx so the top bar, Users, Control Panel and Locations all share one list.
 * A global admin gets every location from GET /api/locations; everyone else gets their own.
 * The dashboard waits for the list, because every page needs at least one location.
 * The picked location is kept on the server (a cookie), and every API route filters by it, so switching reloads the page
 * rather than patching each list in memory.
 */
export function LocationsProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState("");
  // user.locationId is already the location the server is using, so this matches what the data pages show
  const activeId = user.locationId;

  const load = useCallback(
    () =>
      api<{ items: ApiLocation[] }>("/locations")
        .then((data) => {
          setLocations(data.items.map(toLocation));
          setError("");
        })
        .catch((err: Error) => setError(err.message)),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const addLocation = useCallback(async (values: LocationInput) => {
    const data = await api<{ location: ApiLocation }>("/locations", { method: "POST", body: values });
    const location = toLocation(data.location);
    setLocations((current) => [...current, location]);
    return location;
  }, []);

  const updateLocation = useCallback(async (id: string, values: LocationInput) => {
    const data = await api<{ location: ApiLocation }>(`/locations/${encodeURIComponent(id)}`, { method: "PATCH", body: values });
    setLocations((current) => current.map((location) => (location.id === id ? toLocation(data.location) : location)));
  }, []);

  const setActive = useCallback(
    async (id: string) => {
      if (id === activeId) return;
      await api("/auth/location", { method: "POST", body: { locationId: id } });
      // a full page load so nothing from the old location stays in memory
      window.location.reload();
    },
    [activeId],
  );

  const removeLocation = useCallback(
    async (id: string) => {
      await api(`/locations/${encodeURIComponent(id)}`, { method: "DELETE" });
      // the server falls back to the home location when the one being viewed is gone
      if (id === activeId) window.location.reload();
      else setLocations((current) => current.filter((location) => location.id !== id));
    },
    [activeId],
  );

  const value = useMemo<LocationsContextValue>(
    () => ({
      locations,
      names: locations.filter((location) => location.status === "active").map((location) => location.name),
      active: locations.find((location) => location.id === activeId) ?? locations[0],
      setActive,
      addLocation,
      updateLocation,
      removeLocation,
    }),
    [locations, activeId, setActive, addLocation, updateLocation, removeLocation],
  );

  if (locations.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center text-sm text-soft">
        {error ? (
          <div role="alert">
            <p className="mb-3">{error}</p>
            <button type="button" onClick={() => void load()} className="font-semibold text-brand hover:text-brand-hover">
              Try again
            </button>
          </div>
        ) : (
          <PageLoader fullScreen label="Loading locations…" />
        )}
      </div>
    );
  }

  return <LocationsContext.Provider value={value}>{children}</LocationsContext.Provider>;
}

export function useLocations() {
  const context = useContext(LocationsContext);
  if (!context) throw new Error("useLocations must be used inside <LocationsProvider>");
  return context;
}
