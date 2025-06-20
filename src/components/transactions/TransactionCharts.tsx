import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Home, Car, Gamepad2, Utensils, Heart, GraduationCap, 
         Lightbulb, Smartphone, Gift, TrendingUp, Briefcase, CreditCard, Plane } from "lucide-react";

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
        const colorsMap: Record<string, string> = {};
        Object.assign(colorsMap, fallbackCategoryColors);
        
        if (categoriesData) {
          categoriesData.forEach((category: any) => {
            colorsMap[category.name] = category.color;
          });
        }
        setCategoryColors(colorsMap);

        // Fetch transactions with NO complicated generic mapping
        const { data: rawTransactions, error } = await supabase
          .from("transactions")
          .select("id, amount, category, type");

        if (!error && Array.isArray(rawTransactions)) {
          // Explicitly type all raw transactions as 'any'
          const transactions: { amount: number; category: string | null; type: string }[] =
            rawTransactions.map((tx: any) => ({
              amount: Number(tx.amount),
              category: tx.category,
              type: tx.type
            }));

          // Use plain objects, no fancy generics
          const incomeCategories: Record<string, number> = {};
          const expenseCategories: Record<string, number> = {};

          transactions.forEach((tx) => {
            // Fallback to "Miscellaneous" if missing/legacy
            const categoryName = (tx.category && colorsMap[tx.category]) ? tx.category : "Miscellaneous";
            const amount = tx.amount;
            
            if (tx.type === "income") {
              incomeCategories[categoryName] = (incomeCategories[categoryName] || 0) + amount;
            } else if (tx.type === "expense") {
              expenseCategories[categoryName] = (expenseCategories[categoryName] || 0) + amount;
            }
          });

          // Build chart data (explicitly typed)
          const incomeChartData: ChartData[] = Object.keys(incomeCategories).map((categoryName) => ({
            name: categoryName,
            value: incomeCategories[categoryName],
            color: colorsMap[categoryName] || "#6b7280",
            icon: categoryName,
          }));

          const expenseChartData: ChartData[] = Object.keys(expenseCategories).map((categoryName) => ({
            name: categoryName,
            value: expenseCategories[categoryName],
            color: colorsMap[categoryName] || "#6b7280",
            icon: categoryName,
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

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Food & Dining':
      case 'Utensils':
        return Utensils;
      case 'Shopping':
      case 'ShoppingCart':
        return ShoppingCart;
      case 'Housing':
      case 'Home':
        return Home;
      case 'Transportation':
      case 'Car':
        return Car;
      case 'Entertainment':
      case 'Gamepad2':
        return Gamepad2;
      case 'Healthcare':
      case 'Heart':
        return Heart;
      case 'Education':
      case 'GraduationCap':
        return GraduationCap;
      case 'Utilities':
      case 'Lightbulb':
        return Lightbulb;
      case 'Technology':
      case 'Smartphone':
        return Smartphone;
      case 'Travel':
      case 'Plane':
        return Plane;
      case 'Business':
      case 'Briefcase':
        return Briefcase;
      case 'Gifts & Donations':
      case 'Gift':
        return Gift;
      case 'Investment':
      case 'TrendingUp':
        return TrendingUp;
      default:
        return CreditCard;
    }
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = getIconComponent(iconName);
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
