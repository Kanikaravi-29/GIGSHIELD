import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  activeTriggers: string[];
  city?: string;
  selectedZone?: string;
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  'Chennai': [13.0827, 80.2707],
  'Coimbatore': [11.0168, 76.9558],
  'Tirupur': [11.1085, 77.3411],
  'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.6139, 77.2090],
  'Bangalore': [12.9716, 77.5946],
  'Hyderabad': [17.3850, 78.4867],
  'Kolkata': [22.5726, 88.3639],
  'Pune': [18.5204, 73.8567],
};

const CITY_ZONES: Record<string, { name: string; id: string; lat: number; lng: number; baseRisk: string }[]> = {
  'Chennai': [
    { name: 'Zone A1', id: 'A1', lat: 13.06, lng: 80.24, baseRisk: 'low' },
    { name: 'Zone A2', id: 'A2', lat: 13.00, lng: 80.26, baseRisk: 'low' },
    { name: 'Zone A3', id: 'A3', lat: 13.04, lng: 80.25, baseRisk: 'medium' },
    { name: 'Zone A4', id: 'A4', lat: 13.04, lng: 80.23, baseRisk: 'low' },
    { name: 'Zone B1', id: 'B1', lat: 13.09, lng: 80.21, baseRisk: 'medium' },
    { name: 'Zone B2', id: 'B2', lat: 13.08, lng: 80.22, baseRisk: 'high' },
    { name: 'Zone B3', id: 'B3', lat: 13.07, lng: 80.23, baseRisk: 'medium' },
    { name: 'Zone B4', id: 'B4', lat: 13.09, lng: 80.24, baseRisk: 'low' },
    { name: 'Zone C1', id: 'C1', lat: 12.92, lng: 80.13, baseRisk: 'low' },
    { name: 'Zone C2', id: 'C2', lat: 12.95, lng: 80.15, baseRisk: 'medium' },
  ],
  'Coimbatore': [
    { name: 'Zone A1', id: 'A1', lat: 11.01, lng: 76.94, baseRisk: 'low' },
    { name: 'Zone A2', id: 'A2', lat: 11.02, lng: 76.97, baseRisk: 'high' },
    { name: 'Zone B1', id: 'B1', lat: 11.03, lng: 77.01, baseRisk: 'medium' },
    { name: 'Zone B2', id: 'B2', lat: 11.00, lng: 77.03, baseRisk: 'low' },
    { name: 'Zone C1', id: 'C1', lat: 11.04, lng: 76.95, baseRisk: 'medium' },
  ],
  'Tirupur': [
    { name: 'Zone A1', id: 'A1', lat: 11.11, lng: 77.33, baseRisk: 'high' },
    { name: 'Zone A2', id: 'A2', lat: 11.12, lng: 77.35, baseRisk: 'medium' },
    { name: 'Zone B1', id: 'B1', lat: 11.10, lng: 77.36, baseRisk: 'low' },
    { name: 'Zone B2', id: 'B2', lat: 11.08, lng: 77.34, baseRisk: 'medium' },
    { name: 'Zone C1', id: 'C1', lat: 11.13, lng: 77.32, baseRisk: 'low' },
  ],
};

function getRiskLevel(baseRisk: string, triggers: string[]): 'low' | 'medium' | 'high' {
  if (triggers.includes('curfew')) return 'high';
  if (triggers.includes('rain') && triggers.includes('outage')) return 'high';
  if (triggers.includes('rain') || triggers.includes('outage') || triggers.includes('heat')) return 'medium';
  return baseRisk as 'low' | 'medium' | 'high';
}

const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F43F5E',
};

export default function DisruptionMap({ activeTriggers, city = 'Chennai', selectedZone }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circlesRef = useRef<L.Circle[]>([]);

  const cityCenter = CITY_COORDINATES[city] || CITY_COORDINATES['Chennai'];
  const zones = CITY_ZONES[city] || CITY_ZONES['Chennai'];

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(cityCenter, 12);
    } else {
        const map = L.map(mapRef.current, {
          center: cityCenter,
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
    }
  }, [city, cityCenter]);

  // Handle Zone Selection / Auto-pan
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedZone) return;

    const targetZone = zones.find(z => z.id === selectedZone || z.name.includes(selectedZone));
    if (targetZone) {
        map.flyTo([targetZone.lat, targetZone.lng], 14, {
            animate: true,
            duration: 1.5
        });
    }
  }, [selectedZone, zones]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

    zones.forEach((zone) => {
      const risk = getRiskLevel(zone.baseRisk, activeTriggers);
      const color = RISK_COLORS[risk];
      const isSelected = selectedZone && (zone.id === selectedZone || zone.name.includes(selectedZone));
      
      const circle = L.circle([zone.lat, zone.lng], {
        radius: isSelected ? 1200 : 800,
        color: isSelected ? '#FFFFFF' : color,
        fillColor: color,
        fillOpacity: isSelected ? 0.6 : (risk === 'high' ? 0.4 : risk === 'medium' ? 0.25 : 0.15),
        weight: isSelected ? 3 : 1,
      }).addTo(map);

      circle.bindPopup(`
        <div class="text-sm font-sans">
          <strong>${zone.name}</strong> [${zone.id}]<br/>
          Risk: <span style="color:${color};font-weight:bold">${risk.toUpperCase()}</span>
        </div>
      `);

      circlesRef.current.push(circle);
    });
  }, [activeTriggers, zones, selectedZone]);

  return (
    <div className="relative">
      <div ref={mapRef} className="h-80 md:h-[450px] rounded-lg overflow-hidden border border-border mt-2" />
      <div className="absolute bottom-3 left-3 flex gap-2 z-[1000]">
        <div className="flex items-center gap-1 text-[10px] text-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          <div className="w-2 h-2 rounded-full bg-[#F43F5E]" /> High
        </div>
        <div className="flex items-center gap-1 text-[10px] text-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Medium
        </div>
        <div className="flex items-center gap-1 text-[10px] text-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" /> Safe
        </div>
      </div>
    </div>
  );
}
