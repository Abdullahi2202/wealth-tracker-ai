
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Eye, Flag, RotateCcw, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  transaction_count?: number;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  created_at: string;
}

interface ContentMetrics {
  total_users: number;
  active_users: number;
  total_categories: number;
  active_categories: number;
  recent_registrations: UserProfile[];
}

const ContentManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'users' | 'metrics'>('categories');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        toast.error('Failed to fetch categories');
        setCategories([]);
      } else {
        // Fetch transaction counts for each category
        const { data: transactionData } = await supabase
          .from('transactions')
          .select('category')
          .not('category', 'is', null);

        const categoryStats = transactionData?.reduce((acc: Record<string, number>, transaction) => {
          const category = transaction.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}) || {};

        const categoriesWithCounts = categoriesData?.map(category => ({
          ...category,
          transaction_count: categoryStats[category.name] || 0
        })) || [];

        setCategories(categoriesWithCounts);
      }

      // Fetch user profiles using admin-operations edge function or direct query
      try {
        console.log('Fetching user profiles as admin...');
        
        // Try using admin-operations edge function first
        const { data: response, error } = await supabase.functions.invoke('admin-operations', {
          body: { 
            action: 'get_all_users'
          }
        });

        if (error) {
          console.error('Error fetching users via edge function:', error);
          
          // Fallback: Try direct database query
          console.log('Trying direct profiles query...');
          const { data: profilesData, error: directError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          if (directError) {
            console.error('Direct profiles query also failed:', directError);
            toast.error('Failed to fetch user profiles');
            setUserProfiles([]);
          } else {
            console.log('Direct profiles query successful, users found:', profilesData?.length || 0);
            setUserProfiles(profilesData || []);
          }
        } else {
          console.log('Edge function successful, users found:', response?.users?.length || 0);
          setUserProfiles(response?.users || []);
        }
      } catch (profileError) {
        console.error('Error fetching user profiles:', profileError);
        toast.error('Failed to fetch user profiles');
        setUserProfiles([]);
      }

      // Calculate content metrics
      const totalUsers = userProfiles.length;
      const activeCategories = categories.filter(c => c.is_active).length;
      const recentRegistrations = userProfiles
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const metrics: ContentMetrics = {
        total_users: totalUsers,
        active_users: totalUsers, // Assuming all users are active for now
        total_categories: categories.length,
        active_categories: activeCategories,
        recent_registrations: recentRegistrations
      };

      setContentMetrics(metrics);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch content data');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryStatus = async (categoryId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', categoryId);

      if (error) {
        console.error('Error updating category:', error);
        toast.error('Failed to update category');
      } else {
        toast.success(`Category ${newStatus ? 'activated' : 'deactivated'} successfully`);
        fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const exportUsersReport = async () => {
    try {
      const csvContent = [
        ['Date Registered', 'User ID', 'Name', 'Email', 'Phone'].join(','),
        ...filteredProfiles.map(u => [
          new Date(u.created_at).toLocaleDateString(),
          u.id,
          u.full_name || 'Unknown',
          u.email || 'No email',
          u.phone || 'No phone'
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Users report exported successfully');
    } catch (error) {
      console.error('Error exporting users report:', error);
      toast.error('Failed to export users report');
    }
  };

  const filteredProfiles = userProfiles.filter(profile => {
    const matchesSearch = 
      profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          User Profiles
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Transaction Categories</h3>
            <p className="text-sm text-muted-foreground">
              {categories.length} categories total
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="p-3 rounded-xl shadow-sm"
                      style={{ backgroundColor: category.color + '20', border: `1px solid ${category.color}` }}
                    >
                      <div className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={category.is_active ? "default" : "secondary"} className="text-xs">
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCategoryStatus(category.id, !category.is_active)}
                      >
                        {category.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {category.transaction_count || 0} transactions
                    </Badge>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* User Profiles Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{contentMetrics?.total_users || 0}</div>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{contentMetrics?.active_users || 0}</div>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Export */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={exportUsersReport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Registered</TableHead>
                  <TableHead>User Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{profile.full_name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground font-mono">{profile.id.substring(0, 8)}...</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{profile.email || "No email"}</div>
                        <div className="text-sm text-muted-foreground">{profile.phone || "No phone"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedProfile(profile);
                          setShowProfileModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'metrics' && contentMetrics && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Content Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Users:</span>
                  <Badge variant="secondary">{contentMetrics.total_users}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Categories:</span>
                  <Badge variant="secondary">{contentMetrics.total_categories}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Active Categories:</span>
                  <Badge variant="default">{contentMetrics.active_categories}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contentMetrics.recent_registrations.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{user.full_name || "Unknown User"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Profile Details Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <p className="font-mono text-sm">{selectedProfile.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Registration Date</label>
                  <p>{new Date(selectedProfile.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <p>{selectedProfile.full_name || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p>{selectedProfile.email || "Not provided"}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Phone</label>
                  <p>{selectedProfile.phone || "Not provided"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;
