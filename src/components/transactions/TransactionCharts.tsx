import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Home, Car, Gamepad2, Utensils, Heart, GraduationCap, 
         Lightbulb, Smartphone, Gift, TrendingUp, Briefcase, CreditCard, Plane } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Transaction {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  date: string;
  type: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface Category {
  name: string;
  color: string;
  icon: string;
}

// Use type assertion to prevent excessive type instantiation
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
} as Record<string, LucideIcon>;

// Fallback colors for legacy categories
const fallbackCategoryColors: Record<string, string> = {
  'Food': '#F59E0B',
  'Transport': '#8B5CF6',
  'Salary': '#22c55e',
  'Freelance': '#3b82f6',
  'Misc': '#6b7280',
};

const TransactionCharts = () => {
  const [incomeData, setIncomeData] = useState<ChartData[]>([]);
  const [expenseData, setExpenseData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      let email = "";
      const storedUser = localStorage.getItem("walletmaster_user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          email = userObj.email || "";
        } catch {}
      }
      
      if (!email) {
        setIncomeData([]);
        setExpenseData([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch categories from Supabase
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('name, color, icon')
          .eq('is_active', true);

        // Build category colors map
        const colorsMap: Record<string, string> = { ...fallbackCategoryColors };
        categoriesData?.forEach((category: Category) => {
          colorsMap[category.name] = category.color;
        });
        setCategoryColors(colorsMap);

        // Fetch transactions
        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("id, amount, category, type")
          .eq("email", email);

        if (!error && Array.isArray(transactions)) {
          // Process income and expense data
          const incomeMap: Record<string, number> = {};
          const expenseMap: Record<string, number> = {};

          transactions.forEach((tx: Transaction) => {
            const category = tx.category && colorsMap[tx.category] ? tx.category : "Miscellaneous";
            const amount = Number(tx.amount);
            
            if (tx.type === "income") {
              incomeMap[category] = (incomeMap[category] || 0) + amount;
            } else if (tx.type === "expense") {
              expenseMap[category] = (expenseMap[category] || 0) + amount;
            }
          });

          const incomeChartData = Object.entries(incomeMap).map(([name, value]) => ({
            name,
            value,
            color: colorsMap[name] || "#6b7280",
            icon: name,
          }));

          const expenseChartData = Object.entries(expenseMap).map(([name, value]) => ({
            name,
            value,
            color: colorsMap[name] || "#6b7280",
            icon: name,
          }));

          setIncomeData(incomeChartData);
          setExpenseData(expenseChartData);
        } else {
          setIncomeData([]);
          setExpenseData([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setIncomeData([]);
        setExpenseData([]);
      }
      
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || CreditCard;
    return <IconComponent className="h-4 w-4" />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="p-1 rounded"
              style={{ backgroundColor: data.color + '20', border: `1px solid ${data.color}` }}
            >
              {renderIcon(data.icon)}
            </div>
            <span className="font-medium">{data.name}</span>
          </div>
          <p className="text-sm">Amount: ${data.value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div 
              className="p-1 rounded"
              style={{ backgroundColor: entry.color + '20', border: `1px solid ${entry.color}` }}
            >
              {renderIcon(entry.payload.icon)}
            </div>
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = (data: ChartData[], title: string) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No {title.toLowerCase()} found.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-6">
      {renderChart(incomeData, "Income by Category")}
      {renderChart(expenseData, "Expenses by Category")}
    </div>
  );
};

export default TransactionCharts;
