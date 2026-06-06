/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Compass, Plus, Minus, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Event } from '../types';
import L from 'leaflet';

interface MapComponentProps {
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event | null) => void;
  userCoords: { x: number; y: number };
  setUserCoords: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

// Helper to map 0-100 percentage coordinates into real Latitudes/Longitudes centered on cities
function getGeoCoordinates(city: string, coordinates: { x: number; y: number }): [number, number] {
  const centers: Record<string, [number, number]> = {
    'Bengaluru': [12.9716, 77.5946],
    'Mumbai': [19.0760, 72.8777],
    'Delhi NCR': [28.6139, 77.2090],
    'Hyderabad': [17.3850, 78.4867],
  };

  const center = centers[city] || [12.9716, 77.5946];

  // Scale coordinates to cover roughly a 10-15 km bounding box area
  const latOffset = (coordinates.y - 50) * 0.0016;
  const lngOffset = (coordinates.x - 50) * 0.0016;

  return [center[0] - latOffset, center[1] + lngOffset];
}

// Calculate geodesic distance using the Haversine formula
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapComponent({
  events,
  selectedEvent,
  onSelectEvent,
  userCoords,
  setUserCoords,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [isLatchingLocation, setIsLatchingLocation] = useState<boolean>(false);
  const [navigationSteps, setNavigationSteps] = useState<string[]>([]);
  const [etaText, setEtaText] = useState<string>('');

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const activeCity = selectedEvent ? selectedEvent.city : (events[0]?.city || 'Bengaluru');
    const startCenter = getGeoCoordinates(activeCity, userCoords);

    // Create Leaflet Map Instance
    const map = L.map(mapContainerRef.current, {
      center: startCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark-Mode Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Setup Marker and Route Layers
    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Handle map clicks to relocate the user's pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLatLng = e.latlng;
      const currentCity = selectedEvent ? selectedEvent.city : (events[0]?.city || 'Bengaluru');

      const centers: Record<string, [number, number]> = {
        'Bengaluru': [12.9716, 77.5946],
        'Mumbai': [19.0760, 72.8777],
        'Delhi NCR': [28.6139, 77.2090],
        'Hyderabad': [17.3850, 78.4867],
      };
      const cityCenter = centers[currentCity] || [12.9716, 77.5946];

      // Reverse conversion back to percentage coordinates
      const yOffset = 50 - (clickedLatLng.lat - cityCenter[0]) / 0.0016;
      const xOffset = 50 + (clickedLatLng.lng - cityCenter[1]) / 0.0016;

      setUserCoords({
        x: Math.min(Math.max(xOffset, 5), 95),
        y: Math.min(Math.max(yOffset, 5), 95),
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Fly/fit map whenever selectedEvent or events update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeCity = selectedEvent ? selectedEvent.city : (events[0]?.city || 'Bengaluru');
    const userLatLng = getGeoCoordinates(activeCity, userCoords);

    if (selectedEvent) {
      const eventLatLng = getGeoCoordinates(selectedEvent.city, selectedEvent.coordinates);
      const bounds = L.latLngBounds([userLatLng, eventLatLng]);
      
      map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 15,
        animate: true,
        duration: 1.2,
      });
    } else {
      map.setView(userLatLng, 13, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedEvent, events]);

  // 3. Render markers & custom styled HTML divIcon vector overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear previous vector layers
    markersLayer.clearLayers();

    const activeCity = selectedEvent ? selectedEvent.city : (events[0]?.city || 'Bengaluru');
    const userLatLng = getGeoCoordinates(activeCity, userCoords);

    // Draw standard Pulsing User marker
    const userIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-10 h-10 bg-emerald-500/25 rounded-full animate-ping pointer-events-none"></div>
        <div class="w-4.5 h-4.5 bg-emerald-400 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
          <div class="w-1.5 h-1.5 bg-slate-950 rounded-full"></div>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userIconHtml,
      className: 'custom-user-locator-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    L.marker(userLatLng, { icon: userIcon, zIndexOffset: 1000 })
      .addTo(markersLayer)
      .bindPopup(`
        <div class="p-2 text-center select-none font-sans">
          <p class="text-[11px] font-bold text-emerald-400 tracking-wider uppercase font-mono">📍 MY LOCATION COORDINATES</p>
          <p class="text-[10px] text-slate-300 mt-1">Grounded near the heart of ${activeCity}.</p>
          <p class="text-[9px] text-slate-500 font-mono mt-0.5">${userLatLng[0].toFixed(5)}° N, ${userLatLng[1].toFixed(5)}° E</p>
        </div>
      `, {
        className: 'custom-popup-box-wrapper',
        maxWidth: 220,
      });

    // Mapped Categories style sets
    const categoryColors: Record<string, string> = {
      Music: 'bg-indigo-600 border-indigo-400',
      Food: 'bg-amber-600 border-amber-400',
      Art: 'bg-emerald-600 border-emerald-400',
      Tech: 'bg-purple-600 border-purple-400',
      Sports: 'bg-sky-600 border-sky-400',
      Comedy: 'bg-fuchsia-600 border-fuchsia-400',
    };

    // Draw active events
    events.forEach((event) => {
      const isSelected = selectedEvent?.id === event.id;
      const eventLatLng = getGeoCoordinates(event.city, event.coordinates);
      const colorSchemeClass = categoryColors[event.category] || 'bg-slate-600 border-slate-400';

      const selectedGlowRing = isSelected
        ? 'ring-4 ring-rose-500/60 scale-125 !bg-rose-600 !border-rose-400 z-[1000]'
        : 'hover:scale-115 hover:z-[500]';

      const markerHtml = `
        <div class="relative flex items-center justify-center transition-all duration-300">
          ${isSelected ? `<div class="absolute w-12 h-12 bg-rose-500/30 rounded-full animate-ping pointer-events-none"></div>` : ''}
          <div class="w-8 h-8 rounded-full ${colorSchemeClass} ${selectedGlowRing} border-2 border-slate-900 shadow-xl flex items-center justify-center text-white cursor-pointer select-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `;

      const eventIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-event-map-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(eventLatLng, { icon: eventIcon })
        .addTo(markersLayer);

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectEvent(event);
      });

      // Show floating label tooltips matching our dark cyberpunk theme
      marker.bindTooltip(`
        <div class="p-2 max-w-[200px] bg-slate-950 border border-white/10 rounded-xl shadow-2xl text-[10px] font-sans font-medium text-white flex flex-col gap-1.5 leading-tight select-none">
          <div class="font-bold tracking-tight text-white line-clamp-1">${event.title}</div>
          <div class="flex items-center justify-between text-slate-450 text-[9px] font-mono select-none">
            <span class="text-indigo-400 font-bold uppercase shrink-0">${event.category}</span>
            <span class="text-emerald-400 font-semibold shrink-0">₹${event.price.toLocaleString('en-IN')}</span>
          </div>
          <p class="text-[9.5px] text-slate-400 font-mono flex items-center gap-1">📍 ${event.locationName}</p>
        </div>
      `, {
        direction: 'top',
        offset: [0, -12],
        opacity: 0.98,
        className: 'custom-leaflet-tooltip-element',
      });
    });
  }, [events, selectedEvent, userCoords]);

  // 4. Trace dotted geometric line-paths for active navigation routing
  useEffect(() => {
    const routeLayer = routeLayerRef.current;
    if (!routeLayer || !mapInstanceRef.current) return;

    routeLayer.clearLayers();

    if (!selectedEvent) {
      setNavigationSteps([]);
      setEtaText('');
      return;
    }

    const activeCity = selectedEvent.city;
    const startLatLng = getGeoCoordinates(activeCity, userCoords);
    const endLatLng = getGeoCoordinates(selectedEvent.city, selectedEvent.coordinates);

    // Draw clean routing line
    L.polyline([startLatLng, endLatLng], {
      color: '#10b981',
      weight: 3.5,
      dashArray: '8, 10',
      opacity: 0.75,
    }).addTo(routeLayer);

    // Compute metric markers
    const distanceKm = getDistanceInKm(startLatLng[0], startLatLng[1], endLatLng[0], endLatLng[1]);
    const distanceMiles = distanceKm * 0.621371;
    const drivingTimeMin = Math.round(distanceKm * 2.5 + 2); // average 24km/h plus padding

    setEtaText(`${drivingTimeMin} min drive (${distanceMiles.toFixed(1)} miles / ${distanceKm.toFixed(1)} km)`);

    // Complete navigation walkthrough sequence
    const steps: string[] = [];
    steps.push('Lock target path vectors from your current grid coordinates.');

    const latDiff = endLatLng[0] - startLatLng[0];
    const lngDiff = endLatLng[1] - startLatLng[1];

    if (Math.abs(latDiff) > 0.002) {
      steps.push(
        `Steer ${latDiff > 0 ? 'North' : 'South'} towards the city central lanes (${(
          Math.abs(latDiff) * 111
        ).toFixed(1)} km).`
      );
    }

    if (Math.abs(lngDiff) > 0.002) {
      steps.push(
        `Turn ${lngDiff > 0 ? 'East' : 'West'} and advance on adjacent arterials with general traffic guidelines (${(
          Math.abs(lngDiff) * 105
        ).toFixed(1)} km).`
      );
    }

    steps.push(`Arrive safely at ${selectedEvent.locationName}. Welcome to the happening!`);
    setNavigationSteps(steps);
  }, [selectedEvent, userCoords]);

  // 5. GPS standard localized trigger
  const triggerSelfLocalization = () => {
    setIsLatchingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Double check if coordinate sits inside Indian boundaries
          const isIndia = lat > 8 && lat < 38 && lng > 68 && lng < 97;
          
          if (isIndia) {
            const currentCity = selectedEvent ? selectedEvent.city : (events[0]?.city || 'Bengaluru');
            const centers: Record<string, [number, number]> = {
              'Bengaluru': [12.9716, 77.5946],
              'Mumbai': [19.0760, 72.8777],
              'Delhi NCR': [28.6139, 77.2090],
              'Hyderabad': [17.3850, 78.4867],
            };
            const cityCenter = centers[currentCity] || [12.9716, 77.5946];

            // Project real-world lat/lng offset back into userCoords (0-100 percentage layout)
            const yOffset = 50 - (lat - cityCenter[0]) / 0.0016;
            const xOffset = 50 + (lng - cityCenter[1]) / 0.0016;

            setUserCoords({
              x: Math.min(Math.max(xOffset, 5), 95),
              y: Math.min(Math.max(yOffset, 5), 95),
            });
          } else {
            // Simulated interesting local user coords offset near Bengaluru center
            const randomX = 40 + Math.random() * 20;
            const randomY = 40 + Math.random() * 20;
            setUserCoords({ x: randomX, y: randomY });
          }
          setIsLatchingLocation(false);
        },
        () => {
          // Fallback simulation
          const randomX = 42 + Math.random() * 16;
          const randomY = 42 + Math.random() * 16;
          setUserCoords({ x: randomX, y: randomY });
          setIsLatchingLocation(false);
        },
        { timeout: 4000 }
      );
    } else {
      setIsLatchingLocation(false);
    }
  };

  // Custom Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };
  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      const activeCity = selectedEvent ? selectedEvent.city : (events[0]?.city || 'Bengaluru');
      const userLatLng = getGeoCoordinates(activeCity, userCoords);
      mapInstanceRef.current.setView(userLatLng, 13, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-[620px] bento-blur border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Floating Zoom & Compass Controllers */}
      <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={triggerSelfLocalization}
          className="flex items-center justify-center w-11 h-11 bg-slate-950/85 border border-white/10 rounded-2xl text-emerald-400 hover:text-white transition-all hover:bg-slate-900 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title="Locate Me (Geolocalize)"
        >
          {isLatchingLocation ? (
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Compass className="w-5 h-5 animate-pulse" />
          )}
        </button>

        <div className="flex flex-col bg-slate-950/85 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
          <button
            onClick={handleZoomIn}
            className="flex items-center justify-center w-11 h-11 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors border-b border-white/5 cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex items-center justify-center w-11 h-11 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors border-b border-white/5 cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={handleResetMap}
            className="flex items-center justify-center w-11 h-11 text-slate-400 hover:text-white text-[9px] font-mono tracking-widest font-bold transition-colors cursor-pointer uppercase"
            title="Recenter"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Floating Bottom Legend */}
      <div className="absolute bottom-4 left-4 z-40 bg-slate-950/85 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md text-[10px] font-mono text-slate-350 max-sm:hidden shadow-xl pointer-events-none select-none">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span className="text-emerald-300 font-semibold uppercase">📍 Personal Landmark</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
          <span className="text-slate-400 uppercase">🎟️ Happening Venues</span>
        </div>
      </div>

      {/* Interactive Navigation Steps Drawer overlay */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className="absolute top-4 right-4 z-40 w-80 md:w-96 bg-slate-950/92 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl max-h-[92%] overflow-y-auto scrollbar-thin pointer-events-auto"
          >
            <div className="flex justify-between items-start mb-3 gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono tracking-widest font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedEvent.category} Routing
              </span>
              <button
                onClick={() => onSelectEvent(null)}
                className="text-slate-500 hover:text-white text-[10px] font-bold font-mono tracking-widest cursor-pointer transition-colors"
              >
                ✖ CLOSE
              </button>
            </div>

            <h3 className="text-sm font-bold text-white tracking-tight mb-1 font-sans">
              Route path to {selectedEvent.title}
            </h3>
            <p className="text-[11px] text-slate-400 mb-3.5 flex items-center gap-1.5 font-mono select-none">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              {selectedEvent.locationName} ({selectedEvent.city})
            </p>

            {/* ETA Details Banner */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between mb-4 pointer-events-none select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/15 rounded-lg shrink-0">
                  <Navigation className="w-4 h-4 text-emerald-400 rotate-45" />
                </div>
                <div>
                  <div className="text-[9px] text-emerald-400/80 font-mono tracking-widest uppercase">GRID CALCULATION ETA</div>
                  <div className="text-xs font-semibold text-emerald-350 mt-0.5">{etaText || 'Orienting trajectory...'}</div>
                </div>
              </div>
            </div>

            {/* Steps walk */}
            <div className="space-y-3 pointer-events-none">
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest pl-1">TRAJECTORY DATA FIELDS</div>
              {navigationSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex gap-2.5 text-[11px] text-slate-300 font-sans"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <span className="w-4.5 h-4.5 rounded-full bg-slate-900 border border-slate-800 text-[9px] text-indigo-400 font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {idx < navigationSteps.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-900 my-1 min-h-[14px]" />
                    )}
                  </div>
                  <p className="leading-normal pt-0.5 text-slate-320">{step}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Map Div Mount */}
      <div
        ref={mapContainerRef}
        className="w-full h-full relative bg-slate-950 z-10"
        style={{ outline: 'none' }}
      />
    </div>
  );
}
