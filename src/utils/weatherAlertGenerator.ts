import { supabase } from '@/integrations/supabase/client';

export interface AlertThresholds {
  wind: {
    yellow: number;  // Warning level
    orange: number;  // High alert
    red: number;     // Critical
  };
  visibility: {
    yellow: number;  // km
    orange: number;
    red: number;
  };
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  wind: {
    yellow: 20,  // 20+ knots - Caution
    orange: 30,  // 30+ knots - High alert
    red: 40      // 40+ knots - Critical
  },
  visibility: {
    yellow: 5,   // <5km - Caution
    orange: 3,   // <3km - High alert
    red: 1       // <1km - Critical
  }
};

interface WeatherCondition {
  temperature: number;
  wind_speed: number;
  wind_direction: number;
  visibility: number;
  conditions: string;
  pressure: number;
  humidity: number;
}

interface AlertParams {
  userId: string;
  airfieldId: string;
  airfieldCode: string;
  weather: WeatherCondition;
  thresholds?: AlertThresholds;
}

export async function generateWeatherAlerts({
  userId,
  airfieldId,
  airfieldCode,
  weather,
  thresholds = DEFAULT_THRESHOLDS
}: AlertParams): Promise<void> {
  const alerts = [];

  // Check wind speed alerts
  if (weather.wind_speed >= thresholds.wind.red) {
    alerts.push({
      user_id: userId,
      airfield_id: airfieldId,
      alert_type: 'wind',
      severity: 'critical',
      title: `🔴 Critical Wind Alert - ${airfieldCode}`,
      message: `Extreme wind conditions detected: ${Math.round(weather.wind_speed)} knots from ${weather.wind_direction}°. Flight operations severely restricted.`,
      threshold_value: thresholds.wind.red,
      actual_value: weather.wind_speed,
      confidence_score: 95,
      is_active: true
    });
  } else if (weather.wind_speed >= thresholds.wind.orange) {
    alerts.push({
      user_id: userId,
      airfield_id: airfieldId,
      alert_type: 'wind',
      severity: 'high',
      title: `🟠 High Wind Alert - ${airfieldCode}`,
      message: `Strong wind conditions: ${Math.round(weather.wind_speed)} knots from ${weather.wind_direction}°. Exercise caution for all operations.`,
      threshold_value: thresholds.wind.orange,
      actual_value: weather.wind_speed,
      confidence_score: 90,
      is_active: true
    });
  } else if (weather.wind_speed >= thresholds.wind.yellow) {
    alerts.push({
      user_id: userId,
      airfield_id: airfieldId,
      alert_type: 'wind',
      severity: 'medium',
      title: `🟡 Wind Caution - ${airfieldCode}`,
      message: `Moderate wind conditions: ${Math.round(weather.wind_speed)} knots from ${weather.wind_direction}°. Monitor closely.`,
      threshold_value: thresholds.wind.yellow,
      actual_value: weather.wind_speed,
      confidence_score: 85,
      is_active: true
    });
  }

  // Check visibility alerts
  if (weather.visibility < thresholds.visibility.red) {
    alerts.push({
      user_id: userId,
      airfield_id: airfieldId,
      alert_type: 'visibility',
      severity: 'critical',
      title: `🔴 Critical Visibility Alert - ${airfieldCode}`,
      message: `Extremely low visibility: ${weather.visibility.toFixed(1)} km. IFR conditions, visual operations not recommended.`,
      threshold_value: thresholds.visibility.red,
      actual_value: weather.visibility,
      confidence_score: 95,
      is_active: true
    });
  } else if (weather.visibility < thresholds.visibility.orange) {
    alerts.push({
      user_id: userId,
      airfield_id: airfieldId,
      alert_type: 'visibility',
      severity: 'high',
      title: `🟠 Low Visibility Alert - ${airfieldCode}`,
      message: `Reduced visibility: ${weather.visibility.toFixed(1)} km. Marginal VFR conditions.`,
      threshold_value: thresholds.visibility.orange,
      actual_value: weather.visibility,
      confidence_score: 90,
      is_active: true
    });
  } else if (weather.visibility < thresholds.visibility.yellow) {
    alerts.push({
      user_id: userId,
      airfield_id: airfieldId,
      alert_type: 'visibility',
      severity: 'medium',
      title: `🟡 Visibility Caution - ${airfieldCode}`,
      message: `Moderate visibility: ${weather.visibility.toFixed(1)} km. Monitor conditions.`,
      threshold_value: thresholds.visibility.yellow,
      actual_value: weather.visibility,
      confidence_score: 85,
      is_active: true
    });
  }

  // Check weather condition alerts
  const severeConditions = ['Rain', 'Fog', 'Thunderstorm', 'Snow', 'Hail'];
  if (severeConditions.some(condition => weather.conditions.includes(condition))) {
    let severity: 'medium' | 'high' | 'critical' = 'medium';
    let alertLevel = '🟡';
    
    if (weather.conditions.includes('Thunderstorm') || weather.conditions.includes('Hail')) {
      severity = 'critical';
      alertLevel = '🔴';
    } else if (weather.conditions.includes('Fog') && weather.visibility < 3) {
      severity = 'high';
      alertLevel = '🟠';
    } else if (weather.conditions.includes('Rain') && weather.wind_speed > 20) {
      severity = 'high';
      alertLevel = '🟠';
    }

    alerts.push({
      user_id: userId,
      airfield_id: airfieldId,
      alert_type: 'weather',
      severity,
      title: `${alertLevel} Weather Alert - ${airfieldCode}`,
      message: `${weather.conditions} reported. ${severity === 'critical' ? 'Immediate action required.' : 'Monitor situation closely.'}`,
      confidence_score: 85,
      is_active: true
    });
  }

  // Insert alerts into database
  if (alerts.length > 0) {
    // First, deactivate old alerts for this airfield
    await supabase
      .from('weather_alerts')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('airfield_id', airfieldId)
      .eq('is_active', true);

    // Insert new alerts
    const { error } = await supabase
      .from('weather_alerts')
      .insert(alerts);

    if (error) {
      console.error('Error creating weather alerts:', error);
    }
  }
}

export function getAlertColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'high':
      return 'orange';
    case 'medium':
      return 'yellow';
    default:
      return 'green';
  }
}
