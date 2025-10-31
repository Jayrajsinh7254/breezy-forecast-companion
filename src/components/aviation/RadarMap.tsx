import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Layers, Radar, Plane, RefreshCw, Wind, Navigation } from 'lucide-react';
import { MapComponent } from './MapComponent';
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

interface Aircraft {
  id: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number; // in feet
  speed: number; // in knots
  heading: number; // in degrees
  aircraft_type: string;
  departure: string;
  destination: string;
  status: 'climbing' | 'cruising' | 'descending';
}

interface WindData {
  latitude: number;
  longitude: number;
  speed: number; // in knots
  direction: number; // in degrees
  strength: 'light' | 'moderate' | 'strong' | 'severe';
}

interface RadarMapProps {
  onRiskUpdate?: (factors: { trafficDensity: number; weatherRisk: number; windRisk: number; systemAlerts: number }) => void;
}

export const RadarMap: React.FC<RadarMapProps> = ({ onRiskUpdate }) => {
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
    },
    {
      id: '4',
      code: 'KDEN',
      name: 'Denver International',
      latitude: 39.8617,
      longitude: -104.6731,
      elevation: 5431,
      risk_level: 'medium'
    },
    {
      id: '5',
      code: 'KATL',
      name: 'Hartsfield-Jackson Atlanta International',
      latitude: 33.6367,
      longitude: -84.4281,
      elevation: 1026,
      risk_level: 'low'
    }
  ]);

  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [windData, setWindData] = useState<WindData[]>([]);

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
  const [showAircraft, setShowAircraft] = useState(true);
  const [showWindData, setShowWindData] = useState(true);

  // Generate random aircraft data
  const generateAircraft = useCallback(() => {
    const callsigns = ['DAL123', 'UAL456', 'AAL789', 'SWA012', 'JBU345', 'VIR678', 'BAW901', 'LUV234', 'FFT567', 'NKS890'];
    const aircraftTypes = ['B737', 'A320', 'B777', 'A350', 'B787', 'A330', 'B747', 'A380'];
    const airports = ['KJFK', 'KLAX', 'KORD', 'KDEN', 'KATL', 'KMIA', 'KSEA', 'KPHX'];
    const statuses: Aircraft['status'][] = ['climbing', 'cruising', 'descending'];

    const newAircraft: Aircraft[] = [];
    const numAircraft = Math.floor(Math.random() * 15) + 20; // 20-35 aircraft

    for (let i = 0; i < numAircraft; i++) {
      newAircraft.push({
        id: `aircraft-${i}`,
        callsign: callsigns[Math.floor(Math.random() * callsigns.length)],
        latitude: 25 + Math.random() * 25, // Roughly over USA
        longitude: -125 + Math.random() * 50,
        altitude: Math.floor(Math.random() * 30000) + 10000, // 10,000-40,000 ft
        speed: Math.floor(Math.random() * 300) + 300, // 300-600 knots
        heading: Math.floor(Math.random() * 360),
        aircraft_type: aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)],
        departure: airports[Math.floor(Math.random() * airports.length)],
        destination: airports[Math.floor(Math.random() * airports.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }

    setAircraft(newAircraft);
  }, []);

  // Generate wind data
  const generateWindData = useCallback(() => {
    const newWindData: WindData[] = [];
    
    // Create a grid of wind indicators
    for (let lat = 25; lat <= 50; lat += 5) {
      for (let lng = -125; lng <= -70; lng += 8) {
        const speed = Math.floor(Math.random() * 50) + 5; // 5-55 knots
        let strength: WindData['strength'];
        
        if (speed < 15) strength = 'light';
        else if (speed < 25) strength = 'moderate';
        else if (speed < 35) strength = 'strong';
        else strength = 'severe';

        newWindData.push({
          latitude: lat + (Math.random() - 0.5) * 2,
          longitude: lng + (Math.random() - 0.5) * 2,
          speed,
          direction: Math.floor(Math.random() * 360),
          strength
        });
      }
    }
    
    setWindData(newWindData);
  }, []);

  // Calculate and update risk factors
  const updateRiskFactors = useCallback(() => {
    if (onRiskUpdate) {
      const trafficDensity = Math.min(100, (aircraft.length / 50) * 100);
      
      const avgWindSpeed = windData.reduce((acc, wind) => acc + wind.speed, 0) / windData.length;
      const windRisk = Math.min(100, (avgWindSpeed / 50) * 100);
      
      const weatherRisk = weatherLayers.filter(layer => layer.enabled).length * 25;
      
      const systemAlerts = Math.floor(Math.random() * 30); // Simulated system issues
      
      onRiskUpdate({
        trafficDensity,
        weatherRisk,
        windRisk,
        systemAlerts
      });
    }
  }, [aircraft, windData, weatherLayers, onRiskUpdate]);

  // Initialize data and set up intervals
  useEffect(() => {
    generateAircraft();
    generateWindData();
  }, [generateAircraft, generateWindData]);

  useEffect(() => {
    updateRiskFactors();
  }, [updateRiskFactors]);

  useEffect(() => {
    if (isAutoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
        generateAircraft(); // Update aircraft positions
        updateRiskFactors();
        // Trigger layer refresh
        setWeatherLayers(prev => prev.map(layer => ({ ...layer })));
      }, 30 * 1000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, generateAircraft, updateRiskFactors]);

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

  const createAircraftIcon = (aircraft: Aircraft) => {
    const statusColor = aircraft.status === 'climbing' ? '#10b981' : 
                        aircraft.status === 'cruising' ? '#3b82f6' : '#f59e0b';
    
    return L.divIcon({
      html: `
        <div style="
          transform: rotate(${aircraft.heading}deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="${statusColor}" stroke="white" stroke-width="1">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      `,
      className: 'custom-aircraft-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const createWindIcon = (windData: WindData) => {
    const strengthColor = windData.strength === 'light' ? '#10b981' :
                         windData.strength === 'moderate' ? '#f59e0b' :
                         windData.strength === 'strong' ? '#f97316' : '#ef4444';
    
    return L.divIcon({
      html: `
        <div style="
          transform: rotate(${windData.direction}deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${strengthColor}" stroke-width="2">
            <path d="M12 2v20M2 12h20M6 6l12 12M6 18l12-12"/>
          </svg>
          <div style="
            position: absolute;
            bottom: -16px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            font-size: 10px;
            padding: 1px 3px;
            border-radius: 2px;
            white-space: nowrap;
          ">${windData.speed}kt</div>
        </div>
      `,
      className: 'custom-wind-marker',
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
              Real-time Radar & Weather Map
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isAutoRefresh}
                  onCheckedChange={setIsAutoRefresh}
                  id="auto-refresh"
                />
                <Label htmlFor="auto-refresh">Auto-refresh (30s)</Label>
              </div>
              <span className="text-white/60">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <Button
                size="sm"
                onClick={() => {
                  setLastUpdate(new Date());
                  generateAircraft();
                  updateRiskFactors();
                }}
                className="bg-blue-500/20 hover:bg-blue-500/30"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{aircraft.length}</div>
              <div className="text-xs text-white/70">Active Aircraft</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{airfields.length}</div>
              <div className="text-xs text-white/70">Monitored Airfields</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{windData.length}</div>
              <div className="text-xs text-white/70">Wind Stations</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{weatherLayers.filter(l => l.enabled).length}</div>
              <div className="text-xs text-white/70">Active Layers</div>
            </div>
          </div>

          {/* Layer Controls */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Display Layers
            </h4>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Aircraft Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <Label htmlFor="aircraft-toggle" className="text-sm font-medium flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Aircraft Radar
                </Label>
                <Switch
                  id="aircraft-toggle"
                  checked={showAircraft}
                  onCheckedChange={setShowAircraft}
                />
              </div>

              {/* Wind Data Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <Label htmlFor="wind-toggle" className="text-sm font-medium flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  Wind Patterns
                </Label>
                <Switch
                  id="wind-toggle"
                  checked={showWindData}
                  onCheckedChange={setShowWindData}
                />
              </div>
            </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <MapComponent 
        weatherLayers={weatherLayers}
        airfields={airfields}
        aircraft={showAircraft ? aircraft : []}
        windData={showWindData ? windData : []}
        createCustomIcon={createCustomIcon}
        createAircraftIcon={createAircraftIcon}
        createWindIcon={createWindIcon}
        getRiskColor={getRiskColor}
      />

      {/* Legend */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span className="font-medium">Airfield Risk Levels:</span>
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
            
            <div className="flex items-center justify-between border-t border-white/20 pt-4">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4" />
                <span className="font-medium">Aircraft Status:</span>
              </div>
              <div className="flex items-center gap-4">
                {[
                  { status: 'climbing', color: '#10b981', label: 'Climbing' },
                  { status: 'cruising', color: '#3b82f6', label: 'Cruising' },
                  { status: 'descending', color: '#f59e0b', label: 'Descending' }
                ].map((item) => (
                  <div key={item.status} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 border border-white"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/20 pt-4">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4" />
                <span className="font-medium">Wind Strength:</span>
              </div>
              <div className="flex items-center gap-4">
                {[
                  { strength: 'light', color: '#10b981', label: 'Light (5-15kt)' },
                  { strength: 'moderate', color: '#f59e0b', label: 'Moderate (15-25kt)' },
                  { strength: 'strong', color: '#f97316', label: 'Strong (25-35kt)' },
                  { strength: 'severe', color: '#ef4444', label: 'Severe (35kt+)' }
                ].map((item) => (
                  <div key={item.strength} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 border border-white"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};