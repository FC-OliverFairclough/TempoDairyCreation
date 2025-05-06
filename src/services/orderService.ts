import { supabase } from "@/lib/supabase";

interface OrderItem {
  id?: string;
  product_id: string;
  quantity: number;
  price: number;
}

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderData {
  user_id: string;
  total_amount: number;
  payment_method: string;
  delivery_address: DeliveryAddress;
  delivery_date?: Date;
  notes?: string;
  items: OrderItem[];
}

/**
 * Create a new order in the database
 */
export const createOrder = async (orderData: OrderData): Promise<string> => {
  try {
    // First, create the order record
    const { data: orderRecord, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: orderData.user_id,
          total_amount: orderData.total_amount,
          payment_method: orderData.payment_method,
          delivery_address: orderData.delivery_address,
          delivery_date: orderData.delivery_date,
          notes: orderData.notes,
          payment_status: "paid", // Assuming payment is processed before this call
          delivery_status: "processing",
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    if (!orderRecord) {
      throw new Error("No order record returned after creation");
    }

    // Then, create order items for each product in the order
    const orderItems = orderData.items.map((item) => ({
      order_id: orderRecord.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // If there was an error creating order items, delete the order to maintain consistency
      await supabase.from("orders").delete().eq("id", orderRecord.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    return orderRecord.id;
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
};

/**
 * Get order details by ID
 */
export const getOrderById = async (orderId: string) => {
  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) {
      throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        id,
        quantity,
        price,
        products (id, title, image_url)
      `,
      )
      .eq("order_id", orderId);

    if (itemsError) {
      throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    return {
      ...order,
      items: orderItems,
    };
  } catch (error) {
    console.error("Error in getOrderById:", error);
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ delivery_status: status })
      .eq("id", orderId);

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    throw error;
  }
};

export const signup = async (data: SignupData): Promise<User> => {
  console.log("Signing up user:", data.email);

  try {
    // First, create the auth user
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
      console.error("Auth signup error:", authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error("No user returned from authentication");
    }

    console.log("Auth user created:", authData.user.id);

    // Now, explicitly create a profile in the users table
    const { error: profileError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || "",
        address: data.address || "",
        role: "user",
      },
    ]);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // If profile creation fails, we should ideally clean up the auth user
      // but this requires admin privileges
      throw new Error("Failed to create user profile: " + profileError.message);
    }

    console.log("User profile created successfully");

    // Create user object to return
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

    // Store in localStorage
    localStorage.setItem("currentUser", JSON.stringify(user));

    return user;
  } catch (error) {
    console.error("Signup process failed:", error);
    throw error;
  }
};

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    console.log("Login attempt:", credentials.email);

    // First authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error("No user returned from authentication");
    }

    console.log("Auth successful, user ID:", authData.user.id);

    // Then try to get the user profile
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (userError) {
      console.error("Error fetching user profile:", userError);

      // Create a user record if one doesn't exist
      console.log("Creating missing user profile");
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email: authData.user.email,
          first_name: authData.user.user_metadata?.first_name || "User",
          last_name: authData.user.user_metadata?.last_name || "",
          role: "user",
        },
      ]);

      if (insertError) {
        console.error("Failed to create user profile:", insertError);
        throw new Error("Failed to create user profile");
      }

      // Try to fetch the profile again
      const { data: newUserData, error: newFetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (newFetchError || !newUserData) {
        throw new Error("Failed to fetch user profile");
      }

      // Use the newly created profile
      return {
        id: newUserData.id,
        email: newUserData.email,
        firstName: newUserData.first_name,
        lastName: newUserData.last_name,
        address: newUserData.address || "",
        phone: newUserData.phone || "",
        createdAt: new Date(newUserData.created_at),
        role: newUserData.role,
      };
    }

    if (!userData) {
      throw new Error("User profile not found");
    }

    // Create and return the user object
    const user = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      address: userData.address || "",
      phone: userData.phone || "",
      createdAt: new Date(userData.created_at),
      role: userData.role,
    };

    // Store in localStorage
    localStorage.setItem("currentUser", JSON.stringify(user));

    return user;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
};
