
import { useState } from "react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

interface AddCardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Simulated "Add Card" drawer form */
export default function AddCardDrawer({ open, onOpenChange }: AddCardDrawerProps) {
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");
  const [loading, setLoading] = useState(false);
  const { addNewMethod } = usePaymentMethods();

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Enter a card label.");
      return;
    }
    if (!/^\d{4}$/.test(last4)) {
      toast.error("Card last 4 digits required.");
      return;
    }
    setLoading(true);
    try {
      await addNewMethod({
        type: "card",
        label,
        details: { last4 },
      });
      toast.success("Card added! You can select it for payments now.");
      setLabel("");
      setLast4("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to add card.");
    }
    setLoading(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <form onSubmit={handleAddCard} className="p-5 pt-0 space-y-4">
          <DrawerHeader>
            <DrawerTitle>Add Card</DrawerTitle>
            <DrawerDescription>
              Enter card display name and last four digits. This is a mock card and for demo only.
            </DrawerDescription>
          </DrawerHeader>
          <div>
            <label className="block text-sm mb-1">Card Label</label>
            <Input
              placeholder="My Visa Card"
              value={label}
              onChange={e => setLabel(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Card Last 4 Digits</label>
            <Input
              placeholder="1234"
              maxLength={4}
              value={last4}
              onChange={e => setLast4(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <DrawerFooter>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Adding..." : "Add Card"}</Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full" type="button">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
