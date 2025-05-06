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
