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

  // Create user object with role information
  const user = {
    id: userData.id,
    email: userData.email,
    firstName: userData.first_name,
    lastName: userData.last_name,
    address: userData.address || "",
    phone: userData.phone || "",
    createdAt: new Date(userData.created_at),
    role: userData.role as "admin" | "user",
  };

  // Store user data in localStorage for persistence
  localStorage.setItem("currentUser", JSON.stringify(user));

  return user;
};

/**
 * Register a new user
 */
export const signup = async (data: SignupData): Promise<User> => {
  console.log("Attempting to sign up user:", data.email);

  try {
    // Step 1: Create the user in Supabase Auth
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
      console.error("Error during auth signup:", authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      console.error("No user returned from auth signup");
      throw new Error("Failed to create user account");
    }

    console.log("User created in Auth:", authData.user.id);

    // Step 2: Add the user to your users table
    const { error: profileError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
        address: data.address || null,
        role: "user",
      },
    ]);

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      // You would ideally clean up the auth user here, but it requires admin privileges
      throw new Error("Failed to create user profile");
    }

    console.log("User profile created successfully");

    // Step 3: Create and return the user object
    const user = {
      id: authData.user.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address || "",
      phone: data.phone || "",
      createdAt: new Date(),
      role: "user",
    };

    // Store in localStorage for session management
    localStorage.setItem("currentUser", JSON.stringify(user));

    return user;
  } catch (error) {
    console.error("Signup process failed:", error);
    throw error;
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  localStorage.removeItem("currentUser");
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Get the current logged in user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  // Try to get from localStorage first for immediate response
  const storedUser = localStorage.getItem("currentUser");
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      return {
        ...parsedUser,
        createdAt: new Date(parsedUser.createdAt),
      };
    } catch (error) {
      console.error("Error parsing stored user:", error);
      localStorage.removeItem("currentUser");
    }
  }

  // If not in localStorage or parsing failed, check with Supabase
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

  // Create and store user object
  const user = {
    id: userData.id,
    email: userData.email,
    firstName: userData.first_name,
    lastName: userData.last_name,
    address: userData.address || "",
    phone: userData.phone || "",
    createdAt: new Date(userData.created_at),
    role: userData.role as "admin" | "user",
  };

  localStorage.setItem("currentUser", JSON.stringify(user));

  return user;
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
