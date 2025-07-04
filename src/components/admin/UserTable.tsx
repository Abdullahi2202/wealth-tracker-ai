
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, XCircle, Trash2, FileText, ExternalLink } from "lucide-react";
import { User } from "@/types/user";

interface UserTableProps {
  users: User[];
  actionLoading: string | null;
  onViewUser: (user: User) => void;
  onUpdateVerification: (userId: string, status: string, email: string) => void;
  onDeleteUser: (userId: string, email: string) => void;
  onViewDocument: (imageUrl: string) => void;
}

export const UserTable = ({ 
  users, 
  actionLoading, 
  onViewUser, 
  onUpdateVerification, 
  onDeleteUser,
  onViewDocument 
}: UserTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </TableCell>
              <TableCell>
                {user.phone && (
                  <div className="text-sm">{user.phone}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(user.verification_status)}>
                  {user.verification_status}
                </Badge>
              </TableCell>
              <TableCell>
                {user.documents && user.documents.length > 0 ? (
                  <div className="flex gap-1">
                    {user.documents.map((doc, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDocument(doc.image_url)}
                        className="flex items-center gap-1"
                        title={`View ${doc.type} document`}
                      >
                        <FileText className="h-3 w-3" />
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No documents</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewUser(user)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {user.verification_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 border-green-200"
                        onClick={() => onUpdateVerification(user.id, 'verified', user.email)}
                        disabled={actionLoading === `${user.id}-verified`}
                        title="Approve User"
                      >
                        {actionLoading === `${user.id}-verified` ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 border-red-200"
                        onClick={() => onUpdateVerification(user.id, 'rejected', user.email)}
                        disabled={actionLoading === `${user.id}-rejected`}
                        title="Reject User"
                      >
                        {actionLoading === `${user.id}-rejected` ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                  
                  {user.verification_status === 'verified' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => onUpdateVerification(user.id, 'rejected', user.email)}
                      disabled={actionLoading === `${user.id}-rejected`}
                      title="Reject User"
                    >
                      {actionLoading === `${user.id}-rejected` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  {user.verification_status === 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50 border-green-200"
                      onClick={() => onUpdateVerification(user.id, 'verified', user.email)}
                      disabled={actionLoading === `${user.id}-verified`}
                      title="Approve User"
                    >
                      {actionLoading === `${user.id}-verified` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 border-red-200"
                    onClick={() => onDeleteUser(user.id, user.email)}
                    disabled={actionLoading === `delete-${user.id}`}
                    title="Delete User"
                  >
                    {actionLoading === `delete-${user.id}` ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
