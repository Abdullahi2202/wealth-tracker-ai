
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User, NewUser } from "@/types/user";

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users for admin...');
      
      const { data: response, error } = await supabase.functions.invoke('user-management', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching users via edge function:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
        return;
      }

      console.log('Users fetched successfully:', response?.length || 0);
      
      const usersWithStatus = (response || []).map(user => ({
        ...user,
        verification_status: user.verification_status || 'pending'
      }));
      
      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserVerification = async (userId: string, status: string, userEmail: string) => {
    setActionLoading(`${userId}-${status}`);
    try {
      console.log('Updating user verification:', { userId, status, userEmail });
      
      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'PUT',
        body: {
          id: userId,
          email: userEmail,
          verification_status: status,
          action: 'update_verification'
        }
      });

      if (error) {
        console.error('Error updating user verification:', error);
        throw new Error(error.message || 'Failed to update verification status');
      }

      console.log('Verification update successful:', data);
      
      // Send notification to user
      await sendNotification(userEmail, status);
      
      toast({
        title: "Success",
        description: `User ${status === 'verified' ? 'approved' : 'rejected'} successfully`,
      });
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, verification_status: status }
            : user
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating user verification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user verification status",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const createUser = async (newUser: NewUser) => {
    if (!newUser.email || !newUser.full_name) {
      toast({
        title: "Error",
        description: "Email and full name are required",
        variant: "destructive",
      });
      return false;
    }

    setActionLoading('create-user');
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'POST',
        body: { ...newUser, action: 'create_user' }
      });

      if (error) {
        console.error('Error creating user:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return false;
    }

    setActionLoading(`delete-${userId}`);
    try {
      const { error } = await supabase.functions.invoke('user-management', {
        method: 'DELETE',
        body: { 
          id: userId, 
          email: userEmail,
          action: 'delete_user'
        }
      });

      if (error) {
        console.error('Error deleting user:', error);
        throw new Error(error.message || 'Failed to delete user');
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const sendNotification = async (userEmail: string, status: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          email: userEmail,
          type: 'verification_update',
          status: status,
          message: status === 'verified' 
            ? 'Your account has been approved and verified!' 
            : 'Your account verification has been rejected. Please contact support for more information.'
        }
      });

      if (error) {
        console.error('Error sending notification:', error);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    actionLoading,
    fetchUsers,
    updateUserVerification,
    createUser,
    deleteUser,
    sendNotification
  };
};
