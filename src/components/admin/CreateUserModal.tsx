
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewUser } from "@/types/user";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionLoading: string | null;
  onCreateUser: (user: NewUser) => Promise<boolean>;
}

export const CreateUserModal = ({ 
  isOpen, 
  onClose, 
  actionLoading, 
  onCreateUser 
}: CreateUserModalProps) => {
  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    full_name: "",
    phone: "",
    passport_number: "",
    document_type: "passport"
  });

  const handleCreateUser = async () => {
    const success = await onCreateUser(newUser);
    if (success) {
      onClose();
      setNewUser({
        email: "",
        full_name: "",
        phone: "",
        passport_number: "",
        document_type: "passport"
      });
    }
  };

  const handleClose = () => {
    onClose();
    setNewUser({
      email: "",
      full_name: "",
      phone: "",
      passport_number: "",
      document_type: "passport"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={newUser.full_name}
              onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone (Optional)</label>
            <Input
              value={newUser.phone}
              onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Passport Number (Optional)</label>
            <Input
              value={newUser.passport_number}
              onChange={(e) => setNewUser(prev => ({ ...prev, passport_number: e.target.value }))}
              placeholder="A12345678"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Document Type</label>
            <Select value={newUser.document_type} onValueChange={(value) => setNewUser(prev => ({ ...prev, document_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="national_id">National ID</SelectItem>
                <SelectItem value="driving_license">Driving License</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateUser}
              disabled={!newUser.email || !newUser.full_name || actionLoading === 'create-user'}
            >
              {actionLoading === 'create-user' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              ) : null}
              Create User
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
