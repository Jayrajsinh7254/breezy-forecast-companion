
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '@/hooks/useAuth';
// import { useUserPreferences } from '@/hooks/useUserPreferences';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
// import { User, Settings, MapPin, Thermometer, Bell, Star, Trash2 } from 'lucide-react';
// import { supabase } from '@/integrations/supabase/client';
// import { toast } from '@/hooks/use-toast';

// interface UserProfileProps {
//   onClose: () => void;
// }

// export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
//   const { user, signOut } = useAuth();
//   const { preferences, updatePreferences, addFavoriteLocation, removeFavoriteLocation } = useUserPreferences();
//   const [profile, setProfile] = useState({ full_name: '', username: '' });
//   const [newLocation, setNewLocation] = useState('');
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (user) {
//       fetchProfile();
//     }
//   }, [user]);

//   const fetchProfile = async () => {
//     if (!user) return;

//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('full_name, username')
//         .eq('id', user.id)
//         .single();

//       if (error && error.code !== 'PGRST116') {
//         throw error;
//       }

//       if (data) {
//         setProfile({
//           full_name: data.full_name || '',
//           username: data.username || '',
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching profile:', error);
//     }
//   };

//   const updateProfile = async () => {
//     if (!user) return;

//     setLoading(true);
//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .upsert({
//           id: user.id,
//           full_name: profile.full_name,
//           username: profile.username,
//         });

//       if (error) throw error;

//       toast({
//         title: "Profile updated",
//         description: "Your profile has been successfully updated.",
//       });
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       toast({
//         title: "Error",
//         description: "Failed to update profile. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddLocation = () => {
//     if (newLocation.trim()) {
//       addFavoriteLocation(newLocation.trim());
//       setNewLocation('');
//     }
//   };

//   const handleSignOut = async () => {
//     await signOut();
//     onClose();
//   };

//   return (
//     <div className="space-y-6">
//       {/* Profile Information */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <User className="w-5 h-5" />
//             Profile Information
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="email">Email</Label>
//             <Input
//               id="email"
//               value={user?.email || ''}
//               disabled
//               className="bg-gray-50"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="full_name">Full Name</Label>
//             <Input
//               id="full_name"
//               value={profile.full_name}
//               onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
//               placeholder="Enter your full name"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="username">Username</Label>
//             <Input
//               id="username"
//               value={profile.username}
//               onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
//               placeholder="Choose a username"
//             />
//           </div>

//           <Button onClick={updateProfile} disabled={loading} className="w-full">
//             {loading ? 'Updating...' : 'Update Profile'}
//           </Button>
//         </CardContent>
//       </Card>

//       {/* Weather Preferences */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Settings className="w-5 h-5" />
//             Weather Preferences
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="space-y-2">
//             <Label>Temperature Unit</Label>
//             <Select
//               value={preferences.temperature_unit}
//               onValueChange={(value: 'celsius' | 'fahrenheit') => 
//                 updatePreferences({ temperature_unit: value })
//               }
//             >
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="celsius">Celsius (°C)</SelectItem>
//                 <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="default_location">Default Location</Label>
//             <Input
//               id="default_location"
//               value={preferences.default_location || ''}
//               onChange={(e) => updatePreferences({ default_location: e.target.value })}
//               placeholder="Enter your default city"
//             />
//           </div>

//           <div className="flex items-center justify-between">
//             <div className="space-y-0.5">
//               <Label className="flex items-center gap-2">
//                 <Bell className="w-4 h-4" />
//                 Notifications
//               </Label>
//               <p className="text-sm text-gray-600">Receive weather alerts and updates</p>
//             </div>
//             <Switch
//               checked={preferences.notifications_enabled}
//               onCheckedChange={(checked) => updatePreferences({ notifications_enabled: checked })}
//             />
//           </div>
//         </CardContent>
//       </Card>

//       {/* Favorite Locations */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Star className="w-5 h-5" />
//             Favorite Locations
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex gap-2">
//             <Input
//               value={newLocation}
//               onChange={(e) => setNewLocation(e.target.value)}
//               placeholder="Add a favorite location"
//               onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
//             />
//             <Button onClick={handleAddLocation}>Add</Button>
//           </div>

//           <div className="flex flex-wrap gap-2">
//             {preferences.favorite_locations.map((location, index) => (
//               <Badge key={index} variant="secondary" className="flex items-center gap-1">
//                 <MapPin className="w-3 h-3" />
//                 {location}
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="h-auto p-0 w-4 h-4 hover:bg-red-100"
//                   onClick={() => removeFavoriteLocation(location)}
//                 >
//                   <Trash2 className="w-3 h-3" />
//                 </Button>
//               </Badge>
//             ))}
//           </div>

//           {preferences.favorite_locations.length === 0 && (
//             <p className="text-gray-500 text-sm">No favorite locations added yet.</p>
//           )}
//         </CardContent>
//       </Card>

//       {/* Account Actions */}
//       <div className="flex gap-2">
//         <Button onClick={onClose} variant="outline" className="flex-1">
//           Close
//         </Button>
//         <Button onClick={handleSignOut} variant="destructive" className="flex-1">
//           Sign Out
//         </Button>
//       </div>
//     </div>
//   );
// };

// File: src/components/UserProfile.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Settings, MapPin, Thermometer, Bell, Star, Trash2, Wind, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types'; // Import types

interface UserProfileProps {
  onClose: () => void;
}

// Define the types for our joined data
type Airfield = Tables<'airfields'>;
type WeatherThreshold = Tables<'weather_thresholds'>;

export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const { preferences, updatePreferences, addFavoriteLocation, removeFavoriteLocation } = useUserPreferences();
  const [profile, setProfile] = useState({ full_name: '', username: '' });
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);

  // New state for thresholds
  const [airfields, setAirfields] = useState<Airfield[]>([]);
  const [thresholds, setThresholds] = useState<WeatherThreshold[]>([]);
  const [selectedAirfieldId, setSelectedAirfieldId] = useState<string>('');
  const [currentThreshold, setCurrentThreshold] = useState<Partial<WeatherThreshold>>({
    wind_speed_max: null,
    temperature_min: null,
    temperature_max: null,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAirfieldsAndThresholds();
    }
  }, [user]);

  // Update form when selected airfield changes
  useEffect(() => {
    if (selectedAirfieldId) {
      const found = thresholds.find(t => t.airfield_id === selectedAirfieldId);
      if (found) {
        setCurrentThreshold(found);
      } else {
        // Reset form if no threshold exists for this airfield yet
        setCurrentThreshold({
          wind_speed_max: null,
          temperature_min: null,
          temperature_max: null,
        });
      }
    }
  }, [selectedAirfieldId, thresholds]);

  const fetchProfile = async () => {
    if (!user) return;
    // ... (This function is unchanged)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          username: data.username || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };
  
  // NEW function: Fetches airfields (that match favorites) and existing thresholds
  const fetchAirfieldsAndThresholds = async () => {
    if (!user || preferences.favorite_locations.length === 0) return;
    
    setLoading(true);
    try {
      const locationNames = preferences.favorite_locations.map(loc => loc.split(',')[0].trim());
      
      // 1. Fetch airfield data that matches favorite locations
      const { data: airfieldData, error: airfieldError } = await supabase
        .from('airfields')
        .select('*')
        .in('name', locationNames);

      if (airfieldError) throw airfieldError;
      setAirfields(airfieldData || []);

      // 2. Fetch existing thresholds for this user
      const { data: thresholdData, error: thresholdError } = await supabase
        .from('weather_thresholds')
        .select('*')
        .eq('user_id', user.id);
      
      if (thresholdError) throw thresholdError;
      setThresholds(thresholdData || []);

      // 3. Set default selected airfield
      if (airfieldData && airfieldData.length > 0) {
        setSelectedAirfieldId(airfieldData[0].id);
      }
      
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      toast({ title: "Error fetching thresholds", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    // ... (This function is unchanged)
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          username: profile.username,
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // NEW function: Saves the threshold data to Supabase
  const handleSaveThreshold = async () => {
    if (!user || !selectedAirfieldId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('weather_thresholds')
        .upsert({
          user_id: user.id,
          airfield_id: selectedAirfieldId,
          wind_speed_max: currentThreshold.wind_speed_max || null,
          temperature_min: currentThreshold.temperature_min || null,
          temperature_max: currentThreshold.temperature_max || null,
          is_active: true, // Ensure it's active
        }, { onConflict: 'user_id, airfield_id' }); // Upsert based on user and airfield

      if (error) throw error;

      // Refetch thresholds to update local state
      fetchAirfieldsAndThresholds();
      
      toast({
        title: "Thresholds Saved",
        description: "Your alert settings have been saved.",
      });
    } catch (error) {
      console.error('Error saving threshold:', error);
      toast({ title: "Error saving threshold", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      addFavoriteLocation(newLocation.trim());
      // After adding, refetch airfields
      setTimeout(fetchAirfieldsAndThresholds, 500);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = async (location: string) => {
    await removeFavoriteLocation(location);
    // After removing, refetch airfields
    setTimeout(fetchAirfieldsAndThresholds, 500);
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Profile Information (Unchanged) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Choose a username"
            />
          </div>
          <Button onClick={updateProfile} disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Weather Preferences (Unchanged) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Weather Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Temperature Unit</Label>
            <Select
              value={preferences.temperature_unit}
              onValueChange={(value: 'celsius' | 'fahrenheit') => 
                updatePreferences({ temperature_unit: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celsius">Celsius (°C)</SelectItem>
                <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_location">Default Location</Label>
            <Input
              id="default_location"
              value={preferences.default_location || ''}
              onChange={(e) => updatePreferences({ default_location: e.target.value })}
              placeholder="Enter your default city"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </Label>
              <p className="text-sm text-gray-600">Receive weather alerts and updates</p>
            </div>
            <Switch
              checked={preferences.notifications_enabled}
              onCheckedChange={(checked) => updatePreferences({ notifications_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Favorite Locations (Modified) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Favorite Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add a favorite location (e.g., London)"
              onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
            />
            <Button onClick={handleAddLocation}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.favorite_locations.map((location, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4 hover:bg-red-100"
                  onClick={() => handleRemoveLocation(location)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
          {preferences.favorite_locations.length === 0 && (
            <p className="text-gray-500 text-sm">No favorite locations added yet.</p>
          )}
        </CardContent>
      </Card>
      
      {/* *** NEW CARD *** */}
      {/* Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alert Thresholds
          </CardTitle>
          <CardDescription>
            Set custom thresholds for your favorite locations. Our server will monitor these 24/7.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {airfields.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Add a "Favorite Location" that matches an airfield in our system to set thresholds.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select Airfield to Edit</Label>
                <Select value={selectedAirfieldId} onValueChange={setSelectedAirfieldId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an airfield..." />
                  </SelectTrigger>
                  <SelectContent>
                    {airfields.map(af => (
                      <SelectItem key={af.id} value={af.id}>
                        {af.code} - {af.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAirfieldId && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="max_wind" className="flex items-center gap-2">
                      <Wind className="w-4 h-4" />
                      Max Wind Speed (km/h)
                    </Label>
                    <Input
                      id="max_wind"
                      type="number"
                      placeholder="e.g., 40"
                      value={currentThreshold.wind_speed_max || ''}
                      onChange={(e) => setCurrentThreshold(prev => ({ ...prev, wind_speed_max: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_temp" className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4" />
                        Min Temp (°C)
                      </Label>
                      <Input
                        id="min_temp"
                        type="number"
                        placeholder="e.g., 5"
                        value={currentThreshold.temperature_min || ''}
                        onChange={(e) => setCurrentThreshold(prev => ({ ...prev, temperature_min: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_temp" className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4" />
                        Max Temp (°C)
                      </Label>
                      <Input
                        id="max_temp"
                        type="number"
                        placeholder="e.g., 35"
                        value={currentThreshold.temperature_max || ''}
                        onChange={(e) => setCurrentThreshold(prev => ({ ...prev, temperature_max: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveThreshold} disabled={loading} className="w-full">
                    {loading ? 'Saving...' : 'Save Thresholds for this Airfield'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Account Actions (Unchanged) */}
      <div className="flex gap-2">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Close
        </Button>
        <Button onClick={handleSignOut} variant="destructive" className="flex-1">
          Sign Out
        </Button>
      </div>
    </div>
  );
};