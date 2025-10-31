// File: supabase/functions/check-weather-alerts/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from './cors.ts' // We will create this file next

// Define types for our data
// These should match your database schema
interface Airfield {
  id: string
  latitude: number
  longitude: number
  code: string // Added for better alert messages
  name: string
}

interface WeatherThreshold {
  id: string
  user_id: string
  airfield_id: string
  wind_speed_max: number | null
  temperature_min: number | null
  temperature_max: number | null
  airfield: Airfield // This comes from our join query
}

interface WeatherAlertInsert {
  airfield_id: string
  user_id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  threshold_value?: number
  actual_value?: number
  confidence_score: number
  is_active: boolean
}

// Get the OpenWeatherMap API Key from Supabase Secrets
const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY')

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY is not set in Supabase secrets')
    }

    // Create a Supabase client with the service role key for full access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch all active thresholds and join their corresponding airfield data
    const { data: thresholds, error: thresholdError } = await supabaseAdmin
      .from('weather_thresholds')
      .select(`
        id,
        user_id,
        airfield_id,
        wind_speed_max,
        temperature_min,
        temperature_max,
        airfield:airfields (id, latitude, longitude, code, name)
      `)
      .eq('is_active', true)
      .not('airfield', 'is', null) // Only get thresholds with valid airfields

    if (thresholdError) throw thresholdError
    if (!thresholds || thresholds.length === 0) {
      console.log('No active thresholds found. Exiting.')
      return new Response(JSON.stringify({ message: 'No active thresholds' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Get a unique list of airfields to check (to avoid duplicate API calls)
    const airfieldsToCheck = new Map<string, Airfield>()
    for (const t of thresholds as WeatherThreshold[]) {
      if (t.airfield && !airfieldsToCheck.has(t.airfield_id)) {
        airfieldsToCheck.set(t.airfield_id, t.airfield)
      }
    }

    const allAlertsToCreate: WeatherAlertInsert[] = []

    // 3. Fetch weather for each unique airfield
    for (const [airfieldId, airfield] of airfieldsToCheck.entries()) {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${airfield.latitude}&lon=${airfield.longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
      )

      if (!weatherResponse.ok) {
        console.error(`Failed to fetch weather for airfield ${airfield.code} (ID: ${airfieldId})`)
        continue // Skip to the next airfield
      }

      const weather = await weatherResponse.json()
      
      const currentTemp = weather.main.temp as number
      const currentWindSpeed = (weather.wind.speed * 3.6) as number // Convert m/s to km/h
      const currentCondition = weather.weather[0].main.toLowerCase() as string

      // 4. Find all thresholds that apply to this specific airfield
      const relevantThresholds = (thresholds as WeatherThreshold[]).filter(
        (t) => t.airfield_id === airfieldId
      )

      // 5. Check API data against each user's thresholds
      for (const threshold of relevantThresholds) {
        
        // Check High Wind (3-level alert logic)
        if (threshold.wind_speed_max && currentWindSpeed > threshold.wind_speed_max) {
          const breachAmount = currentWindSpeed - threshold.wind_speed_max
          let severity: 'medium' | 'high' | 'critical' = 'medium'
          if (breachAmount > 10) severity = 'high' // Over 10 km/h threshold
          if (breachAmount > 20) severity = 'critical' // Over 20 km/h threshold

          allAlertsToCreate.push({
            airfield_id: threshold.airfield_id,
            user_id: threshold.user_id,
            alert_type: 'wind',
            severity: severity,
            title: `${severity.toUpperCase()} Wind Alert for ${airfield.code}`,
            message: `Wind speed at ${Math.round(currentWindSpeed)} km/h, exceeding your threshold of ${threshold.wind_speed_max} km/h.`,
            threshold_value: threshold.wind_speed_max,
            actual_value: Math.round(currentWindSpeed),
            confidence_score: 100,
            is_active: true,
          })
        }

        // Check Low Temp
        if (threshold.temperature_min && currentTemp < threshold.temperature_min) {
          allAlertsToCreate.push({
            airfield_id: threshold.airfield_id,
            user_id: threshold.user_id,
            alert_type: 'temperature',
            severity: 'low',
            title: `Low Temperature Alert (${airfield.code})`,
            message: `Temperature at ${Math.round(currentTemp)}°C, below your threshold of ${threshold.temperature_min}°C.`,
            threshold_value: threshold.temperature_min,
            actual_value: Math.round(currentTemp),
            confidence_score: 100,
            is_active: true,
          })
        }
        
        // Check High Temp
        if (threshold.temperature_max && currentTemp > threshold.temperature_max) {
          allAlertsToCreate.push({
            airfield_id: threshold.airfield_id,
            user_id: threshold.user_id,
            alert_type: 'temperature',
            severity: 'medium',
            title: `High Temperature Alert (${airfield.code})`,
            message: `Temperature at ${Math.round(currentTemp)}°C, above your threshold of ${threshold.temperature_max}°C.`,
            threshold_value: threshold.temperature_max,
            actual_value: Math.round(currentTemp),
            confidence_score: 100,
            is_active: true,
          })
        }
        
        // Check for Storms (Critical Alert)
        if (currentCondition.includes('thunder') || currentCondition.includes('storm')) {
          allAlertsToCreate.push({
            airfield_id: threshold.airfield_id,
            user_id: threshold.user_id,
            alert_type: 'storm',
            severity: 'critical',
            title: `Storm Warning (${airfield.code})`,
            message: `Active thunderstorm detected: ${weather.weather[0].description}.`,
            confidence_score: 100,
            is_active: true,
          })
        }
      }
    }

    // 6. Avoid Duplicate Alerts
    const { data: existingAlerts, error: existingError } = await supabaseAdmin
      .from('weather_alerts')
      .select('user_id, airfield_id, alert_type, severity')
      .eq('is_active', true)
      
    if (existingError) throw existingError

    const newAlertsToInsert = allAlertsToCreate.filter(newAlert => {
      return !existingAlerts.some(existing => 
        existing.user_id === newAlert.user_id &&
        existing.airfield_id === newAlert.airfield_id &&
        existing.alert_type === newAlert.alert_type &&
        existing.severity === newAlert.severity
      )
    })

    // 7. Batch insert all new, unique alerts
    if (newAlertsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('weather_alerts')
        .insert(newAlertsToInsert)

      if (insertError) throw insertError
      
      console.log(`Successfully inserted ${newAlertsToInsert.length} new alerts.`)
    } else {
      console.log('No new alerts to create. Conditions are stable or alerts already exist.')
    }

    return new Response(
      JSON.stringify({ message: `Check complete. ${newAlertsToInsert.length} alerts created.` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    console.error(err)
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})