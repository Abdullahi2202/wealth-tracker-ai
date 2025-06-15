
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag, FileText, Image } from "lucide-react";

const ContentManagement = () => {
  const [categories] = useState([
    { id: 1, name: "Food & Dining", color: "#10B981", transactionCount: 245 },
    { id: 2, name: "Transportation", color: "#3B82F6", transactionCount: 189 },
    { id: 3, name: "Entertainment", color: "#8B5CF6", transactionCount: 156 },
    { id: 4, name: "Shopping", color: "#F59E0B", transactionCount: 298 },
    { id: 5, name: "Healthcare", color: "#EF4444", transactionCount: 87 },
    { id: 6, name: "Education", color: "#06B6D4", transactionCount: 134 },
  ]);

  const [contentItems] = useState([
    { id: 1, title: "Welcome Message", type: "text", status: "active", lastModified: "2024-01-15" },
    { id: 2, title: "Privacy Policy", type: "document", status: "active", lastModified: "2024-01-10" },
    { id: 3, title: "App Tutorial", type: "video", status: "draft", lastModified: "2024-01-12" },
    { id: 4, title: "Hero Banner", type: "image", status: "active", lastModified: "2024-01-14" },
    { id: 5, title: "Terms of Service", type: "document", status: "active", lastModified: "2024-01-08" },
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Content Management</h2>
        <p className="text-sm text-muted-foreground">Manage categories and app content</p>
      </div>

      {/* Categories Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction Categories</CardTitle>
            <p className="text-sm text-muted-foreground">Manage expense and income categories</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {category.transactionCount} transactions
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{contentItems.length}</div>
                <p className="text-sm text-muted-foreground">Content Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {contentItems.filter(item => item.status === 'active').length}
                </div>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {contentItems.filter(item => item.status === 'draft').length}
                </div>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>App Content</CardTitle>
            <p className="text-sm text-muted-foreground">Manage app messages, documents, and media</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getTypeIcon(item.type)}
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.lastModified}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentManagement;
