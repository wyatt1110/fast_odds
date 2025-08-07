'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser, supabase } from "@/lib/supabase/client";
import { User, Settings, BarChart2, LogOut, Edit2, Save, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  telegram_username?: string | null;
  phone_number?: string | null;
  membership_tier?: string | null;
  created_at: string;
}

interface EditableFieldProps {
  label: string;
  value: string;
  field: keyof UserProfile | 'password';
  onUpdate: (field: keyof UserProfile | 'password', value: string) => Promise<void>;
  isPassword?: boolean;
}

const EditableField = ({ label, value, field, onUpdate, isPassword = false }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [loading, setLoading] = useState(false);

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(field, editValue);
      setIsEditing(false);
      // For password field, clear the input after successful update
      if (isPassword) {
        setEditValue('');
      }
    } catch (error) {
      setEditValue(value); // Reset on error
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <div>
      <label className="text-xs font-bold text-betting-green uppercase tracking-wide border-b border-betting-green/40 pb-1 block mb-2">
        {label}
      </label>
      {isEditing ? (
        <div className="mt-1 space-y-2">
          <Input
            type={isPassword ? "password" : "text"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-betting-dark border-betting-green/20 text-white h-8 text-sm"
            placeholder={isPassword ? "Enter new password" : `Enter ${label.toLowerCase()}`}
          />
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              size="sm"
              className="bg-betting-green hover:bg-betting-green/80 h-7 text-xs px-2"
            >
              {loading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={12} className="mr-1" /> Save</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="border-gray-500 text-gray-300 hover:bg-gray-700 h-7 text-xs px-2"
            >
              <X size={12} className="mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between group">
          <p className="text-white text-sm font-normal bg-slate-700/50 px-3 py-1.5 rounded border border-slate-600/50 min-h-[2rem] flex items-center flex-1 mr-2">
            {value || <span className="text-white/60 italic">Not set</span>}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white hover:bg-betting-green/20 h-7 w-7 p-0"
          >
            <Edit2 size={12} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default function Account() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('Current user:', currentUser);
        setUser(currentUser);
        
        if (currentUser) {
          // Fetch user profile from user_profiles table
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
            
          if (profile) {
            console.log('User profile found:', profile);
            setUserProfile(profile);
          } else if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
          }
        } else {
          console.log('No current user found');
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      }
      
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const updateProfile = async (field: keyof UserProfile | 'password', value: string) => {
    if (!user) return;

    try {
      if (field === 'email') {
        // Update email through Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({ email: value });
        if (authError) throw authError;
      } else if (field === 'password' as string) {
        // Update password through Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({ password: value });
        if (authError) throw authError;
        
        toast({
          title: "Password updated",
          description: "Your password has been successfully updated.",
        });
        return;
      }

      // For other fields, update profile in user_profiles table
      const isProfileField = field !== 'password';
      if (isProfileField && userProfile) {
        const updateData: any = { [field]: value };
        
        const { error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setUserProfile({ ...userProfile, [field]: value });
      }
      
      toast({
        title: "Profile updated",
        description: `Your ${field.replace('_', ' ')} has been updated successfully.`,
      });
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      
      router.push("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  if (!loading && !user) {
    router.push("/login");
    return null;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-betting-dark">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-betting-green"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Account Dashboard</h1>
            <p className="text-gray-300">Manage your OddsVantage account and access premium tools</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Information */}
            <Card className="bg-betting-dark border-betting-green/20 shadow-lg lg:col-span-2">
              <CardHeader className="bg-gradient-to-r from-betting-green/10 to-betting-green/5 py-4">
                <CardTitle className="flex items-center text-white font-bold text-xl border-b-2 border-betting-green/40 pb-2 mb-0">
                  <User className="mr-3" size={24} />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="border-2 border-betting-green/40 rounded-xl p-4 bg-slate-900/60 shadow-inner">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-800/70 border border-betting-green/30 rounded-lg p-3">
                      <EditableField
                        label="Name"
                        value={userProfile?.full_name || ''}
                        field="full_name"
                        onUpdate={updateProfile}
                      />
                    </div>
                    <div className="bg-slate-800/70 border border-betting-green/30 rounded-lg p-3">
                      <EditableField
                        label="Email"
                        value={userProfile?.email || user?.email || ''}
                        field="email"
                        onUpdate={updateProfile}
                      />
                    </div>
                    <div className="bg-slate-800/70 border border-betting-green/30 rounded-lg p-3">
                      <EditableField
                        label="Password"
                        value="••••••••"
                        field="password"
                        onUpdate={updateProfile}
                        isPassword={true}
                      />
                    </div>
                    <div className="bg-slate-800/70 border border-betting-green/30 rounded-lg p-3">
                      <EditableField
                        label="Telegram Username"
                        value={userProfile?.telegram_username || ''}
                        field="telegram_username"
                        onUpdate={updateProfile}
                      />
                    </div>
                    <div className="bg-slate-800/70 border border-betting-green/30 rounded-lg p-3">
                      <EditableField
                        label="Phone Number"
                        value={userProfile?.phone_number || ''}
                        field="phone_number"
                        onUpdate={updateProfile}
                      />
                    </div>
                    <div className="bg-gradient-to-r from-betting-green/20 to-betting-green/10 border-2 border-betting-green/50 rounded-lg p-3">
                      <label className="text-sm font-bold text-betting-green uppercase tracking-wide border-b border-betting-green/40 pb-1 block mb-2">
                        Membership Tier
                      </label>
                      <p className="text-white text-base font-semibold bg-betting-green/20 px-3 py-1 rounded border border-betting-green/40">
                        {userProfile?.membership_tier || 'Premium'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Sidebar */}
            <Card className="bg-betting-dark border-betting-green/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-white text-lg">
                  <Settings className="mr-2" size={18} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Button 
                  className="w-full bg-betting-green hover:bg-betting-secondary text-white py-2"
                  onClick={() => router.push("/betting-dashboard")}
                >
                  Launch Turf Tracker
                </Button>
                
                <Button 
                  className="w-full bg-gradient-to-r from-betting-green to-betting-secondary hover:from-betting-secondary hover:to-betting-green text-white py-2"
                  onClick={() => router.push("/membership")}
                >
                  View Membership Tiers
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-betting-green/20 text-white hover:bg-betting-green/10 py-2"
                  onClick={() => router.push("/account/details")}
                >
                  Update Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-betting-green/20 text-white hover:bg-betting-green/10 py-2"
                  onClick={() => router.push("/account/reset-password")}
                >
                  Change Password
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 py-2"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </Layout>
  );
} 