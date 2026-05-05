import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const customerIcon = L.divIcon({
  html: `<div style="background:#1565c0;border:3px solid white;border-radius:50%;width:18px;height:18px;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const shopIcon = L.divIcon({
  html: `<div style="background:#f57c00;border:3px solid white;border-radius:50%;width:16px;height:16px;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const riderIcon = L.divIcon({
  html: `<div style="background:#e53935;border:3px solid white;border-radius:50%;width:20px;height:20px;box-shadow:0 2px 8px rgba(229,57,53,0.5)"></div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export interface ShopMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

interface MapViewProps {
  centerLat: number;
  centerLng: number;
  shops?: ShopMarker[];
  riderLat?: number | null;
  riderLng?: number | null;
  height?: string;
}

export default function MapView({ centerLat, centerLng, shops = [], riderLat, riderLng, height = "280px" }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shopMarkersRef = useRef<L.Marker[]>([]);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView(
      [centerLat, centerLng],
      15
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    mapRef.current = map;

    customerMarkerRef.current = L.marker([centerLat, centerLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup("You are here");

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([centerLat, centerLng], map.getZoom());
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([centerLat, centerLng]);
    }
  }, [centerLat, centerLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    shopMarkersRef.current.forEach((m) => m.remove());
    shopMarkersRef.current = shops.map((shop) =>
      L.marker([shop.lat, shop.lng], { icon: shopIcon })
        .addTo(map)
        .bindPopup(`<strong>${shop.name}</strong>`)
    );
  }, [shops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (riderLat != null && riderLng != null) {
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([riderLat, riderLng]);
      } else {
        riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: riderIcon })
          .addTo(map)
          .bindPopup("Your rider");
      }
    } else if (riderMarkerRef.current) {
      riderMarkerRef.current.remove();
      riderMarkerRef.current = null;
    }
  }, [riderLat, riderLng]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: "12px", overflow: "hidden" }}
      data-testid="map-view"
    />
  );
}
