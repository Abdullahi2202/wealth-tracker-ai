
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import StripeCardFormWrapper from "./StripeCardForm";

interface AddCardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** Real "Add Card" drawer using Stripe Elements */
export default function AddCardDrawer({ open, onOpenChange, onSuccess }: AddCardDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add a Card</DrawerTitle>
          <DrawerDescription>
            Enter card details securely. Your card info is always sent through Stripe and never stored on our servers.
          </DrawerDescription>
        </DrawerHeader>
        <StripeCardFormWrapper
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
        <DrawerFooter>
          <DrawerClose asChild>
            <button className="hidden" type="button" aria-label="Cancel"></button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
