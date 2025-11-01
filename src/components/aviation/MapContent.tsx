import React from 'react';
import { TileLayer, Marker, Popup } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { Plane, Wind, Navigation } from 'lucide-react';

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

interface MapContentProps {
  airfields: Airfield[];
  aircraft: Aircraft[];
  windData: WindData[];
  createCustomIcon: (riskLevel: string) => L.DivIcon;
  createAircraftIcon: (aircraft: Aircraft) => L.DivIcon;
  createWindIcon: (windData: WindData) => L.DivIcon;
  getRiskColor: (riskLevel: string) => string;
}

export const MapContent: React.FC<MapContentProps> = ({
  airfields,
  aircraft,
  windData,
  createCustomIcon,
  createAircraftIcon,
  createWindIcon,
  getRiskColor,
}) => {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {airfields.map((airfield) => (
        <Marker
          key={airfield.id}
          position={[airfield.latitude, airfield.longitude]}
          icon={createCustomIcon(airfield.risk_level)}
        >
          <Popup className="custom-popup">
            <div className="text-gray-900 min-w-48">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4" />
                <strong>{airfield.code}</strong>
              </div>
              <h3 className="font-semibold mb-1">{airfield.name}</h3>
              <div className="text-sm space-y-1">
                <div>Elevation: {airfield.elevation} ft</div>
                <div className="flex items-center gap-2">
                  <span>Risk Level:</span>
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: getRiskColor(airfield.risk_level) }}
                  >
                    {airfield.risk_level.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {aircraft.map((plane) => (
        <Marker
          key={plane.id}
          position={[plane.latitude, plane.longitude]}
          icon={createAircraftIcon(plane)}
        >
          <Popup className="custom-popup">
            <div className="text-gray-900 min-w-64">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4" />
                <strong>{plane.callsign}</strong>
                <Badge variant="outline" className="text-xs">
                  {plane.aircraft_type}
                </Badge>
              </div>
              <div className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Altitude:</strong> {plane.altitude.toLocaleString()} ft</div>
                  <div><strong>Speed:</strong> {plane.speed} kts</div>
                  <div><strong>Heading:</strong> {plane.heading}°</div>
                  <div><strong>Status:</strong> {plane.status}</div>
                </div>
                <div className="pt-2 border-t">
                  <div><strong>Route:</strong> {plane.departure} → {plane.destination}</div>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {windData.map((wind, index) => (
        <Marker
          key={`wind-${index}`}
          position={[wind.latitude, wind.longitude]}
          icon={createWindIcon(wind)}
        >
          <Popup className="custom-popup">
            <div className="text-gray-900 min-w-32">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-4 h-4" />
                <strong>Wind Data</strong>
              </div>
              <div className="text-sm space-y-1">
                <div><strong>Speed:</strong> {wind.speed} knots</div>
                <div><strong>Direction:</strong> {wind.direction}°</div>
                <div><strong>Strength:</strong> {wind.strength}</div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};
