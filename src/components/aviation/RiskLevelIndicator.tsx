import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';

interface RiskFactors {
  trafficDensity: number;
  weatherRisk: number;
  windRisk: number;
  systemAlerts: number;
}

interface RiskLevelIndicatorProps {
  factors?: RiskFactors;
}

export const RiskLevelIndicator: React.FC<RiskLevelIndicatorProps> = ({ 
  factors = {
    trafficDensity: 0,
    weatherRisk: 0,
    windRisk: 0,
    systemAlerts: 0
  }
}) => {
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Calculate overall risk score (0-100)
    const calculatedScore = Math.min(100, Math.round(
      factors.trafficDensity * 0.3 +
      factors.weatherRisk * 0.4 +
      factors.windRisk * 0.2 +
      factors.systemAlerts * 0.1
    ));

    setRiskScore(calculatedScore);

    // Determine risk level and status message
    if (calculatedScore <= 25) {
      setRiskLevel('low');
      setStatusMessage('Optimal conditions - Normal operations');
    } else if (calculatedScore <= 50) {
      setRiskLevel('medium');
      setStatusMessage('Moderate conditions - Monitor closely');
    } else if (calculatedScore <= 75) {
      setRiskLevel('high');
      setStatusMessage('Challenging conditions - Exercise caution');
    } else {
      setRiskLevel('critical');
      setStatusMessage('Severe conditions - Consider restrictions');
    }
  }, [factors]);

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low': return { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-400' };
      case 'medium': return { bg: 'bg-yellow-500', border: 'border-yellow-400', text: 'text-yellow-400' };
      case 'high': return { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-400' };
      case 'critical': return { bg: 'bg-red-500', border: 'border-red-400', text: 'text-red-400' };
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="w-6 h-6" />;
      case 'medium': return <Shield className="w-6 h-6" />;
      case 'high': return <AlertTriangle className="w-6 h-6" />;
      case 'critical': return <XCircle className="w-6 h-6" />;
    }
  };

  const colors = getRiskColor();

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={colors.text}>
            {getRiskIcon()}
          </div>
          System Risk Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Risk Gauge */}
          <div className="relative">
            <div className="w-32 h-32 mx-auto relative">
              {/* Background Circle */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(riskScore / 100) * 283} 283`}
                  className={colors.text}
                  style={{
                    transition: 'stroke-dasharray 1s ease-in-out'
                  }}
                />
              </svg>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-3xl font-bold ${colors.text}`}>
                  {riskScore}
                </div>
                <div className="text-xs text-white/70 uppercase tracking-wide">
                  {riskLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${colors.border} ${colors.bg}/20`}>
              <span className="text-sm font-medium">{statusMessage}</span>
            </div>
          </div>

          {/* Risk Factors Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-white/80">Risk Factors:</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Traffic Density</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors.bg} transition-all duration-500`}
                      style={{ width: `${factors.trafficDensity}%` }}
                    />
                  </div>
                  <span className="w-8 text-right">{Math.round(factors.trafficDensity)}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/70">Weather Risk</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors.bg} transition-all duration-500`}
                      style={{ width: `${factors.weatherRisk}%` }}
                    />
                  </div>
                  <span className="w-8 text-right">{Math.round(factors.weatherRisk)}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/70">Wind Risk</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors.bg} transition-all duration-500`}
                      style={{ width: `${factors.windRisk}%` }}
                    />
                  </div>
                  <span className="w-8 text-right">{Math.round(factors.windRisk)}%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/70">System Alerts</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors.bg} transition-all duration-500`}
                      style={{ width: `${factors.systemAlerts}%` }}
                    />
                  </div>
                  <span className="w-8 text-right">{Math.round(factors.systemAlerts)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};