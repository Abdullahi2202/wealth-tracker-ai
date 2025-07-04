
import { useState } from "react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserStatsCards } from "./UserStatsCards";
import { UserFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { UserDetailsModal } from "./UserDetailsModal";
import { CreateUserModal } from "./CreateUserModal";
import { User } from "@/types/user";

const UserManagement = () => {
  const {
    users,
    loading,
    actionLoading,
    updateUserVerification,
    createUser,
    deleteUser
  } = useUserManagement();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const viewDocument = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || user.verification_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleUpdateVerification = async (userId: string, status: string, email: string) => {
    const success = await updateUserVerification(userId, status, email);
    if (success && selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, verification_status: status } : null);
    }
    return success;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserStatsCards users={users} />
      
      <UserFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onCreateUser={() => setShowCreateModal(true)}
      />

      <UserTable
        users={filteredUsers}
        actionLoading={actionLoading}
        onViewUser={handleViewUser}
        onUpdateVerification={updateUserVerification}
        onDeleteUser={deleteUser}
        onViewDocument={viewDocument}
      />

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No users found matching your criteria.
        </div>
      )}

      <UserDetailsModal
        user={selectedUser}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        actionLoading={actionLoading}
        onUpdateVerification={handleUpdateVerification}
        onViewDocument={viewDocument}
      />

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        actionLoading={actionLoading}
        onCreateUser={createUser}
      />
    </div>
  );
};

export default UserManagement;
