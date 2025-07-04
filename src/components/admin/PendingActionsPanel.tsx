
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, Clock, AlertTriangle } from "lucide-react";
import { User } from "@/types/user";

interface PendingActionsPanelProps {
  pendingUsers: User[];
  pendingTransactions: any[];
  onApproveUser: (userId: string, email: string) => void;
  onRejectUser: (userId: string, email: string) => void;
  onApproveTransaction: (transactionId: string) => void;
  onRejectTransaction: (transactionId: string) => void;
  onViewUser: (user: User) => void;
  actionLoading: string | null;
}

export const PendingActionsPanel = ({
  pendingUsers,
  pendingTransactions,
  onApproveUser,
  onRejectUser,
  onApproveTransaction,
  onRejectTransaction,
  onViewUser,
  actionLoading
}: PendingActionsPanelProps) => {
  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users');

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Pending Actions
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('users')}
          >
            Users ({pendingUsers.length})
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('transactions')}
          >
            Transactions ({pendingTransactions.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'users' && (
          <div className="space-y-3">
            {pendingUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending users</p>
            ) : (
              pendingUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <Badge variant="outline" className="mt-1">
                      {user.verification_status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewUser(user)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onApproveUser(user.id, user.email)}
                      disabled={actionLoading === `${user.id}-verified`}
                    >
                      {actionLoading === `${user.id}-verified` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRejectUser(user.id, user.email)}
                      disabled={actionLoading === `${user.id}-rejected`}
                    >
                      {actionLoading === `${user.id}-rejected` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-3">
            {pendingTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending transactions</p>
            ) : (
              pendingTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">${transaction.amount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">{transaction.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onApproveTransaction(transaction.id)}
                      disabled={actionLoading === `update-${transaction.id}`}
                    >
                      {actionLoading === `update-${transaction.id}` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRejectTransaction(transaction.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
