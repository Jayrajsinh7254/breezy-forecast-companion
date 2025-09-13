import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Layers, Radar, Plane, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Airfield {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

interface WeatherLayer {
  id: string;
  name: string;
  url: string;
  opacity: number;
  enabled: boolean;
}

// Weather overlay component
const WeatherOverlay: React.FC<{ layers: WeatherLayer[] }> = ({ layers }) => {
  const map = useMap();
  const overlayRefs = useRef<{ [key: string]: L.TileLayer }>({});

  useEffect(() => {
    layers.forEach(layer => {
      if (layer.enabled && !overlayRefs.current[layer.id]) {
        const tileLayer = L.tileLayer(layer.url, {
          opacity: layer.opacity,
          attribution: 'Weather data'
        });
        tileLayer.addTo(map);
        overlayRefs.current[layer.id] = tileLayer;
      } else if (!layer.enabled && overlayRefs.current[layer.id]) {
        map.removeLayer(overlayRefs.current[layer.id]);
        delete overlayRefs.current[layer.id];
      } else if (layer.enabled && overlayRefs.current[layer.id]) {
        overlayRefs.current[layer.id].setOpacity(layer.opacity);
      }
    });

    return () => {
      Object.values(overlayRefs.current).forEach(layer => {
        map.removeLayer(layer);
      });
      overlayRefs.current = {};
    };
  }, [layers, map]);

  return null;
};

export const RadarMap: React.FC = () => {
  const [airfields] = useState<Airfield[]>([
    {
      id: '1',
      code: 'KJFK',
      name: 'John F. Kennedy International',
      latitude: 40.6413,
      longitude: -73.7781,
      elevation: 13,
      risk_level: 'low'
    },
    {
      id: '2',
      code: 'KLAX',
      name: 'Los Angeles International',
      latitude: 33.9425,
      longitude: -118.4081,
      elevation: 125,
      risk_level: 'medium'
    },
    {
      id: '3',
      code: 'KORD',
      name: 'Chicago O\'Hare International',
      latitude: 41.9742,
      longitude: -87.9073,
      elevation: 672,
      risk_level: 'high'
    }
  ]);

  const [weatherLayers, setWeatherLayers] = useState<WeatherLayer[]>([
    {
      id: 'precipitation',
      name: 'Precipitation',
      url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=60a052d032bc64d5ac340034a74b5aa3',
      opacity: 0.6,
      enabled: true
    },
    {
      id: 'clouds',
      name: 'Clouds',
      url: 'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=60a052d032bc64d5ac340034a74b5aa3',
      opacity: 0.4,
      enabled: false
    },
    {
      id: 'wind',
      name: 'Wind',
      url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=60a052d032bc64d5ac340034a74b5aa3',
      opacity: 0.5,
      enabled: false
    },
    {
      id: 'temp',
      name: 'Temperature',
      url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=60a052d032bc64d5ac340034a74b5aa3',
      opacity: 0.4,
      enabled: false
    }
  ]);

  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (isAutoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
        // Trigger layer refresh by toggling enabled state briefly
        setWeatherLayers(prev => prev.map(layer => ({ ...layer })));
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [isAutoRefresh]);

  const toggleLayer = (layerId: string) => {
    setWeatherLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setWeatherLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, opacity } : layer
      )
    );
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#10b981'; // green
      case 'medium': return '#f59e0b'; // yellow
      case 'high': return '#f97316'; // orange
      case 'critical': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const createCustomIcon = (riskLevel: string) => {
    const color = getRiskColor(riskLevel);
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: 'custom-airfield-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radar className="w-5 h-5 text-blue-400" />
              Real-time Weather Radar
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isAutoRefresh}
                  onCheckedChange={setIsAutoRefresh}
                  id="auto-refresh"
                />
                <Label htmlFor="auto-refresh">Auto-refresh (5min)</Label>
              </div>
              <span className="text-white/60">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <Button
                size="sm"
                onClick={() => setLastUpdate(new Date())}
                className="bg-blue-500/20 hover:bg-blue-500/30"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {weatherLayers.map((layer) => (
              <div key={layer.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={layer.id} className="text-sm font-medium">
                    {layer.name}
                  </Label>
                  <Switch
                    id={layer.id}
                    checked={layer.enabled}
                    onCheckedChange={() => toggleLayer(layer.id)}
                  />
                </div>
                {layer.enabled && (
                  <div className="space-y-1">
                    <Label className="text-xs text-white/70">
                      Opacity: {Math.round(layer.opacity * 100)}%
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={layer.opacity}
                      onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
        <div style={{ height: '600px', width: '100%' }}>
          <MapContainer
            center={[39.8283, -98.5795]} // Center of USA
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            className="rounded-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <WeatherOverlay layers={weatherLayers} />
            
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
          </MapContainer>
        </div>
      </Card>

      {/* Legend */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="font-medium">Risk Levels:</span>
            </div>
            <div className="flex items-center gap-4">
              {['low', 'medium', 'high', 'critical'].map((level) => (
                <div key={level} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: getRiskColor(level) }}
                  ></div>
                  <span className="text-sm capitalize">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};