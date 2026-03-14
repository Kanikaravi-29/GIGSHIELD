import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  activeTriggers: string[];
}

const ZONES = [
  { name: 'Zone A4 - T. Nagar', lat: 13.04, lng: 80.23, baseRisk: 'low' },
  { name: 'Zone A2 - Adyar', lat: 13.00, lng: 80.26, baseRisk: 'low' },
  { name: 'Zone B1 - Anna Nagar', lat: 13.09, lng: 80.21, baseRisk: 'medium' },
  { name: 'Zone C3 - Tambaram', lat: 12.92, lng: 80.13, baseRisk: 'low' },
  { name: 'Zone D1 - Velachery', lat: 12.98, lng: 80.22, baseRisk: 'high' },
  { name: 'Zone E2 - Guindy', lat: 13.01, lng: 80.21, baseRisk: 'medium' },
];

function getRiskLevel(baseRisk: string, triggers: string[]): 'low' | 'medium' | 'high' {
  if (triggers.includes('curfew')) return 'high';
  if (triggers.length >= 3) return 'high';
  if (triggers.length >= 2 || triggers.includes('outage')) return baseRisk === 'high' ? 'high' : 'medium';
  if (triggers.length >= 1) return baseRisk === 'low' ? 'medium' : baseRisk as any;
  return baseRisk as any;
}

const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F43F5E',
};

export default function DisruptionMap({ activeTriggers }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circlesRef = useRef<L.Circle[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [13.02, 80.21],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

    ZONES.forEach((zone) => {
      const risk = getRiskLevel(zone.baseRisk, activeTriggers);
      const color = RISK_COLORS[risk];
      const circle = L.circle([zone.lat, zone.lng], {
        radius: 800,
        color,
        fillColor: color,
        fillOpacity: risk === 'high' ? 0.4 : risk === 'medium' ? 0.25 : 0.15,
        weight: 1,
      }).addTo(map);

      circle.bindPopup(`
        <div style="font-size:12px;color:#0f172a">
          <strong>${zone.name}</strong><br/>
          Risk: <span style="color:${color};font-weight:bold">${risk.toUpperCase()}</span>
        </div>
      `);

      circlesRef.current.push(circle);
    });
  }, [activeTriggers]);

  return (
    <div className="relative">
      <div ref={mapRef} className="h-48 rounded-lg overflow-hidden border border-border" />
      <div className="absolute bottom-3 left-3 flex gap-2 z-[1000]">
        <div className="flex items-center gap-1 text-[10px] text-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          <div className="w-2 h-2 rounded-full bg-risk-high" /> High
        </div>
        <div className="flex items-center gap-1 text-[10px] text-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          <div className="w-2 h-2 rounded-full bg-risk-medium" /> Medium
        </div>
        <div className="flex items-center gap-1 text-[10px] text-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          <div className="w-2 h-2 rounded-full bg-risk-low" /> Safe
        </div>
      </div>
    </div>
  );
}
