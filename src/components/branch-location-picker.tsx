"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { LocateFixed, MapPin } from "lucide-react";
import { useLanguage } from "./providers";

export function BranchLocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
}) {
  const { language } = useLanguage();
  const si = language === "si";
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const change = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    void import("leaflet")
      .then((L) => {
        if (disposed || !container.current) return;
        map.current = L.map(container.current, {
          scrollWheelZoom: false,
        }).setView([7.8731, 80.7718], 7);
        L.tileLayer(
          process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          },
        )
          .on("tileerror", () => {
            if (!disposed) setError("tiles");
          })
          .addTo(map.current);
        map.current.on("click", (event) =>
          change.current(
            event.latlng.lat.toFixed(6),
            event.latlng.lng.toFixed(6),
          ),
        );
        observer = new ResizeObserver(() => map.current?.invalidateSize());
        observer.observe(container.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setError("tiles");
      });
    return () => {
      disposed = true;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    let disposed = false;
    if (!ready || !map.current) return;
    void import("leaflet").then((L) => {
      if (disposed || !map.current) return;
      marker.current?.remove();
      marker.current = null;
      const lat = Number(latitude),
        lng = Number(longitude);
      if (
        !latitude ||
        !longitude ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      )
        return;
      marker.current = L.marker([lat, lng], {
        draggable: true,
        title: "Hospital location",
        icon: L.divIcon({
          className: "hospital-pin-container",
          html: '<span class="hospital-map-pin selected"><b>+</b></span>',
          iconSize: [34, 42],
          iconAnchor: [17, 42],
        }),
      }).addTo(map.current);
      marker.current.on("dragend", () => {
        const point = marker.current?.getLatLng();
        if (point) change.current(point.lat.toFixed(6), point.lng.toFixed(6));
      });
      map.current.setView([lat, lng], Math.max(map.current.getZoom(), 14));
    });
    return () => {
      disposed = true;
    };
  }, [latitude, longitude, ready]);
  function locate() {
    if (!navigator.geolocation) {
      setError("location");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        change.current(
          result.coords.latitude.toFixed(6),
          result.coords.longitude.toFixed(6),
        );
        setError("");
        setLocating(false);
      },
      () => {
        setError("location");
        setLocating(false);
      },
      { timeout: 15000 },
    );
  }
  return (
    <div className="branch-location-picker">
      <label>
        <MapPin size={17} />
        {si
          ? "රෝහලේ නිවැරදි ස්ථානය සලකුණු කරන්න"
          : "Pin the exact hospital location"}
      </label>
      <p>
        {si
          ? "සිතියම මත click කරන්න හෝ pin එක ඇදගෙන යන්න. ඔබ රෝහලේ සිටී නම් වත්මන් ස්ථානය භාවිතා කරන්න."
          : "Click the map or drag the pin. Use your current location only if you are at the hospital."}
      </p>
      <div
        ref={container}
        className="branch-location-map"
        aria-label={
          si ? "රෝහලේ ස්ථානය තෝරන්න" : "Pick hospital location on map"
        }
      />
      <div className="hospital-result-actions">
        <button
          type="button"
          className="button secondary"
          disabled={locating}
          onClick={locate}
        >
          <LocateFixed size={16} />
          {locating
            ? si
              ? "සොයමින්…"
              : "Locating…"
            : si
              ? "වත්මන් ස්ථානය"
              : "Use current location"}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => onChange("", "")}
        >
          {si ? "ස්ථානය ඉවත් කරන්න" : "Clear location"}
        </button>
      </div>
      {error && (
        <p role="status">
          {error === "tiles"
            ? si
              ? "සිතියම ලබාගත නොහැක. පහත coordinates ඇතුළත් කරන්න."
              : "Map unavailable. Enter coordinates below instead."
            : si
              ? "Location අවසර ලබාදෙන්න හෝ සිතියමෙන් තෝරන්න."
              : "Allow location access or choose a pin on the map."}
        </p>
      )}
    </div>
  );
}
