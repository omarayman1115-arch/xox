"use client";

import React, { createContext, useContext } from "react";
import { useFavorites } from "@/lib/favorites";

interface FavContextType {
  ids: string[];
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
  hydrated: boolean;
}

const FavContext = createContext<FavContextType>({
  ids: [],
  toggle: () => {},
  isFavorite: () => false,
  hydrated: false,
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const fav = useFavorites();
  return <FavContext.Provider value={fav}>{children}</FavContext.Provider>;
}

export function useFav() {
  return useContext(FavContext);
}
