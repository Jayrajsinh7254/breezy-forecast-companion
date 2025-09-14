import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Volume2, VolumeX, Bell, X, Clock, MapPin, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface WeatherAlert {
  id: string;
  airfield_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  threshold_value?: number;
  actual_value?: number;
  confidence_score: number;
  is_active: boolean;
  acknowledged_at?: string;
  expires_at?: string;
  created_at: string;
  airfield?: {
    code: string;
    name: string;
  };
}

interface AlertSettings {
  audioEnabled: boolean;
  visualEnabled: boolean;
  browserNotifications: boolean;
  minimumSeverity: 'low' | 'medium' | 'high' | 'critical';
}

export const AlertSystem: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>({
    audioEnabled: true,
    visualEnabled: true,
    browserNotifications: true,
    minimumSeverity: 'medium'
  });
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [lastAlertCheck, setLastAlertCheck] = useState(new Date());

  useEffect(() => {
    if (user) {
      fetchAlerts();
      setupRealtimeSubscription();
      requestNotificationPermission();
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        checkForNewAlerts();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, lastAlertCheck]);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weather_alerts')
        .select(`
          *,
          airfield:airfields(code, name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedAlerts = (data || []).map(alert => ({
        ...alert,
        severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
        airfield: alert.airfield
      }));
      
      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alerts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weather_alerts')
        .select(`
          *,
          airfield:airfields(code, name)
        `)
        .eq('is_active', true)
        .gt('created_at', lastAlertCheck.toISOString());

      if (error) throw error;

      if (data && data.length > 0) {
        const newAlerts = data.filter(alert => 
          shouldTriggerAlert(alert.severity, settings.minimumSeverity)
        );

        newAlerts.forEach(alert => {
          triggerAlert({
            ...alert,
            severity: alert.severity as 'low' | 'medium' | 'high' | 'critical'
          });
        });

        setAlerts(prev => [...prev, ...data.map(alert => ({
          ...alert,
          severity: alert.severity as 'low' | 'medium' | 'high' | 'critical'
        }))]);
        setLastAlertCheck(new Date());
      }
    } catch (error) {
      console.error('Error checking for new alerts:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('weather_alerts')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'weather_alerts'
        }, 
        (payload) => {
          const newAlert = payload.new as WeatherAlert;
          if (shouldTriggerAlert(newAlert.severity, settings.minimumSeverity)) {
            triggerAlert(newAlert);
          }
          setAlerts(prev => [newAlert, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const shouldTriggerAlert = (alertSeverity: string, minimumSeverity: string): boolean => {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const alertLevel = severityLevels[alertSeverity as keyof typeof severityLevels] || 0;
    const minLevel = severityLevels[minimumSeverity as keyof typeof severityLevels] || 0;
    return alertLevel >= minLevel;
  };

  const triggerAlert = (alert: WeatherAlert) => {
    // Visual notification
    if (settings.visualEnabled) {
      toast({
        title: `⚠️ ${alert.title}`,
        description: alert.message,
        variant: alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default',
      });
    }

    // Audio notification
    if (settings.audioEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Browser notification
    if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`Weather Alert - ${alert.airfield?.code || 'Unknown'}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id,
        requireInteraction: alert.severity === 'critical'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ 
          acknowledged_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast({
        title: 'Alert Acknowledged',
        description: 'Alert has been marked as read',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive'
      });
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast({
        title: 'Alert Dismissed',
        description: 'Alert has been removed',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss alert',
        variant: 'destructive'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'border-green-400 bg-green-400/10';
      case 'medium': return 'border-yellow-400 bg-yellow-400/10';
      case 'high': return 'border-orange-400 bg-orange-400/10';
      case 'critical': return 'border-red-400 bg-red-400/10 animate-pulse';
      default: return 'border-gray-400 bg-gray-400/10';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'wind': return <Wind className="w-4 h-4" />;
      case 'temperature': return '🌡️';
      case 'visibility': return '👁️';
      case 'storm': return '⛈️';
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading alert system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Hidden audio element for alerts */}
      <audio
        ref={audioRef}
        preload="auto"
        className="hidden"
      >
        <source src="/alert-sound.wav" type="audio/wav" />
      </audio>

      {/* Header and Settings */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              Alert System
              {alerts.length > 0 && (
                <Badge className="bg-red-500 text-white">
                  {alerts.length} active
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="audio-alerts"
                checked={settings.audioEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, audioEnabled: checked }))}
              />
              <Label htmlFor="audio-alerts" className="flex items-center gap-2">
                {settings.audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Audio Alerts
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="visual-alerts"
                checked={settings.visualEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, visualEnabled: checked }))}
              />
              <Label htmlFor="visual-alerts">Visual Alerts</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="browser-notifications"
                checked={settings.browserNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, browserNotifications: checked }))}
              />
              <Label htmlFor="browser-notifications">Browser Notifications</Label>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Minimum Severity</Label>
              <select
                value={settings.minimumSeverity}
                onChange={(e) => setSettings(prev => ({ ...prev, minimumSeverity: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-semibold mb-2">No Active Alerts</h3>
              <p className="text-white/70">All systems are operating within normal parameters</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Alert
              key={alert.id}
              className={`border-2 ${getSeverityColor(alert.severity)} text-white`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{alert.title}</h4>
                      <Badge className={`text-xs ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'high' ? 'bg-orange-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      } text-white`}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      {alert.airfield && (
                        <Badge variant="outline" className="text-xs text-white border-white/30">
                          {alert.airfield.code}
                        </Badge>
                      )}
                    </div>
                    
                    <AlertDescription className="text-white/90 mb-3">
                      {alert.message}
                    </AlertDescription>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-white/70">
                      {alert.threshold_value && alert.actual_value && (
                        <div>
                          <span className="font-medium">Threshold:</span> {alert.threshold_value}
                          <br />
                          <span className="font-medium">Actual:</span> {alert.actual_value}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Confidence:</span> {alert.confidence_score}%
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                      {alert.airfield && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.airfield.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {!alert.acknowledged_at && (
                    <Button
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                    >
                      Acknowledge
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissAlert(alert.id)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Alert>
          ))
        )}
      </div>

      {/* Test Alert Button */}
      <div className="text-center">
        <Button
          onClick={() => {
            const testAlert: WeatherAlert = {
              id: 'test-' + Date.now(),
              airfield_id: 'test',
              alert_type: 'test',
              severity: 'medium',
              title: 'Test Alert',
              message: 'This is a test alert to verify the alert system is working correctly.',
              confidence_score: 95,
              is_active: true,
              created_at: new Date().toISOString(),
              airfield: { code: 'TEST', name: 'Test Airfield' }
            };
            triggerAlert(testAlert);
          }}
          variant="outline"
          className="bg-white/10 hover:bg-white/20 text-white border-white/30"
        >
          Test Alert System
        </Button>
      </div>
    </div>
  );
};