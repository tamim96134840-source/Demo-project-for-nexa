import { useState } from "react";
import { useListShops } from "@workspace/api-client-react";
import BottomNav from "@/components/BottomNav";
import { Search as SearchIcon, Star, Clock, Zap } from "lucide-react";

const DEFAULT_LAT = 24.540340;
const DEFAULT_LNG = 92.588568;

interface ShopItem {
  id: number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
  eta: number;
  rating: number;
  imageUrl: string;
  isOpen: boolean;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const { data: shops = [] } = useListShops({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, radius: 10 });

  const filtered = (shops as ShopItem[]).filter(
    (s) =>
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#e53935] px-4 pt-12 pb-5">
        <h1 className="text-white text-xl font-black tracking-tight">NEXAMOVE</h1>
        <p className="text-red-100 text-sm mt-1 font-medium">Find shops</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 px-4 py-3">
          <SearchIcon size={18} className="text-gray-400 shrink-0" />
          <input
            data-testid="input-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shops or categories..."
            className="flex-1 text-sm text-gray-700 bg-transparent outline-none"
          />
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <SearchIcon size={36} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No shops match your search</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((shop) => (
            <div
              key={shop.id}
              data-testid={`search-result-${shop.id}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 p-3"
            >
              <img
                src={shop.imageUrl}
                alt={shop.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-gray-900 text-sm truncate">{shop.name}</p>
                  {shop.eta <= 10 && (
                    <span className="shrink-0 bg-[#e53935] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Zap size={8} fill="white" /> 10 min
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs">{shop.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-0.5 text-xs text-gray-500">
                    <Star size={10} fill="#f59e0b" className="text-amber-400" />
                    {shop.rating}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-gray-400">
                    <Clock size={10} />
                    {shop.eta} min
                  </span>
                  <span className="text-xs text-gray-400">{shop.distance} km</span>
                </div>
              </div>
              <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-lg ${
                shop.isOpen ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                {shop.isOpen ? "Open" : "Closed"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
