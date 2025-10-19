import React, { useEffect, useRef, useState } from 'react';
import type { ParkingLot } from '../../types';
import { LocationIcon, CarIcon, LayersIcon } from '../Icons';
import ReservationModal from '../ReservationModal';
import LoginModal from '../LoginModal';
import ArrivedModal from '../ArrivedModal';

// Leaflet is loaded via CDN, declare it to TypeScript
declare const L: any;

const tileLayers = {
  default: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  }
};

// Helper function to calculate spiderfy positions
const calculateSpiderfyPositions = (center: { lat: number, lng: number }, count: number, distance: number) => {
  if (count === 0) return [];
  const positions: { lat: number, lng: number }[] = [];
  const angleStep = (2 * Math.PI) / count;
  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    positions.push({
      lat: center.lat + distance * Math.cos(angle),
      lng: center.lng + distance * Math.sin(angle) * 1.7, 
    });
  }
  return positions;
};

interface MapScreenProps {
  parkingLots: ParkingLot[];
  userLocation: GeolocationPosition | null;
  route: { from: [number, number], to: [number, number] } | null;
  onConfirmReservation: (lotId: string, slotId: string, hours: number) => void;
  onArrived: () => void;
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
}

interface MapButtonProps {
  onClick?: () => void;
  title: string;
  className?: string;
}

