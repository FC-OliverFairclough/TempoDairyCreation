import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/services/supabaseAuthService";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  address?: string;
  phone?: string;
  role: "admin" | "user";
}

export function useUserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = await getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user profile",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUserProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to update the user profile in state after changes
  const updateUserState = async (updatedUser: Partial<UserProfile>) => {
    if (user) {
      try {
        // First update the database
        const { error } = await supabase
          .from("users")
          .update({
            first_name: updatedUser.firstName || user.firstName,
            last_name: updatedUser.lastName || user.lastName,
            email: updatedUser.email || user.email,
            phone: updatedUser.phone || user.phone,
            address: updatedUser.address || user.address,
            updated_at: new Date(),
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error updating user in database:", error);
          throw error;
        }

        // Then update local state
        const newUserState = { ...user, ...updatedUser };
        setUser(newUserState);

        // Also update localStorage
        localStorage.setItem("currentUser", JSON.stringify(newUserState));

        return { success: true };
      } catch (error) {
        console.error("Failed to update user profile:", error);
        return { success: false, error };
      }
    }
    return { success: false, error: "No user found" };
  };

  return { user, loading, error, updateUserState };
}
