"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LatLngBounds } from "leaflet";
import {
  ArrowUpRight,
  Building2,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import { useLanguage } from "./providers";

export type Center = {
  id: string;
  tenant_id: string;
  name: string;
  hospital?: string;
  branch?: string;
  address?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
};
type Position = { latitude: number; longitude: number };
export function hasCoordinates(center: Center): center is Center & Position {
  return (
    typeof center.latitude === "number" &&
    Number.isFinite(center.latitude) &&
    Math.abs(center.latitude) <= 90 &&
    typeof center.longitude === "number" &&
    Number.isFinite(center.longitude) &&
    Math.abs(center.longitude) <= 180
  );
}
export function directionsUrl(center: Center) {
  const destination = hasCoordinates(center)
    ? `${center.latitude},${center.longitude}`
    : `${center.name} ${center.address || ""}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
function distanceKm(a: Position, b: Position) {
  const rad = Math.PI / 180;
  const value =
    Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, value)));
}

function HospitalMap({
  centers,
  selected,
  position,
  onSelect,
  allVersion,
}: {
  centers: Center[];
  selected: string;
  position: Position | null;
  onSelect: (id: string) => void;
  allVersion: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const bounds = useRef<LatLngBounds | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const { language } = useLanguage();
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
            if (!disposed) setError(true);
          })
          .addTo(map.current);
        observer = new ResizeObserver(() => {
          map.current?.invalidateSize();
          if (bounds.current)
            map.current?.fitBounds(bounds.current, {
              padding: [50, 50],
              maxZoom: 14,
            });
        });
        observer.observe(container.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !map.current) return;
    let disposed = false;
    let cleanup = () => {};
    void import("leaflet").then((L) => {
      if (disposed || !map.current) return;
      const group = L.layerGroup().addTo(map.current);
      cleanup = () => {
        group.remove();
      };
      const points: [number, number][] = [];
      centers.filter(hasCoordinates).forEach((center) => {
        const point: [number, number] = [center.latitude, center.longitude];
        points.push(point);
        const marker = L.marker(point, {
          title: center.name,
          alt: center.name,
          icon: L.divIcon({
            className: "hospital-pin-container",
            html: `<span class="hospital-map-pin ${center.id === selected ? "selected" : ""}"><b>+</b></span>`,
            iconSize: [34, 42],
            iconAnchor: [17, 42],
          }),
        });
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = center.name;
        popup.append(title);
        const button = document.createElement("button");
        button.className = "map-select-button";
        button.textContent =
          language === "si" ? "මෙම රෝහල තෝරන්න" : "Choose this hospital";
        button.onclick = () => onSelect(center.id);
        popup.append(button);
        marker
          .bindPopup(popup)
          .on("click", () => onSelect(center.id))
          .addTo(group);
      });
      if (position) {
        const point: [number, number] = [position.latitude, position.longitude];
        points.push(point);
        L.circleMarker(point, {
          radius: 9,
          color: "#ffffff",
          fillColor: "#115e59",
          fillOpacity: 1,
          weight: 3,
        })
          .bindTooltip(language === "si" ? "ඔබ සිටින ස්ථානය" : "Your location")
          .addTo(group);
      }
      if (points.length) {
        bounds.current = L.latLngBounds(points);
        map.current.fitBounds(bounds.current, {
          padding: [50, 50],
          maxZoom: 14,
        });
      }
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [centers, selected, position, ready, onSelect, language, allVersion]);
  return (
    <div className="hospital-map-wrap">
      <div
        ref={container}
        className="hospital-map"
        aria-label={
          language === "si" ? "රෝහල් සිතියම" : "Registered hospital map"
        }
      />
      {error && (
        <p className="map-error" role="status">
          {language === "si"
            ? "සිතියම පූරණය කළ නොහැක. පහත ලැයිස්තුවෙන් රෝහලක් තෝරන්න."
            : "Map tiles are unavailable. You can still choose a hospital from the list."}
        </p>
      )}
    </div>
  );
}

export function HospitalFinder({
  centers,
  selected,
  onSelect,
  loading,
}: {
  centers: Center[];
  selected: string;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const { language } = useLanguage();
  const si = language === "si";
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [nearby, setNearby] = useState(false);
  const [allVersion, setAllVersion] = useState(0);
  function locate() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError(
        si
          ? "ඔබගේ browser එක location සඳහා සහාය නොදක්වයි."
          : "Your browser does not support location. Search by hospital name instead.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        });
        setNearby(true);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError(
          si
            ? "ස්ථානය ලබාගත නොහැක. Location අවසර ලබාදෙන්න හෝ නමෙන් සොයන්න."
            : "Location is unavailable. Allow location access or search by name/address.",
        );
      },
      { timeout: 15000, maximumAge: 60000, enableHighAccuracy: false },
    );
  }
  const matches = useMemo(
    () =>
      centers
        .filter((c) =>
          `${c.name} ${c.address || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .map((c) => ({
          ...c,
          distance:
            position && hasCoordinates(c) ? distanceKm(position, c) : null,
        }))
        .sort((a, b) =>
          nearby && position
            ? (a.distance ?? Infinity) - (b.distance ?? Infinity) ||
              a.name.localeCompare(b.name)
            : a.name.localeCompare(b.name),
        ),
    [centers, search, position, nearby],
  );
  const visibleMatches = matches.slice(page * pageSize, (page + 1) * pageSize);
  const pageCount = Math.ceil(matches.length / pageSize);
  const mapped = useMemo(() => matches.filter(hasCoordinates), [matches]);
  return (
    <section className="hospital-finder" id="find-care">
      <div className="care-section-heading">
        <div>
          <span className="care-kicker">
            {si ? "ඔබට ළඟින් සෞඛ්‍ය සේවා" : "GOOD CARE, CLOSER TO YOU"}
          </span>
          <h2>{si ? "ඔබේ රෝහල සොයාගන්න" : "Find your hospital"}</h2>
          <p>
            {si
              ? "රෝහල තෝරා හමුවීමක් හෝ පෝලිම් ටිකට් එකක් ලබාගන්න."
              : "Explore registered hospitals, choose a center and plan your visit."}
          </p>
        </div>
        <button className="button primary" onClick={locate} disabled={locating}>
          <LocateFixed size={17} />
          {locating
            ? si
              ? "ස්ථානය සොයමින්…"
              : "Locating…"
            : si
              ? "ළඟම රෝහල්"
              : "Use my location"}
        </button>
      </div>
      <div className="finder-tools">
        <label className="finder-search">
          <Search size={18} />
          <input
            aria-label={
              si ? "රෝහල හෝ ලිපිනය සොයන්න" : "Search hospitals or address"
            }
            placeholder={
              si ? "රෝහල හෝ ලිපිනය සොයන්න" : "Search hospitals or address"
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <button
          className={`button secondary ${!nearby ? "active" : ""}`}
          onClick={() => {
            setNearby(false);
            setSearch("");
            setPage(0);
            setAllVersion((v) => v + 1);
          }}
        >
          {si ? "සියලු රෝහල්" : "All hospitals"} ({centers.length})
        </button>
        <button
          className={`button secondary ${nearby ? "active" : ""}`}
          onClick={() => (position ? setNearby(true) : locate())}
        >
          {si ? "ළඟම මුලින්" : "Nearest first"}
        </button>
      </div>
      {locationError && (
        <p className="care-inline-error" role="status">
          {locationError}
        </p>
      )}
      {mapped.length > 0 ? (
        <HospitalMap
          centers={mapped}
          selected={selected}
          position={position}
          onSelect={onSelect}
          allVersion={allVersion}
        />
      ) : (
        <div className="hospital-map-empty">
          <MapPin size={28} />
          <p>
            {loading
              ? si
                ? "රෝහල් පූරණය වෙමින්…"
                : "Loading hospitals…"
              : si
                ? "මේ රෝහල්වල සිතියම් ස්ථාන තවම ලබාදී නැත. පහත ලැයිස්තුවෙන් තෝරන්න."
                : "Map locations have not been provided for these hospitals yet. Choose a center below."}
          </p>
        </div>
      )}
      <div className="finder-summary">
        <span>
          {matches.length} {si ? "ලියාපදිංචි මධ්‍යස්ථාන" : "registered centers"}
        </span>
        <small>
          {position
            ? si
              ? "දුර සෘජු දුරකි; ගමන් මාර්ග දුර වෙනස් විය හැක."
              : "Distances are straight-line estimates, not driving distances."
            : si
              ? "ළඟම රෝහල් සඳහා ඔබේ ස්ථානය ලබාදෙන්න."
              : "Use your location to sort hospitals by distance."}
        </small>
      </div>
      {!loading && !matches.length && (
        <p>{si ? "ගැළපෙන රෝහල් නොමැත." : "No hospitals match your search."}</p>
      )}
      <div className="hospital-results">
        {visibleMatches.map((c, i) => (
          <article
            key={c.id}
            className={`hospital-result ${selected === c.id ? "chosen" : ""}`}
          >
            <div className="hospital-result-top">
              <span className="hospital-building">
                <Building2 size={23} />
              </span>
              <div>
                <h3>{c.hospital || c.name}</h3>
                {c.branch && <span>{c.branch}</span>}
              </div>
              {c.distance !== null && (
                <span className="distance-pill">
                  {nearby && i === 0 ? (si ? "ළඟම · " : "Nearest · ") : ""}
                  {c.distance.toFixed(1)} km
                </span>
              )}
            </div>
            <p>
              <MapPin size={15} />
              {c.address ||
                (si ? "ලිපිනය තවම ලබාදී නැත" : "Address not provided yet")}
            </p>
            {!hasCoordinates(c) && (
              <small>
                {si
                  ? "රෝහල තවම සිතියම් ස්ථානය ලබාදී නැත."
                  : "Map location has not been added by this hospital yet."}
              </small>
            )}
            {c.phone && (
              <a
                className="hospital-phone"
                href={`tel:${c.phone.replace(/[^+\d]/g, "")}`}
              >
                {c.phone}
              </a>
            )}
            <div className="hospital-result-actions">
              <button
                className="button primary"
                aria-pressed={selected === c.id}
                onClick={() => {
                  onSelect(c.id);
                  document
                    .getElementById("book-care")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {si ? "මෙම රෝහල තෝරන්න" : "Choose hospital"}
                <ArrowUpRight size={15} />
              </button>
              <a
                className="button secondary"
                href={directionsUrl(c)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation size={15} />
                {si ? "මාර්ගය" : "Directions"}
              </a>
            </div>
          </article>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="finder-pagination">
          <button
            className="button secondary"
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
          >
            {si ? "පෙර" : "Previous"}
          </button>
          <span>{page + 1} / {pageCount}</span>
          <button
            className="button secondary"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((value) => value + 1)}
          >
            {si ? "ඊළඟ" : "Next"}
          </button>
        </div>
      )}
    </section>
  );
}
