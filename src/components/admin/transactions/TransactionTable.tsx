
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income": return "bg-green-100 text-green-800";
      case "expense": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatUserId = (userId: string) => {
    return userId ? userId.substring(0, 8) + '...' : 'N/A';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No transactions available
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatUserId(transaction.user_id)}
                </TableCell>
                <TableCell className="font-medium">{transaction.name}</TableCell>
                <TableCell>
                  <Badge className={getTypeColor(transaction.type)}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  ${Number(transaction.amount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.category || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {transaction.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => onUpdateStatus(transaction.id, 'completed')}
                          disabled={actionLoading === `status-${transaction.id}`}
                        >
                          {actionLoading === `status-${transaction.id}` ? 'Loading...' : 'Approve'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onUpdateStatus(transaction.id, 'rejected')}
                          disabled={actionLoading === `status-${transaction.id}`}
                        >
                          {actionLoading === `status-${transaction.id}` ? 'Loading...' : 'Reject'}
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onDelete(transaction.id)}
                      disabled={actionLoading === `delete-${transaction.id}`}
                    >
                      {actionLoading === `delete-${transaction.id}` ? 'Loading...' : 'Delete'}
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
