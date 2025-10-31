import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Card } from '@/components/ui/card';
import { MapMarkers } from './MapMarkers';
import 'leaflet/dist/leaflet.css';

interface Airfield {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

interface Aircraft {
  id: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  aircraft_type: string;
  departure: string;
  destination: string;
  status: 'climbing' | 'cruising' | 'descending';
}

interface WindData {
  latitude: number;
  longitude: number;
  speed: number;
  direction: number;
  strength: 'light' | 'moderate' | 'strong' | 'severe';
}

interface MapComponentProps {
  airfields: Airfield[];
  aircraft: Aircraft[];
  windData: WindData[];
  createCustomIcon: (riskLevel: string) => L.DivIcon;
  createAircraftIcon: (aircraft: Aircraft) => L.DivIcon;
  createWindIcon: (windData: WindData) => L.DivIcon;
  getRiskColor: (riskLevel: string) => string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  airfields,
  aircraft,
  windData,
  createCustomIcon,
  createAircraftIcon,
  createWindIcon,
  getRiskColor,
}) => {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
      <div style={{ height: '600px', width: '100%' }}>
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapMarkers
            airfields={airfields}
            aircraft={aircraft}
            windData={windData}
            createCustomIcon={createCustomIcon}
            createAircraftIcon={createAircraftIcon}
            createWindIcon={createWindIcon}
            getRiskColor={getRiskColor}
          />
        </MapContainer>
      </div>
    </Card>
  );
};