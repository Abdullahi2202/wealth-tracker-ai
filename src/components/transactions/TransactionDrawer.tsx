
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CategorySelector from "./CategorySelector";

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

  const handleCategoryChange = (category: string) => {
    setForm((prev) => ({
      ...prev,
      category,
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
              <CategorySelector
                value={form.category}
                onChange={handleCategoryChange}
                showPreview={true}
              />
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
