// Mock authentication service

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

// Mock user database
const users: User[] = [
  {
    id: "1",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    address: "123 Milk Street, Dairy City",
    phone: "(123) 456-7890",
    createdAt: new Date("2023-01-15"),
    role: "user",
  },
  {
    id: "2",
    email: "admin@milkman.com",
    firstName: "Admin",
    lastName: "User",
    address: "456 Admin Street, Dairy City",
    phone: "(123) 456-7891",
    createdAt: new Date("2023-01-10"),
    role: "admin",
  },
];

// Mock current user session
let currentUser: User | null = null;

/**
 * Login a user with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user = users.find((u) => u.email === credentials.email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // In a real app, we would verify the password hash here
  // For this mock, we'll just assume the password is correct if the email exists

  // Set the current user
  currentUser = user;

  // Store in localStorage to persist the session
  localStorage.setItem("currentUser", JSON.stringify(user));

  return user;
};

/**
 * Register a new user
 */
export const signup = async (data: SignupData): Promise<User> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check if user already exists
  if (users.find((u) => u.email === data.email)) {
    throw new Error("User with this email already exists");
  }

  // Create new user
  const newUser: User = {
    id: String(users.length + 1),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    address: data.address || "",
    phone: data.phone || "",
    createdAt: new Date(),
    role: "user", // New users are always regular users by default
  };

  // Add to mock database
  users.push(newUser);

  // Set as current user
  currentUser = newUser;

  // Store in localStorage
  localStorage.setItem("currentUser", JSON.stringify(newUser));

  return newUser;
};

/**
 * Logout the current user
 */
export const logout = (): void => {
  currentUser = null;
  localStorage.removeItem("currentUser");
};

/**
 * Get the current logged in user
 */
export const getCurrentUser = (): User | null => {
  if (currentUser) {
    return currentUser;
  }

  // Try to get from localStorage
  const storedUser = localStorage.getItem("currentUser");
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      currentUser = {
        ...parsedUser,
        createdAt: new Date(parsedUser.createdAt),
      };
      return currentUser;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      localStorage.removeItem("currentUser");
    }
  }

  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

/**
 * Check if user has admin role
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user !== null && user.role === "admin";
};

/**
 * Get the user's role
 */
export const getUserRole = (): string | null => {
  const user = getCurrentUser();
  return user ? user.role : null;
};