const MapButton: React.FC<MapButtonProps> = ({ children, onClick, title, className = "" }) => {
  return (
    <button onClick={onClick} title={title} className={`group relative flex items-center justify-center w-12 h-12 rounded-full bg-slate-950 text-white shadow-2xl transition-all duration-300 hover:scale-110 ${className}`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"></div>
        <div className="absolute inset-px rounded-full bg-slate-950"></div>
        <div className="relative z-10">{children}</div>
    </button>
  );
};

const MapScreen = ({ parkingLots, onConfirmReservation, userLocation, route, onArrived, isLoggedIn, onLoginSuccess }: MapScreenProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const routeControl = useRef<any>(null);
  
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [activeLayer, setActiveLayer] = useState<keyof typeof tileLayers>('default');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [topView, setTopView] = useState<'hidden' | 'lotInfo' | 'reservation' | 'login' | 'arrived'>('hidden');

  // Initialize Map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current && typeof L !== 'undefined') {
      const map = L.map(mapRef.current, {
        center: [-20.087, 30.831],
        zoom: 15,
        zoomControl: true,
      });
      mapInstance.current = map;
      markersLayer.current = L.layerGroup().addTo(map);
      
      const initialLayer = L.tileLayer(tileLayers.default.url, {
        attribution: tileLayers.default.attribution,
        maxZoom: 19
      }).addTo(map);
      tileLayerRef.current = initialLayer;
    }
  }, []);
  
  // Handle Layer Changes
  useEffect(() => {
    if (mapInstance.current && tileLayerRef.current) {
        mapInstance.current.removeLayer(tileLayerRef.current);
    }
    if (mapInstance.current) {
        const newLayer = L.tileLayer(tileLayers[activeLayer].url, {
            attribution: tileLayers[activeLayer].attribution,
            maxZoom: 19
        }).addTo(mapInstance.current);
        tileLayerRef.current = newLayer;
    }
  }, [activeLayer]);

  // Update user location marker
  useEffect(() => {
    if (mapInstance.current && userLocation) {
      const { latitude, longitude } = userLocation.coords;
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
        return;
      }
      const userLatLng = L.latLng(latitude, longitude);
      if (!userMarker.current) {
        userMarker.current = L.marker(userLatLng, {
          icon: L.divIcon({
            html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>`,
            className: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
        }).addTo(mapInstance.current);
      } else {
        userMarker.current.setLatLng(userLatLng);
      }
    }
  }, [userLocation]);

  // Handle marker display logic
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();

    if (selectedLot && topView !== 'hidden') {
      const center = { lat: selectedLot.location.latitude, lng: selectedLot.location.longitude };
      const visibleSlots = selectedLot.slots.filter(s => s.coords);
      const spiderfyPositions = calculateSpiderfyPositions(center, visibleSlots.length, 0.0003);
      const bounds = L.latLngBounds();

      visibleSlots.forEach((slot, index) => {
        if (!slot.coords || typeof slot.coords.lat !== 'number' || typeof slot.coords.lng !== 'number') return;
        const actualPos = L.latLng(slot.coords.lat, slot.coords.lng);
        
        const spiderData = spiderfyPositions[index];
        if (!spiderData || typeof spiderData.lat !== 'number' || typeof spiderData.lng !== 'number') return;
        const spiderPos = L.latLng(spiderData.lat, spiderData.lng);

        bounds.extend(spiderPos);

        L.polyline([actualPos, spiderPos], { color: 'rgba(107, 114, 128, 0.5)', dashArray: '5, 5' }).addTo(markersLayer.current);
        L.circleMarker(actualPos, { radius: 3, color: slot.isOccupied ? '#ef4444' : '#22c55e', fillOpacity: 1, weight: 1 }).addTo(markersLayer.current);
        
        const icon = L.divIcon({
            html: `<div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg ${slot.isOccupied ? 'bg-red-500' : 'bg-green-500'}">${slot.id.toUpperCase()}</div>`,
            className: '', iconSize: [32, 32], iconAnchor: [16, 16]
        });
        L.marker(spiderPos, { icon }).addTo(markersLayer.current);
      });

      if (bounds.isValid()) {
        mapInstance.current.flyToBounds(bounds, { duration: 1.2, paddingTopLeft: [20, 20], paddingBottomRight: [20, 150] });
      }
    } else {
      parkingLots.forEach(lot => {
        if (!lot.location || typeof lot.location.latitude !== 'number' || typeof lot.location.longitude !== 'number') return;
        const lotLatLng = L.latLng(lot.location.latitude, lot.location.longitude);
        const availableSlots = lot.slots.filter(s => !s.isOccupied).length;
        const lotIcon = L.divIcon({
            html: `<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white ${availableSlots > 0 ? 'bg-cyan-500' : 'bg-red-500'}">${availableSlots}</div>`,
            className: '', iconSize: [40, 40], iconAnchor: [20, 20]
        });
        const marker = L.marker(lotLatLng, { icon: lotIcon }).addTo(markersLayer.current);
        marker.on('click', () => {
          setSelectedLot(lot);
          setTopView('lotInfo');
        });
      });
    }
  }, [selectedLot, parkingLots, topView]);

  // Handle routing
  useEffect(() => {
    if (mapInstance.current && route) {
      const [fromLat, fromLng] = route.from;
      const [toLat, toLng] = route.to;

      if (typeof fromLat !== 'number' || typeof fromLng !== 'number' || typeof toLat !== 'number' || typeof toLng !== 'number') return;
      
      if (routeControl.current) mapInstance.current.removeControl(routeControl.current);
      
      routeControl.current = L.Routing.control({
          waypoints: [ L.latLng(fromLat, fromLng), L.latLng(toLat, toLng) ],
          routeWhileDragging: false, show: false, addWaypoints: false,
          lineOptions: { styles: [{ color: '#8b5cf6', opacity: 1, weight: 6 }] }
      }).addTo(mapInstance.current);
      setSelectedLot(null);
      setTopView('hidden');
    } else if (mapInstance.current && routeControl.current) {
      mapInstance.current.removeControl(routeControl.current);
      routeControl.current = null;
    }
  }, [route]);

  // Handle arrival detection
  useEffect(() => {
    if (userLocation && route) {
      const { latitude, longitude } = userLocation.coords;
      const [toLat, toLng] = route.to;
      
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof toLat !== 'number' || typeof toLng !== 'number') return;

      const userLatLng = L.latLng(latitude, longitude);
      const destLatLng = L.latLng(toLat, toLng);
      if (userLatLng.distanceTo(destLatLng) < 25) {
          setTopView('arrived');
          onArrived();
      }
    }
  }, [userLocation, route, onArrived]);

  const handleBackToLots = () => {
    setSelectedLot(null);
    setTopView('hidden');
    if (mapInstance.current) {
      const targetLat = userLocation?.coords?.latitude;
      const targetLng = userLocation?.coords?.longitude;
      const center = (typeof targetLat === 'number' && typeof targetLng === 'number') ? [targetLat, targetLng] : [-20.087, 30.831];
      mapInstance.current.flyTo(center, 15, { duration: 1 });
    }
  };
  
  const handleOpenReservationModal = () => {
    if (!selectedLot) return;
    if (isLoggedIn) {
      setTopView('reservation');
    } else {
      setTopView('login');
    }
  };
  
  const handleConfirmAndClose = (lotId: string, slotId: string, hours: number) => {
    onConfirmReservation(lotId, slotId, hours);
    setTopView('hidden');
  };


  const handleRecenter = () => {
    if (mapInstance.current && userLocation) {
      const { latitude, longitude } = userLocation.coords;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        mapInstance.current.flyTo([latitude, longitude], 16, {duration: 1});
      }
    }
  };

  const handleLayerSelect = (layer: keyof typeof tileLayers) => {
    setActiveLayer(layer);
    setIsLayerMenuOpen(false);
  }

  const renderTopView = () => {
    switch (topView) {
      case 'lotInfo':
        if (!selectedLot) return null;
        return (
          <div className="group relative rounded-xl bg-slate-950 p-3 shadow-2xl transition-all duration-300 animate-fade-in-fast">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"></div>
            <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
            <div className="relative flex items-center justify-between text-white">
              <div>
                  <h2 className="font-bold">{selectedLot.name}</h2>
                  <p className="text-sm text-slate-400">{selectedLot.address}</p>
              </div>
              <button onClick={handleBackToLots} className="text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700 px-3 py-1 rounded-md text-sm transition-colors">Back</button>
            </div>
          </div>
        );
      
      case 'reservation':
        if (!selectedLot) return null;
        return (
          <ReservationModal
            onClose={() => setTopView('lotInfo')}
            onConfirm={handleConfirmAndClose}
            lot={selectedLot}
          />
        );
      
      case 'login':
        return (
            <LoginModal 
                onClose={() => setTopView('lotInfo')}
                onSuccess={() => {
                    onLoginSuccess();
                    setTopView('reservation');
                }}
            />
        );
      
      case 'arrived':
          return (
              <ArrivedModal onClose={() => setTopView('hidden')} />
          );

      default:
        return null;
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="absolute inset-0 bottom-24 bg-gray-200" />
       
       <div className="absolute top-20 left-4 right-4 z-[401]">
          {renderTopView()}
      </div>

      <div className="absolute top-20 right-4 z-[401]">
        <div className="relative">
          <MapButton onClick={() => setIsLayerMenuOpen(prev => !prev)} title="Map Layers">
            <LayersIcon />
          </MapButton>
          {isLayerMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-36 bg-slate-950/90 backdrop-blur-md rounded-lg shadow-lg animate-fade-in-fast border border-slate-700">
              <button onClick={() => handleLayerSelect('default')} className={`w-full text-left p-3 hover:bg-indigo-500/20 ${activeLayer === 'default' ? 'text-indigo-400' : 'text-white'}`}>Default</button>
              <button onClick={() => handleLayerSelect('satellite')} className={`w-full text-left p-3 hover:bg-indigo-500/20 ${activeLayer === 'satellite' ? 'text-indigo-400' : 'text-white'}`}>Satellite</button>
              <button onClick={() => handleLayerSelect('terrain')} className={`w-full text-left p-3 hover:bg-indigo-500/20 ${activeLayer === 'terrain' ? 'text-indigo-400' : 'text-white'}`}>Terrain</button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-28 right-4 z-[401] flex flex-col gap-4">
         <MapButton onClick={handleRecenter} title="Recenter">
            <LocationIcon />
         </MapButton>
         {topView === 'lotInfo' && !route && (
            <button onClick={handleOpenReservationModal} title="Reserve a Spot" className="bg-gradient-to-r from-indigo-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse transition-transform hover:scale-110">
                <CarIcon />
            </button>
         )}
      </div>
    </div>
  );
};

export default MapScreen;
