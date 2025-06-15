
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, FolderOpen, Tag, Search, ShoppingCart, Home, Car, Gamepad2, 
         Utensils, Heart, GraduationCap, Lightbulb, Smartphone, Gift, TrendingUp, 
         Briefcase, CreditCard, Plane, Coffee, Music, Book, Shirt } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  transaction_count: number;
  created_at: string;
}

interface Setting {
  id: string;
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

const iconMap = {
  'Shopping': ShoppingCart,
  'Food': Utensils,
  'Housing': Home,
  'Transport': Car,
  'Entertainment': Gamepad2,
  'Healthcare': Heart,
  'Education': GraduationCap,
  'Utilities': Lightbulb,
  'Technology': Smartphone,
  'Gifts': Gift,
  'Investment': TrendingUp,
  'Business': Briefcase,
  'Misc': CreditCard,
  'Travel': Plane,
  'Coffee': Coffee,
  'Music': Music,
  'Books': Book,
  'Clothing': Shirt,
};

const predefinedCategories = [
  { name: 'Food & Dining', icon: 'Food', color: '#F59E0B', description: 'Restaurants, groceries, and food delivery' },
  { name: 'Shopping', icon: 'Shopping', color: '#EC4899', description: 'Retail purchases and online shopping' },
  { name: 'Housing', icon: 'Housing', color: '#06B6D4', description: 'Rent, mortgage, and home expenses' },
  { name: 'Transportation', icon: 'Transport', color: '#8B5CF6', description: 'Gas, public transit, and car expenses' },
  { name: 'Entertainment', icon: 'Entertainment', color: '#10B981', description: 'Movies, games, and recreation' },
  { name: 'Healthcare', icon: 'Healthcare', color: '#EF4444', description: 'Medical expenses and insurance' },
  { name: 'Education', icon: 'Education', color: '#6366F1', description: 'Tuition, books, and courses' },
  { name: 'Utilities', icon: 'Utilities', color: '#84CC16', description: 'Electricity, water, and internet' },
  { name: 'Technology', icon: 'Technology', color: '#3B82F6', description: 'Gadgets, software, and tech services' },
  { name: 'Travel', icon: 'Travel', color: '#F97316', description: 'Flights, hotels, and vacation expenses' },
  { name: 'Business', icon: 'Business', color: '#1F2937', description: 'Work-related expenses and investments' },
  { name: 'Gifts & Donations', icon: 'Gifts', color: '#DB2777', description: 'Presents and charitable contributions' },
];

const ContentManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "Misc"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch transaction categories with counts
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('category')
        .not('category', 'is', null);

      // Process categories from transactions
      const categoryStats = transactionData?.reduce((acc: Record<string, number>, transaction) => {
        const category = transaction.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}) || {};

      // Merge with predefined categories
      const categoryList = predefinedCategories.map((predef, index) => {
        const count = categoryStats[predef.name] || 0;
        return {
          id: `cat-${index}`,
          name: predef.name,
          description: predef.description,
          color: predef.color,
          icon: predef.icon,
          transaction_count: count,
          created_at: new Date().toISOString()
        };
      });

      // Add any custom categories from transactions that aren't predefined
      Object.entries(categoryStats).forEach(([name, count], index) => {
        if (!predefinedCategories.find(p => p.name === name)) {
          categoryList.push({
            id: `custom-${index}`,
            name,
            description: `Custom category: ${name}`,
            color: getColorForCategory(name),
            icon: 'Misc',
            transaction_count: count,
            created_at: new Date().toISOString()
          });
        }
      });

      setCategories(categoryList);

      // Fetch app settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .order('key', { ascending: true });

      setSettings(settingsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch content data');
    } finally {
      setLoading(false);
    }
  };

  const getColorForCategory = (name: string) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      // In a real app, you'd add this to a categories table
      const newCat = {
        id: `new-${Date.now()}`,
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        icon: newCategory.icon,
        transaction_count: 0,
        created_at: new Date().toISOString()
      };
      
      setCategories(prev => [...prev, newCat]);
      toast.success('Category added successfully');
      setNewCategory({ name: "", description: "", color: "#3B82F6", icon: "Misc" });
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || "",
      color: category.color,
      icon: category.icon
    });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const updatedCategories = categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...newCategory }
          : cat
      );
      
      setCategories(updatedCategories);
      toast.success('Category updated successfully');
      setEditingCategory(null);
      setNewCategory({ name: "", description: "", color: "#3B82F6", icon: "Misc" });
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const renderIcon = (iconName: string, className = "h-4 w-4") => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || CreditCard;
    return <IconComponent className={className} />;
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Transaction Categories</h2>
          <p className="text-sm text-muted-foreground">Manage transaction categories with icons and colors</p>
        </div>
        <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Category name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Icon</label>
                <select
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                >
                  {Object.keys(iconMap).map(iconName => (
                    <option key={iconName} value={iconName}>{iconName}</option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Preview:</span>
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: newCategory.color + '20', border: `1px solid ${newCategory.color}` }}
                  >
                    {renderIcon(newCategory.icon, "h-5 w-5")}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Category description"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowAddCategory(false);
                  setEditingCategory(null);
                  setNewCategory({ name: "", description: "", color: "#3B82F6", icon: "Misc" });
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div 
                  className="p-3 rounded-xl shadow-sm"
                  style={{ backgroundColor: category.color + '20', border: `1px solid ${category.color}` }}
                >
                  {renderIcon(category.icon, "h-6 w-6")}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{category.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {category.transaction_count} transactions
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

      {filteredCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No categories found</p>
        </div>
      )}

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setting</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-medium">{setting.key}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {typeof setting.value === 'object' 
                        ? JSON.stringify(setting.value) 
                        : String(setting.value)
                      }
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {setting.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    {setting.updated_at && format(new Date(setting.updated_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {settings.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No settings found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentManagement;
