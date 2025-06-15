
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Home, Car, Gamepad2, Utensils, Heart, GraduationCap, 
         Lightbulb, Smartphone, Gift, TrendingUp, Briefcase, CreditCard, Plane } from "lucide-react";

interface CategoryOption {
  value: string;
  label: string;
  color: string;
  icon: string;
  description?: string;
}

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  showPreview?: boolean;
  className?: string;
}

const iconMap = {
  'Food & Dining': Utensils,
  'Shopping': ShoppingCart,
  'ShoppingCart': ShoppingCart,
  'Housing': Home,
  'Home': Home,
  'Transportation': Car,
  'Car': Car,
  'Entertainment': Gamepad2,
  'Gamepad2': Gamepad2,
  'Healthcare': Heart,
  'Heart': Heart,
  'Education': GraduationCap,
  'GraduationCap': GraduationCap,
  'Utilities': Lightbulb,
  'Lightbulb': Lightbulb,
  'Technology': Smartphone,
  'Smartphone': Smartphone,
  'Travel': Plane,
  'Plane': Plane,
  'Business': Briefcase,
  'Briefcase': Briefcase,
  'Gifts & Donations': Gift,
  'Gift': Gift,
  'Investment': TrendingUp,
  'TrendingUp': TrendingUp,
  'Miscellaneous': CreditCard,
  'CreditCard': CreditCard,
  'Utensils': Utensils,
};

export const renderCategoryIcon = (iconName: string, className = "h-4 w-4") => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap] || CreditCard;
  return <IconComponent className={className} />;
};

export default function CategorySelector({ 
  value, 
  onChange, 
  showPreview = true, 
  className = "" 
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories if fetch fails
        setCategories(FALLBACK_CATEGORIES);
      } else {
        const categoryOptions = data?.map(category => ({
          value: category.name,
          label: category.name,
          color: category.color,
          icon: category.icon,
          description: category.description
        })) || [];
        
        setCategories(categoryOptions);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.value === value);

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <select className="rounded-md border px-3 py-2 text-base bg-background w-full" disabled>
          <option>Loading categories...</option>
        </select>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border px-3 py-2 text-base bg-background w-full"
        required
      >
        {categories.map((cat) => (
          <option value={cat.value} key={cat.value}>{cat.label}</option>
        ))}
      </select>
      
      {/* Category Preview */}
      {showPreview && selectedCategory && (
        <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: selectedCategory.color + '20', border: `1px solid ${selectedCategory.color}` }}
          >
            {renderCategoryIcon(selectedCategory.icon)}
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium">{selectedCategory.label}</span>
            {selectedCategory.description && (
              <p className="text-xs text-muted-foreground">{selectedCategory.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback categories in case Supabase fetch fails
const FALLBACK_CATEGORIES: CategoryOption[] = [
  { value: "Food & Dining", label: "Food & Dining", color: "#F59E0B", icon: "Utensils", description: "Restaurants, groceries, and food delivery" },
  { value: "Shopping", label: "Shopping", color: "#EC4899", icon: "ShoppingCart", description: "Retail purchases and online shopping" },
  { value: "Housing", label: "Housing", color: "#06B6D4", icon: "Home", description: "Rent, mortgage, and home expenses" },
  { value: "Transportation", label: "Transportation", color: "#8B5CF6", icon: "Car", description: "Gas, public transit, and car expenses" },
  { value: "Entertainment", label: "Entertainment", color: "#10B981", icon: "Gamepad2", description: "Movies, games, and recreation" },
  { value: "Healthcare", label: "Healthcare", color: "#EF4444", icon: "Heart", description: "Medical expenses and insurance" },
  { value: "Education", label: "Education", color: "#6366F1", icon: "GraduationCap", description: "Tuition, books, and courses" },
  { value: "Utilities", label: "Utilities", color: "#84CC16", icon: "Lightbulb", description: "Electricity, water, and internet" },
  { value: "Technology", label: "Technology", color: "#3B82F6", icon: "Smartphone", description: "Gadgets, software, and tech services" },
  { value: "Travel", label: "Travel", color: "#F97316", icon: "Plane", description: "Flights, hotels, and vacation expenses" },
  { value: "Business", label: "Business", color: "#1F2937", icon: "Briefcase", description: "Work-related expenses and investments" },
  { value: "Gifts & Donations", label: "Gifts & Donations", color: "#DB2777", icon: "Gift", description: "Presents and charitable contributions" },
  { value: "Investment", label: "Investment", color: "#059669", icon: "TrendingUp", description: "Investments and savings" },
  { value: "Miscellaneous", label: "Miscellaneous", color: "#6B7280", icon: "CreditCard", description: "Other uncategorized expenses" },
];

export { FALLBACK_CATEGORIES as CATEGORY_OPTIONS };
