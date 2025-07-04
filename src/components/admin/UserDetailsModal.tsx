
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, XCircle, FileText, ExternalLink } from "lucide-react";
import { User } from "@/types/user";

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  actionLoading: string | null;
  onUpdateVerification: (userId: string, status: string, email: string) => Promise<boolean>;
  onViewDocument: (imageUrl: string) => void;
}

export const UserDetailsModal = ({ 
  user, 
  isOpen, 
  onClose, 
  actionLoading, 
  onUpdateVerification,
  onViewDocument 
}: UserDetailsModalProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateVerification = async (status: string) => {
    if (!user) return;
    const success = await onUpdateVerification(user.id, status, user.email);
    if (success) {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View detailed information about this user and manage their verification status
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <p>{user.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p>{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <p>{user.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Badge className={getStatusColor(user.verification_status)}>
                {user.verification_status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium">Joined</label>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium">User ID</label>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
          </div>
          
          {user.documents && user.documents.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Documents</label>
              <div className="space-y-2">
                {user.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium">{doc.type.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-gray-600">Number: {doc.number}</p>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDocument(doc.image_url)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4 border-t">
            {user.verification_status === 'pending' && (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  onClick={() => handleUpdateVerification('verified')}
                  disabled={actionLoading === `${user.id}-verified`}
                >
                  {actionLoading === `${user.id}-verified` ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve User
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleUpdateVerification('rejected')}
                  disabled={actionLoading === `${user.id}-rejected`}
                >
                  {actionLoading === `${user.id}-rejected` ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject User
                </Button>
              </>
            )}
            
            {user.verification_status === 'verified' && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleUpdateVerification('rejected')}
                disabled={actionLoading === `${user.id}-rejected`}
              >
                {actionLoading === `${user.id}-rejected` ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject User
              </Button>
            )}
            
            {user.verification_status === 'rejected' && (
              <Button
                className="bg-green-600 hover:bg-green-700 flex-1"
                onClick={() => handleUpdateVerification('verified')}
                disabled={actionLoading === `${user.id}-verified`}
              >
                {actionLoading === `${user.id}-verified` ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve User
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
