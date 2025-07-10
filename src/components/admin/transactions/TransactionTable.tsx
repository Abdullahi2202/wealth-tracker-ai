
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Calendar, DollarSign } from "lucide-react";

type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  category: string;
  note: string;
  user_email?: string;
  user_name?: string;
  user_phone?: string;
};

interface TransactionTableProps {
  transactions: Transaction[];
  actionLoading: string | null;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const TransactionTable = ({ 
  transactions, 
  actionLoading, 
  onUpdateStatus, 
  onDelete 
}: TransactionTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income": return "bg-green-50 text-green-700 border-green-200";
      case "expense": return "bg-red-50 text-red-700 border-red-200";
      case "transfer": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatUserId = (userId: string) => {
    return userId ? userId.substring(0, 8) + '...' : 'N/A';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-b border-border/50 hover:bg-transparent">
            <TableHead className="font-semibold text-foreground h-12">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Date & Time
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                User Info
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground">Transaction Details</TableHead>
            <TableHead className="font-semibold text-foreground">Type</TableHead>
            <TableHead className="font-semibold text-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Amount
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground">Status</TableHead>
            <TableHead className="font-semibold text-foreground">Category</TableHead>
            <TableHead className="font-semibold text-foreground text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-16 bg-muted/20">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">No transactions to display</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Transactions will appear here once users start making payments, transfers, or other financial activities.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction, index) => (
              <TableRow 
                key={transaction.id} 
                className="group hover:bg-muted/30 transition-colors duration-150 border-b border-border/30"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-mono text-sm text-muted-foreground py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground text-xs">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-xs opacity-75">
                      {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">
                          {transaction.user_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {formatUserId(transaction.user_id)}
                        </p>
                      </div>
                    </div>
                    {(transaction.user_email || transaction.user_phone) && (
                      <div className="space-y-1 pl-10">
                        {transaction.user_email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{transaction.user_email}</span>
                          </div>
                        )}
                        {transaction.user_phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{transaction.user_phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{transaction.name}</p>
                    {transaction.note && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{transaction.note}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge 
                    variant="secondary" 
                    className={`${getTypeColor(transaction.type)} font-medium`}
                  >
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      transaction.type === 'income' 
                        ? 'text-emerald-600' 
                        : transaction.type === 'expense' 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'}${Number(transaction.amount).toFixed(2)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(transaction.status)} font-medium border-2`}
                  >
                    <span className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${
                        transaction.status === 'completed' ? 'bg-emerald-500' :
                        transaction.status === 'pending' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}></div>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-xs font-medium text-muted-foreground">
                    {transaction.category || 'Uncategorized'}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center justify-center gap-2">
                    {transaction.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                          onClick={() => onUpdateStatus(transaction.id, 'completed')}
                          disabled={actionLoading === `status-${transaction.id}`}
                        >
                          {actionLoading === `status-${transaction.id}` ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                          ) : (
                            'Approve'
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-8 px-3 shadow-sm hover:shadow-md transition-all duration-200"
                          onClick={() => onUpdateStatus(transaction.id, 'rejected')}
                          disabled={actionLoading === `status-${transaction.id}`}
                        >
                          {actionLoading === `status-${transaction.id}` ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                          ) : (
                            'Reject'
                          )}
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all duration-200"
                      onClick={() => onDelete(transaction.id)}
                      disabled={actionLoading === `delete-${transaction.id}`}
                    >
                      {actionLoading === `delete-${transaction.id}` ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600/30 border-t-red-600"></div>
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionTable;
