import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useListShops, useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { connectSocket } from "@/lib/socket";
import MapView from "@/components/MapView";
import BottomNav from "@/components/BottomNav";
import { MapPin, ChevronDown, Star, Clock, Zap, RefreshCw } from "lucide-react";

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

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const [userLat, setUserLat] = useState(DEFAULT_LAT);
  const [userLng, setUserLng] = useState(DEFAULT_LNG);
  const [radius, setRadius] = useState(3);
  const [address, setAddress] = useState("Detecting location...");
  const [orderingShopId, setOrderingShopId] = useState<number | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);
  const watchRef = useRef<number | null>(null);

  const { data: shops = [], refetch: refetchShops } = useListShops(
    { lat: userLat, lng: userLng, radius }
  );

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        setOrderSuccess(`Order #${order.id} placed at ${order.shopName}! Rider assigned.`);
        setOrderingShopId(null);
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setTimeout(() => {
          setOrderSuccess(null);
          setLocation("/orders");
        }, 2000);
      },
      onError: () => {
        setOrderingShopId(null);
      },
    },
  });

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      const addr = data.address;
      const parts = [addr.village || addr.town || addr.city, addr.state].filter(Boolean);
      setAddress(parts.join(", ") || data.display_name?.split(",").slice(0, 2).join(",") || "Location detected");
    } catch {
      setAddress("Niamathpur, Hailakandi");
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocating(false);
      reverseGeocode(DEFAULT_LAT, DEFAULT_LNG);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        reverseGeocode(DEFAULT_LAT, DEFAULT_LNG);
        setLocating(false);
      },
      { timeout: 5000 }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    if (!token || user?.role !== "rider") return;
    const socket = connectSocket(token);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit("rider-location-update", {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [token, user]);

  const handleOrder = (shop: ShopItem) => {
    setOrderingShopId(shop.id);
    createOrder.mutate({
      data: { shopId: shop.id, customerLat: userLat, customerLng: userLng },
    });
  };

  const radiusOptions = [2, 5, 10];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#e53935] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-xl font-black tracking-tight">NEXAMOVE</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-white text-sm font-medium">{user?.name?.split(" ")[0]}</span>
          </div>
        </div>

        {/* Location bar */}
        <div className="bg-white/15 rounded-xl px-3 py-2.5 flex items-center gap-2" data-testid="location-bar">
          <MapPin size={15} className="text-white shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-[10px] uppercase font-semibold tracking-wider">Delivering to</p>
            <p className="text-white text-sm font-medium truncate">
              {locating ? "Detecting location..." : address}
            </p>
          </div>
          <ChevronDown size={15} className="text-white/70 shrink-0" />
        </div>
      </div>

      <div className="px-4 space-y-4 mt-4">
        {/* Success toast */}
        {orderSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium" data-testid="order-success">
            {orderSuccess}
          </div>
        )}

        {/* Map */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <MapView
            centerLat={userLat}
            centerLng={userLng}
            shops={shops.map((s: ShopItem) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng }))}
            height="260px"
          />
          <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-xs text-gray-500">You</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-500">Shops</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#e53935]" />
              <span className="text-xs text-gray-500">Rider</span>
            </div>
          </div>
        </div>

        {/* Radius control */}
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Delivery radius</span>
            <span className="text-sm font-bold text-[#e53935]">{radius} km</span>
          </div>
          <div className="flex gap-2" data-testid="radius-control">
            {radiusOptions.map((r) => (
              <button
                key={r}
                data-testid={`button-radius-${r}`}
                onClick={() => {
                  setRadius(r);
                  setTimeout(() => refetchShops(), 100);
                }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  radius === r
                    ? "border-[#e53935] bg-red-50 text-[#e53935]"
                    : "border-gray-100 text-gray-500 bg-gray-50"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Shops */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">
              {shops.length} shops nearby
            </h2>
            <button
              data-testid="button-refresh"
              onClick={() => refetchShops()}
              className="text-[#e53935] p-1"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {shops.length === 0 && !locating && (
            <div className="bg-white rounded-2xl px-4 py-8 text-center shadow-sm border border-gray-100">
              <MapPin size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No shops found within {radius} km</p>
              <p className="text-gray-400 text-xs mt-1">Try expanding the radius</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {(shops as ShopItem[]).map((shop) => (
              <div
                key={shop.id}
                data-testid={`card-shop-${shop.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
              >
                <div className="relative">
                  <img
                    src={shop.imageUrl}
                    alt={shop.name}
                    className="w-full h-28 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
                    }}
                  />
                  {shop.eta <= 10 && (
                    <div className="absolute top-2 left-2 bg-[#e53935] text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <Zap size={10} fill="white" />
                      10 min
                    </div>
                  )}
                  {!shop.isOpen && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">CLOSED</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <p className="text-gray-900 font-semibold text-xs leading-tight line-clamp-2">{shop.name}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">{shop.category}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-0.5">
                      <Star size={10} fill="#f59e0b" className="text-amber-400" />
                      <span className="text-[10px] text-gray-600 font-medium">{shop.rating}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Clock size={10} className="text-gray-400" />
                      <span className="text-[10px] text-gray-500">{shop.eta} min</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{shop.distance} km away</p>
                  <button
                    data-testid={`button-order-${shop.id}`}
                    onClick={() => shop.isOpen && handleOrder(shop)}
                    disabled={orderingShopId === shop.id || !shop.isOpen}
                    className={`mt-2 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                      shop.isOpen
                        ? "bg-[#e53935] text-white hover:bg-[#c62828] disabled:opacity-60"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {orderingShopId === shop.id ? "Placing..." : shop.isOpen ? "Order Now" : "Closed"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
