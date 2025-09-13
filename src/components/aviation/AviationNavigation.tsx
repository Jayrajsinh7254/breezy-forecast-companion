import React from 'react';
import { Plane, Radar, BarChart3, AlertTriangle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AviationNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AviationNavigation: React.FC<AviationNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Plane },
    { id: 'radar', label: 'Radar Map', icon: Radar },
    { id: 'alerts', label: 'Alert System', icon: AlertTriangle },
    { id: 'gap-analysis', label: 'Gap Analysis', icon: BarChart3 }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'bg-blue-500/30 text-blue-300 border-blue-400'
                : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
            } border`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
};

export default AviationNavigation;