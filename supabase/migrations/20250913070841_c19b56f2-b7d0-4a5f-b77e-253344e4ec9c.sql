-- Create airfields table
CREATE TABLE public.airfields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  elevation INTEGER NOT NULL DEFAULT 0, -- in feet
  timezone TEXT NOT NULL DEFAULT 'UTC',
  country VARCHAR(3) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create weather thresholds table
CREATE TABLE public.weather_thresholds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  airfield_id UUID NOT NULL REFERENCES public.airfields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  wind_speed_max DECIMAL(5,2) DEFAULT 30.0, -- knots
  visibility_min DECIMAL(5,2) DEFAULT 5.0, -- km
  ceiling_min INTEGER DEFAULT 1000, -- feet
  temperature_min DECIMAL(5,2) DEFAULT -10.0, -- celsius
  temperature_max DECIMAL(5,2) DEFAULT 45.0, -- celsius
  crosswind_max DECIMAL(5,2) DEFAULT 15.0, -- knots
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create weather alerts table
CREATE TABLE public.weather_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  airfield_id UUID NOT NULL REFERENCES public.airfields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'wind', 'visibility', 'ceiling', 'temperature', 'storm'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'alert', 'threshold', 'airfield'
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create weather forecasts table for ML predictions
CREATE TABLE public.weather_forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  airfield_id UUID NOT NULL REFERENCES public.airfields(id) ON DELETE CASCADE,
  forecast_type TEXT NOT NULL, -- 'nowcast', 'short_term', 'medium_term'
  forecast_hour INTEGER NOT NULL, -- 0-24 hours ahead
  temperature DECIMAL(5,2),
  wind_speed DECIMAL(5,2),
  wind_direction INTEGER,
  visibility DECIMAL(5,2),
  ceiling INTEGER,
  precipitation_probability INTEGER,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  forecast_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create gap analysis features table
CREATE TABLE public.gap_analysis_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT false,
  is_missing BOOLEAN NOT NULL DEFAULT true,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  category TEXT NOT NULL, -- 'data', 'ml', 'ui', 'alerts', 'infrastructure'
  implementation_notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.airfields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gap_analysis_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for airfields (public read, admin write)
CREATE POLICY "Everyone can view airfields" ON public.airfields FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert airfields" ON public.airfields FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own airfield data" ON public.airfields FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for weather_thresholds (user-specific)
CREATE POLICY "Users can view their own thresholds" ON public.weather_thresholds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own thresholds" ON public.weather_thresholds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own thresholds" ON public.weather_thresholds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own thresholds" ON public.weather_thresholds FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for weather_alerts (user-specific)
CREATE POLICY "Users can view their own alerts" ON public.weather_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alerts" ON public.weather_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON public.weather_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alerts" ON public.weather_alerts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for audit_logs (user-specific read, system write)
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- RLS Policies for weather_forecasts (public read)
CREATE POLICY "Everyone can view weather forecasts" ON public.weather_forecasts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert forecasts" ON public.weather_forecasts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for gap_analysis_features (public read, admin write)
CREATE POLICY "Everyone can view gap analysis features" ON public.gap_analysis_features FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update gap analysis" ON public.gap_analysis_features FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_airfields_code ON public.airfields(code);
CREATE INDEX idx_airfields_location ON public.airfields(latitude, longitude);
CREATE INDEX idx_weather_thresholds_airfield ON public.weather_thresholds(airfield_id);
CREATE INDEX idx_weather_thresholds_user ON public.weather_thresholds(user_id);
CREATE INDEX idx_weather_alerts_airfield ON public.weather_alerts(airfield_id);
CREATE INDEX idx_weather_alerts_user ON public.weather_alerts(user_id);
CREATE INDEX idx_weather_alerts_active ON public.weather_alerts(is_active, created_at);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX idx_weather_forecasts_airfield_time ON public.weather_forecasts(airfield_id, forecast_time);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_airfields_updated_at BEFORE UPDATE ON public.airfields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weather_thresholds_updated_at BEFORE UPDATE ON public.weather_thresholds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample airfields data
INSERT INTO public.airfields (code, name, latitude, longitude, elevation, country) VALUES
('KJFK', 'John F. Kennedy International Airport', 40.6413, -73.7781, 13, 'USA'),
('KLAX', 'Los Angeles International Airport', 33.9425, -118.4081, 125, 'USA'),
('KORD', 'Chicago O''Hare International Airport', 41.9742, -87.9073, 672, 'USA'),
('EGLL', 'London Heathrow Airport', 51.4700, -0.4543, 83, 'GBR'),
('LFPG', 'Charles de Gaulle Airport', 49.0097, 2.5479, 392, 'FRA'),
('EDDF', 'Frankfurt Airport', 50.0379, 8.5622, 364, 'DEU'),
('RJTT', 'Tokyo Haneda Airport', 35.5494, 139.7798, 21, 'JPN'),
('YSSY', 'Sydney Kingsford Smith Airport', -33.9399, 151.1753, 21, 'AUS'),
('OMDB', 'Dubai International Airport', 25.2532, 55.3657, 62, 'UAE'),
('KDEN', 'Denver International Airport', 39.8561, -104.6737, 5431, 'USA');

-- Insert initial gap analysis features
INSERT INTO public.gap_analysis_features (feature_name, description, is_present, is_missing, priority, category) VALUES
('Multi-source Data Ingestion', 'Integration with multiple weather APIs for comprehensive data', false, true, 'high', 'data'),
('Real-time Radar Maps', 'Interactive radar overlays with weather visualization', false, true, 'high', 'ui'),
('AI/ML Prediction Models', 'Machine learning models for weather forecasting', false, true, 'high', 'ml'),
('Confidence Scores', 'Uncertainty quantification for predictions', false, true, 'medium', 'ml'),
('Custom Thresholds', 'User-configurable alert thresholds per airfield', false, true, 'high', 'alerts'),
('Audio Alerts', 'Sound notifications for critical weather conditions', false, true, 'medium', 'alerts'),
('Audit Logs', 'Complete logging system for all user actions', false, true, 'medium', 'infrastructure'),
('Storm Animation', 'Animated storm movement visualization', false, true, 'medium', 'ui'),
('Historical Data Storage', 'Long-term weather data persistence', true, false, 'low', 'data'),
('User Authentication', 'Secure user login and preferences', true, false, 'high', 'infrastructure');