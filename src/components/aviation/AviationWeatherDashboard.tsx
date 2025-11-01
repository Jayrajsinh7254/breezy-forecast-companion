import React, { useState, useEffect } from 'react';
import { Plane, Wind, Eye, Thermometer, Gauge, AlertTriangle, MapPin, Clock, TrendingUp, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { RadarMap } from './RadarMap';
import { RiskLevelIndicator } from './RiskLevelIndicator';
import { generateWeatherAlerts } from '@/utils/weatherAlertGenerator';

interface Airfield {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  country: string;
}

interface WeatherAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  confidence_score: number;
  is_active: boolean;
  created_at: string;
  airfield: Airfield;
}

interface AviationWeatherData {
  temperature: number;
  wind_speed: number;
  wind_direction: number;
  visibility: number;
  ceiling: number;
  pressure: number;
  humidity: number;
  conditions: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export const AviationWeatherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [airfields, setAirfields] = useState<Airfield[]>([]);
  const [selectedAirfield, setSelectedAirfield] = useState<string>('');
  const [weatherData, setWeatherData] = useState<AviationWeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFactors, setRiskFactors] = useState({
    trafficDensity: 0,
    weatherRisk: 0,
    windRisk: 0,
    systemAlerts: 0
  });

  useEffect(() => {
    fetchAirfields();
    fetchAlerts();
  }, [user]);

  useEffect(() => {
    if (selectedAirfield) {
      fetchWeatherData(selectedAirfield);
    }
  }, [selectedAirfield]);

  const fetchAirfields = async () => {
    try {
      const { data, error } = await supabase
        .from('airfields')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAirfields(data || []);
      
      if (data && data.length > 0) {
        setSelectedAirfield(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching airfields:', error);
      toast({
        title: "Error",
        description: "Failed to load airfields",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weather_alerts')
        .select(`
          *,
          airfield:airfields(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts((data || []).map(alert => ({
        ...alert,
        severity: alert.severity as 'low' | 'medium' | 'high' | 'critical'
      })));
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchWeatherData = async (airfieldId: string) => {
    const airfield = airfields.find(a => a.id === airfieldId);
    if (!airfield) return;

    setLoading(true);
    try {
      // In a real implementation, this would call a weather API
      // For now, we'll simulate aviation weather data
      const mockData: AviationWeatherData = {
        temperature: Math.random() * 30 + 5, // 5-35°C
        wind_speed: Math.random() * 50, // 0-50 knots (increased range to test alerts)
        wind_direction: Math.floor(Math.random() * 360), // 0-359°
        visibility: Math.random() * 10 + 0.5, // 0.5-10.5 km (can go lower for testing)
        ceiling: Math.floor(Math.random() * 5000) + 500, // 500-5500 ft
        pressure: Math.random() * 50 + 980, // 980-1030 hPa
        humidity: Math.random() * 100,
        conditions: ['Clear', 'Partly cloudy', 'Overcast', 'Rain', 'Fog', 'Thunderstorm'][Math.floor(Math.random() * 6)],
        risk_level: (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)]
      };

      setWeatherData(mockData);

      // Generate automatic alerts based on weather conditions
      if (user) {
        await generateWeatherAlerts({
          userId: user.id,
          airfieldId: airfield.id,
          airfieldCode: airfield.code,
          weather: {
            temperature: mockData.temperature,
            wind_speed: mockData.wind_speed,
            wind_direction: mockData.wind_direction,
            visibility: mockData.visibility,
            conditions: mockData.conditions,
            pressure: mockData.pressure,
            humidity: mockData.humidity
          }
        });

        // Refresh alerts after generation
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast({
        title: "Error",
        description: "Failed to load weather data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'high': return 'text-orange-400 bg-orange-400/20';
      case 'critical': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading && airfields.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading aviation weather data...</p>
        </div>
      </div>
    );
  }

  const selectedAirfieldData = airfields.find(a => a.id === selectedAirfield);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-400" />
            Aviation Weather System
          </h2>
          <p className="text-white/70">Real-time weather monitoring for aviation operations</p>
        </div>
        
        <Select value={selectedAirfield} onValueChange={setSelectedAirfield}>
          <SelectTrigger className="w-64 bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Select airfield" />
          </SelectTrigger>
          <SelectContent>
            {airfields.map((airfield) => (
              <SelectItem key={airfield.id} value={airfield.id}>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{airfield.code}</span>
                  <span>-</span>
                  <span>{airfield.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Conditions */}
      {weatherData && selectedAirfieldData && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{selectedAirfieldData.code} - {selectedAirfieldData.name}</span>
              </div>
              <Badge className={getRiskColor(weatherData.risk_level)}>
                <Shield className="w-3 h-3 mr-1" />
                {weatherData.risk_level.toUpperCase()} RISK
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Temperature */}
              <div className="text-center">
                <Thermometer className="w-8 h-8 mx-auto mb-2 text-red-400" />
                <div className="text-3xl font-bold">{Math.round(weatherData.temperature)}°C</div>
                <div className="text-white/70 text-sm">Temperature</div>
              </div>

              {/* Wind */}
              <div className="text-center">
                <Wind className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <div className="text-3xl font-bold">{Math.round(weatherData.wind_speed)}</div>
                <div className="text-white/70 text-sm">
                  {Math.round(weatherData.wind_direction)}° / {Math.round(weatherData.wind_speed)} kt
                </div>
              </div>

              {/* Visibility */}
              <div className="text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <div className="text-3xl font-bold">{weatherData.visibility.toFixed(1)}</div>
                <div className="text-white/70 text-sm">Visibility (km)</div>
              </div>

              {/* Ceiling */}
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <div className="text-3xl font-bold">{weatherData.ceiling}</div>
                <div className="text-white/70 text-sm">Ceiling (ft)</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Pressure:</span>
                <span>{weatherData.pressure.toFixed(1)} hPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Humidity:</span>
                <span>{Math.round(weatherData.humidity)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Conditions:</span>
                <span>{weatherData.conditions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Active Weather Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)} mt-1 flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold truncate">{alert.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {alert.confidence_score}% confidence
                        </Badge>
                        <span className="text-xs text-white/60">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-white/80 mb-1">{alert.message}</p>
                    {alert.airfield && (
                      <p className="text-xs text-white/60">
                        {alert.airfield.code} - {alert.airfield.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Radar Map - Takes up 3/4 of the width */}
        <div className="xl:col-span-3">
          <RadarMap onRiskUpdate={setRiskFactors} />
        </div>
        
        {/* Risk Level Indicator - Takes up 1/4 of the width */}
        <div className="xl:col-span-1">
          <RiskLevelIndicator factors={riskFactors} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-white">
          <Clock className="w-4 h-4 mr-2" />
          View Forecasts
        </Button>
        <Button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-white">
          <Gauge className="w-4 h-4 mr-2" />
          Set Thresholds
        </Button>
        <Button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-white">
          <MapPin className="w-4 h-4 mr-2" />
          View Radar
        </Button>
      </div>
    </div>
  );
};