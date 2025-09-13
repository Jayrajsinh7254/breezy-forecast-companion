import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Filter, Search, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GapAnalysisFeature {
  id: string;
  feature_name: string;
  description: string;
  is_present: boolean;
  is_missing: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  implementation_notes?: string;
  updated_at: string;
}

interface FilterOptions {
  showPresentOnly: boolean;
  showMissingOnly: boolean;
  selectedCategory: string;
  selectedPriority: string;
  searchTerm: string;
}

export const GapAnalysisDashboard: React.FC = () => {
  const [features, setFeatures] = useState<GapAnalysisFeature[]>([]);
  const [filteredFeatures, setFilteredFeatures] = useState<GapAnalysisFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    showPresentOnly: false,
    showMissingOnly: false,
    selectedCategory: 'all',
    selectedPriority: 'all',
    searchTerm: ''
  });

  const categories = ['all', 'data', 'ml', 'ui', 'alerts', 'infrastructure'];
  const priorities = ['all', 'low', 'medium', 'high'];

  useEffect(() => {
    fetchGapAnalysisData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [features, filters]);

  const fetchGapAnalysisData = async () => {
    try {
      const { data, error } = await supabase
        .from('gap_analysis_features')
        .select('*')
        .order('priority', { ascending: false })
        .order('feature_name');

      if (error) throw error;
      setFeatures((data || []).map(feature => ({
        ...feature,
        priority: feature.priority as 'low' | 'medium' | 'high'
      })));
    } catch (error) {
      console.error('Error fetching gap analysis data:', error);
      toast({
        title: "Error",
        description: "Failed to load gap analysis data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...features];

    // Text search
    if (filters.searchTerm) {
      filtered = filtered.filter(feature =>
        feature.feature_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        feature.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Present/Missing filters
    if (filters.showPresentOnly) {
      filtered = filtered.filter(feature => feature.is_present);
    }
    if (filters.showMissingOnly) {
      filtered = filtered.filter(feature => feature.is_missing);
    }

    // Category filter
    if (filters.selectedCategory !== 'all') {
      filtered = filtered.filter(feature => feature.category === filters.selectedCategory);
    }

    // Priority filter
    if (filters.selectedPriority !== 'all') {
      filtered = filtered.filter(feature => feature.priority === filters.selectedPriority);
    }

    setFilteredFeatures(filtered);
  };

  const updateFeatureStatus = async (featureId: string, isPresent: boolean) => {
    try {
      const { error } = await supabase
        .from('gap_analysis_features')
        .update({ 
          is_present: isPresent, 
          is_missing: !isPresent,
          updated_at: new Date().toISOString()
        })
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(prev =>
        prev.map(feature =>
          feature.id === featureId
            ? { ...feature, is_present: isPresent, is_missing: !isPresent }
            : feature
        )
      );

      toast({
        title: "Updated",
        description: `Feature status updated successfully`,
      });
    } catch (error) {
      console.error('Error updating feature status:', error);
      toast({
        title: "Error",
        description: "Failed to update feature status",
        variant: "destructive"
      });
    }
  };

  const getStats = () => {
    const total = features.length;
    const present = features.filter(f => f.is_present).length;
    const missing = features.filter(f => f.is_missing).length;
    const highPriority = features.filter(f => f.priority === 'high').length;
    const highPriorityMissing = features.filter(f => f.priority === 'high' && f.is_missing).length;

    return {
      total,
      present,
      missing,
      completionRate: total > 0 ? Math.round((present / total) * 100) : 0,
      highPriority,
      highPriorityMissing,
      criticalProgress: highPriority > 0 ? Math.round(((highPriority - highPriorityMissing) / highPriority) * 100) : 0
    };
  };

  const stats = getStats();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading gap analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            Gap Analysis Dashboard
          </h2>
          <p className="text-white/70">Feature implementation progress tracking</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Overall Progress</p>
                <p className="text-3xl font-bold">{stats.completionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <Progress value={stats.completionRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Present Features</p>
                <p className="text-3xl font-bold text-green-400">{stats.present}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-white/60 text-sm mt-2">of {stats.total} total</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Missing Features</p>
                <p className="text-3xl font-bold text-red-400">{stats.missing}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white/60 text-sm mt-2">need implementation</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">High Priority</p>
                <p className="text-3xl font-bold text-orange-400">{stats.criticalProgress}%</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
            <Progress value={stats.criticalProgress} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  placeholder="Search features..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10 bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-present"
                checked={filters.showPresentOnly}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showPresentOnly: checked }))}
              />
              <Label htmlFor="show-present" className="text-sm">Present Only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-missing"
                checked={filters.showMissingOnly}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showMissingOnly: checked }))}
              />
              <Label htmlFor="show-missing" className="text-sm">Missing Only</Label>
            </div>

            <select
              value={filters.selectedCategory}
              onChange={(e) => setFilters(prev => ({ ...prev, selectedCategory: e.target.value }))}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-gray-800">
                  {category === 'all' ? 'All Categories' : category.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={filters.selectedPriority}
              onChange={(e) => setFilters(prev => ({ ...prev, selectedPriority: e.target.value }))}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm"
            >
              {priorities.map(priority => (
                <option key={priority} value={priority} className="bg-gray-800">
                  {priority === 'all' ? 'All Priorities' : priority.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Feature Matrix */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle>
            Feature Implementation Matrix ({filteredFeatures.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold w-24">Present</th>
                  <th className="text-center py-3 px-4 font-semibold w-24">Missing</th>
                  <th className="text-center py-3 px-4 font-semibold w-24">Priority</th>
                  <th className="text-center py-3 px-4 font-semibold w-32">Category</th>
                  <th className="text-center py-3 px-4 font-semibold w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((feature) => (
                  <tr key={feature.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div>
                        <h4 className="font-semibold mb-1">{feature.feature_name}</h4>
                        <p className="text-sm text-white/70">{feature.description}</p>
                        {feature.implementation_notes && (
                          <p className="text-xs text-white/50 mt-1 italic">
                            {feature.implementation_notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      {feature.is_present ? (
                        <CheckCircle className="w-6 h-6 text-green-400 mx-auto" />
                      ) : (
                        <div className="w-6 h-6 mx-auto"></div>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {feature.is_missing ? (
                        <XCircle className="w-6 h-6 text-red-400 mx-auto" />
                      ) : (
                        <div className="w-6 h-6 mx-auto"></div>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      <Badge className={`${getPriorityColor(feature.priority)} text-white`}>
                        {feature.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="text-center py-4 px-4">
                      <Badge variant="outline" className="text-white border-white/30">
                        {feature.category.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="text-center py-4 px-4">
                      <Button
                        size="sm"
                        onClick={() => updateFeatureStatus(feature.id, !feature.is_present)}
                        className={
                          feature.is_present
                            ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                        }
                      >
                        {feature.is_present ? 'Mark Missing' : 'Mark Present'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};