
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
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date & Time
              </div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                User Info
              </div>
            </TableHead>
            <TableHead className="font-semibold">Transaction</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount
              </div>
            </TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Category</TableHead>
            <TableHead className="font-semibold text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-gray-300 mb-2">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="font-medium">No transactions available</p>
                  <p className="text-sm">Transactions will appear here when users make them</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-sm">
                  {formatDate(transaction.created_at)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="font-medium">
                        {transaction.user_name || 'Unknown User'}
                      </span>
                    </div>
                    {transaction.user_email && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {transaction.user_email}
                      </div>
                    )}
                    {transaction.user_phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {transaction.user_phone}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 font-mono">
                      ID: {formatUserId(transaction.user_id)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{transaction.name}</div>
                    {transaction.note && (
                      <div className="text-sm text-gray-500 mt-1">{transaction.note}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getTypeColor(transaction.type)}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-lg">
                  <span className={transaction.type === 'income' ? 'text-green-600' : transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'}>
                    {transaction.type === 'expense' ? '-' : '+'}${Number(transaction.amount).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(transaction.status)}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {transaction.category || 'Uncategorized'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-center">
                    {transaction.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white px-3"
                          onClick={() => onUpdateStatus(transaction.id, 'completed')}
                          disabled={actionLoading === `status-${transaction.id}`}
                        >
                          {actionLoading === `status-${transaction.id}` ? '...' : 'Approve'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="px-3"
                          onClick={() => onUpdateStatus(transaction.id, 'rejected')}
                          disabled={actionLoading === `status-${transaction.id}`}
                        >
                          {actionLoading === `status-${transaction.id}` ? '...' : 'Reject'}
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="px-3 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onDelete(transaction.id)}
                      disabled={actionLoading === `delete-${transaction.id}`}
                    >
                      {actionLoading === `delete-${transaction.id}` ? '...' : 'Delete'}
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
