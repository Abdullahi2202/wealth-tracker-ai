
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Home, Car, Gamepad2, Utensils, Heart, GraduationCap, 
         Lightbulb, Smartphone, Gift, TrendingUp, Briefcase, CreditCard, Plane } from "lucide-react";

interface TransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: {
    id?: string;
    name: string;
    amount: number;
    type: string;
    category: string;
    date: string;
  };
  onSaved?: () => void;
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

const CATEGORY_OPTIONS = [
  { value: "Food & Dining", label: "Food & Dining", color: "#F59E0B", icon: "Food & Dining" },
  { value: "Shopping", label: "Shopping", color: "#EC4899", icon: "Shopping" },
  { value: "Housing", label: "Housing", color: "#06B6D4", icon: "Housing" },
  { value: "Transportation", label: "Transportation", color: "#8B5CF6", icon: "Transportation" },
  { value: "Entertainment", label: "Entertainment", color: "#10B981", icon: "Entertainment" },
  { value: "Healthcare", label: "Healthcare", color: "#EF4444", icon: "Healthcare" },
  { value: "Education", label: "Education", color: "#6366F1", icon: "Education" },
  { value: "Utilities", label: "Utilities", color: "#84CC16", icon: "Utilities" },
  { value: "Technology", label: "Technology", color: "#3B82F6", icon: "Technology" },
  { value: "Travel", label: "Travel", color: "#F97316", icon: "Travel" },
  { value: "Business", label: "Business", color: "#1F2937", icon: "Business" },
  { value: "Gifts & Donations", label: "Gifts & Donations", color: "#DB2777", icon: "Gifts & Donations" },
  { value: "Investment", label: "Investment", color: "#059669", icon: "Investment" },
  { value: "Miscellaneous", label: "Miscellaneous", color: "#6B7280", icon: "Miscellaneous" },
];

const TYPE_OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" }
];

export default function TransactionDrawer({
  open,
  onOpenChange,
  transaction,
  onSaved,
}: TransactionDrawerProps) {
  const [form, setForm] = useState(() =>
    transaction
      ? { ...transaction }
      : { name: "", amount: 0, type: "expense", category: "Food & Dining", date: new Date().toISOString().slice(0, 10) }
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let email = "";
    const storedUser = localStorage.getItem("walletmaster_user");
    if (storedUser) {
      try {
        const obj = JSON.parse(storedUser);
        email = obj.email || "";
      } catch {}
    }
    if (!email) {
      toast.error("No user found!");
      setLoading(false);
      return;
    }
    const txData = {
      name: form.name,
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
      email,
    };
    let resp;
    if (transaction?.id) {
      resp = await supabase.from("transactions").update(txData).eq("id", transaction.id);
    } else {
      resp = await supabase.from("transactions").insert([txData]);
    }
    if (!resp.error) {
      toast.success("Transaction saved!");
      onSaved?.();
      onOpenChange(false);
    } else {
      toast.error("Error saving transaction.");
    }
    setLoading(false);
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || CreditCard;
    return <IconComponent className="h-4 w-4" />;
  };

  const selectedCategory = CATEGORY_OPTIONS.find(cat => cat.value === form.category);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <DrawerHeader>
            <DrawerTitle>{transaction ? "Edit Transaction" : "Add Transaction"}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-3">
            <Input
              name="name"
              placeholder="What's this for?"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Input
              name="amount"
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
              required
              min={0.01}
              step={0.01}
            />
            <select
              name="type"
              className="rounded-md border px-3 py-2 text-base bg-background"
              value={form.type}
              onChange={handleChange}
              required
            >
              {TYPE_OPTIONS.map((opt) => (
                <option value={opt.value} key={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            {/* Enhanced Category Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                name="category"
                className="rounded-md border px-3 py-2 text-base bg-background w-full"
                value={form.category}
                onChange={handleChange}
                required
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option value={cat.value} key={cat.value}>{cat.label}</option>
                ))}
              </select>
              
              {/* Category Preview */}
              {selectedCategory && (
                <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: selectedCategory.color + '20', border: `1px solid ${selectedCategory.color}` }}
                  >
                    {renderIcon(selectedCategory.icon)}
                  </div>
                  <span className="text-sm font-medium">{selectedCategory.label}</span>
                </div>
              )}
            </div>
            
            <Input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {transaction ? "Save Changes" : "Add Transaction"}
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" type="button" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
