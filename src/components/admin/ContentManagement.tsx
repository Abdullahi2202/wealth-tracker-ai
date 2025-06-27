
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

interface UserContent {
  id: string;
  user_id: string;
  content_type: string;
  title: string;
  content: string;
  status: 'active' | 'flagged' | 'removed';
  created_at: string;
  updated_at: string;
  moderation_notes?: string;
  user_email?: string;
  user_name?: string;
  reports_count?: number;
}

interface ContentMetrics {
  total_content: number;
  active_content: number;
  flagged_content: number;
  removed_content: number;
  most_active_users: Array<{
    user_id: string;
    user_name: string;
    content_count: number;
  }>;
}

const ContentManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [userContent, setUserContent] = useState<UserContent[]>([]);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContent, setSelectedContent] = useState<UserContent | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationNotes, setModerationNotes] = useState("");
  const [activeTab, setActiveTab] = useState<'categories' | 'content' | 'metrics'>('categories');

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

      // For demo purposes, we'll create mock user content since there's no content table yet
      // In a real app, you'd fetch from actual content tables
      const mockUserContent: UserContent[] = [
        {
          id: '1',
          user_id: 'user1',
          content_type: 'comment',
          title: 'Payment feedback',
          content: 'Great payment experience!',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_email: 'user1@example.com',
          user_name: 'John Doe',
          reports_count: 0
        },
        {
          id: '2',
          user_id: 'user2',
          content_type: 'review',
          title: 'Service review',
          content: 'This service needs improvement...',
          status: 'flagged',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_email: 'user2@example.com',
          user_name: 'Jane Smith',
          reports_count: 2,
          moderation_notes: 'Reported for negative content'
        }
      ];

      setUserContent(mockUserContent);

      // Calculate content metrics
      const metrics: ContentMetrics = {
        total_content: mockUserContent.length,
        active_content: mockUserContent.filter(c => c.status === 'active').length,
        flagged_content: mockUserContent.filter(c => c.status === 'flagged').length,
        removed_content: mockUserContent.filter(c => c.status === 'removed').length,
        most_active_users: [
          { user_id: 'user1', user_name: 'John Doe', content_count: 5 },
          { user_id: 'user2', user_name: 'Jane Smith', content_count: 3 }
        ]
      };

      setContentMetrics(metrics);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch content data');
    } finally {
      setLoading(false);
    }
  };

  const updateContentStatus = async (contentId: string, newStatus: 'active' | 'flagged' | 'removed', notes?: string) => {
    try {
      // In a real app, you'd update the actual content table
      setUserContent(prev => prev.map(content => 
        content.id === contentId 
          ? { 
              ...content, 
              status: newStatus, 
              moderation_notes: notes || content.moderation_notes,
              updated_at: new Date().toISOString()
            }
          : content
      ));

      toast.success(`Content ${newStatus} successfully`);
      setShowModerationModal(false);
      setModerationNotes("");
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Failed to update content');
    }
  };

  const deleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this content?')) {
      return;
    }

    try {
      // In a real app, you'd delete from the actual content table
      setUserContent(prev => prev.filter(content => content.id !== contentId));
      toast.success('Content deleted successfully');
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const exportContentReport = async () => {
    try {
      const csvContent = [
        ['Date', 'Content ID', 'User', 'Type', 'Title', 'Status', 'Reports', 'Notes'].join(','),
        ...filteredContent.map(c => [
          new Date(c.created_at).toLocaleDateString(),
          c.id,
          c.user_name || c.user_email || 'Unknown',
          c.content_type,
          c.title,
          c.status,
          c.reports_count || 0,
          c.moderation_notes || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Content report exported successfully');
    } catch (error) {
      console.error('Error exporting content report:', error);
      toast.error('Failed to export content report');
    }
  };

  const filteredContent = userContent.filter(content => {
    const matchesSearch = 
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || content.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "flagged": return "bg-yellow-100 text-yellow-800";
      case "removed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'content'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          User Content
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
                    <Badge variant={category.is_active ? "default" : "secondary"} className="text-xs">
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
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

      {/* User Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {/* Content Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{contentMetrics?.total_content || 0}</div>
                <p className="text-xs text-muted-foreground">Total Content</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{contentMetrics?.active_content || 0}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{contentMetrics?.flagged_content || 0}</div>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{contentMetrics?.removed_content || 0}</div>
                <p className="text-xs text-muted-foreground">Removed</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportContentReport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Content Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell>
                      {new Date(content.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{content.user_name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">{content.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{content.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {content.content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{content.content_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(content.status)}>
                        {content.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {content.reports_count || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedContent(content);
                            setShowContentModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedContent(content);
                            setShowModerationModal(true);
                          }}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteContent(content.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
          
          <Card>
            <CardHeader>
              <CardTitle>Most Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentMetrics.most_active_users.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{user.user_name}</div>
                      <div className="text-sm text-muted-foreground">User ID: {user.user_id}</div>
                    </div>
                    <Badge variant="secondary">{user.content_count} posts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Details Modal */}
      <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Details</DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <p>{selectedContent.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Badge variant="outline">{selectedContent.content_type}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">User</label>
                  <p>{selectedContent.user_name || selectedContent.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedContent.status)}>
                    {selectedContent.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <p className="text-sm bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                  {selectedContent.content}
                </p>
              </div>
              {selectedContent.moderation_notes && (
                <div>
                  <label className="text-sm font-medium">Moderation Notes</label>
                  <p className="text-sm bg-yellow-50 p-3 rounded-md">
                    {selectedContent.moderation_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Moderation Modal */}
      <Dialog open={showModerationModal} onOpenChange={setShowModerationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderate Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Moderation Notes</label>
              <Textarea
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder="Add moderation notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => selectedContent && updateContentStatus(selectedContent.id, 'active', moderationNotes)}
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>
              <Button 
                onClick={() => selectedContent && updateContentStatus(selectedContent.id, 'flagged', moderationNotes)}
                variant="outline"
              >
                <Flag className="h-4 w-4 mr-2" />
                Flag
              </Button>
              <Button 
                onClick={() => selectedContent && updateContentStatus(selectedContent.id, 'removed', moderationNotes)}
                variant="destructive"
              >
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;
