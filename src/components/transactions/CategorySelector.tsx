
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
  'Housing': Home,
  'Transportation': Car,
  'Entertainment': Gamepad2,
  'Healthcare': Heart,
  'Education': GraduationCap,
  'Utilities': Lightbulb,
  'Technology': Smartphone,
  'Travel': Plane,
  'Business': Briefcase,
  'Gifts & Donations': Gift,
  'Investment': TrendingUp,
  'Miscellaneous': CreditCard,
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "Food & Dining", label: "Food & Dining", color: "#F59E0B", icon: "Food & Dining", description: "Restaurants, groceries, and food delivery" },
  { value: "Shopping", label: "Shopping", color: "#EC4899", icon: "Shopping", description: "Retail purchases and online shopping" },
  { value: "Housing", label: "Housing", color: "#06B6D4", icon: "Housing", description: "Rent, mortgage, and home expenses" },
  { value: "Transportation", label: "Transportation", color: "#8B5CF6", icon: "Transportation", description: "Gas, public transit, and car expenses" },
  { value: "Entertainment", label: "Entertainment", color: "#10B981", icon: "Entertainment", description: "Movies, games, and recreation" },
  { value: "Healthcare", label: "Healthcare", color: "#EF4444", icon: "Healthcare", description: "Medical expenses and insurance" },
  { value: "Education", label: "Education", color: "#6366F1", icon: "Education", description: "Tuition, books, and courses" },
  { value: "Utilities", label: "Utilities", color: "#84CC16", icon: "Utilities", description: "Electricity, water, and internet" },
  { value: "Technology", label: "Technology", color: "#3B82F6", icon: "Technology", description: "Gadgets, software, and tech services" },
  { value: "Travel", label: "Travel", color: "#F97316", icon: "Travel", description: "Flights, hotels, and vacation expenses" },
  { value: "Business", label: "Business", color: "#1F2937", icon: "Business", description: "Work-related expenses and investments" },
  { value: "Gifts & Donations", label: "Gifts & Donations", color: "#DB2777", icon: "Gifts & Donations", description: "Presents and charitable contributions" },
  { value: "Investment", label: "Investment", color: "#059669", icon: "Investment", description: "Investments and savings" },
  { value: "Miscellaneous", label: "Miscellaneous", color: "#6B7280", icon: "Miscellaneous", description: "Other uncategorized expenses" },
];

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
  const selectedCategory = CATEGORY_OPTIONS.find(cat => cat.value === value);

  return (
    <div className={`space-y-2 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border px-3 py-2 text-base bg-background w-full"
        required
      >
        {CATEGORY_OPTIONS.map((cat) => (
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
