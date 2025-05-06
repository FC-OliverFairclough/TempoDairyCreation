import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  createdAt: Date;
  role: "admin" | "user";
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address?: string;
  phone?: string;
}

/**
 * Login a user with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  // Sign in with Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("No user returned from authentication");
  }

  // Get the user profile from the users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!userData) {
    throw new Error("User profile not found");
  }

  // Return user data in the expected format
  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.first_name,
    lastName: userData.last_name,
    address: userData.address || "",
    phone: userData.phone || "",
    createdAt: new Date(userData.created_at),
    role: userData.role as "admin" | "user",
  };
};

/**
 * Register a new user
 */
export const signup = async (data: SignupData): Promise<User> => {
  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("No user returned from authentication");
  }

  // Create user profile in the users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert([
      {
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        address: data.address || "",
        phone: data.phone || "",
        role: "user", // Default role
      },
    ])
    .select()
    .single();

  if (userError) {
    // If there was an error creating the user profile, delete the auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(userError.message);
  }

  // Return user data in the expected format
  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.first_name,
    lastName: userData.last_name,
    address: userData.address || "",
    phone: userData.phone || "",
    createdAt: new Date(userData.created_at),
    role: userData.role as "admin" | "user",
  };
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Get the current logged in user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Get the user profile from the users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (userError || !userData) {
    return null;
  }

  // Return user data in the expected format
  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.first_name,
    lastName: userData.last_name,
    address: userData.address || "",
    phone: userData.phone || "",
    createdAt: new Date(userData.created_at),
    role: userData.role as "admin" | "user",
  };
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

/**
 * Check if user has admin role
 */
export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null && user.role === "admin";
};

/**
 * Get the user's role
 */
export const getUserRole = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user ? user.role : null;
};
