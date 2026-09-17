"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useProperties } from "@/lib/properties";
import { useFav } from "./FavoritesProvider";
import PropertyCard from "./PropertyCard";
import type { Property } from "@/lib/types";

export default function FavoritesView({ onOpen }: { onOpen: (p: Property) => void }) {
  const { t } = useLang();
  const { properties, loading } = useProperties();
  const { ids, hydrated } = useFav();

  const favs = properties.filter((p) => ids.includes(p.id));

  if (!hydrated || loading) {
    return (
      <div className="py-20 text-center text-slate-400">{t("loading")}</div>
    );
  }

  if (favs.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-6xl mb-4">💔</p>
        <h2 className="text-lg font-extrabold text-slate-700">{t("favEmpty")}</h2>
        <p className="text-sm text-slate-400 mt-1">{t("favEmptyHint")}</p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-[#1e3a8a] text-white font-bold hover:bg-[#172554] transition-colors"
        >
          {t("browseProperties")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mt-5 mb-3">
        <Heart className="text-rose-500 fill-rose-500" size={22} />
        {t("favorites")}
        <span className="text-sm text-slate-400">({favs.length})</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {favs.map((p) => (
          <PropertyCard key={p.id} property={p} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
