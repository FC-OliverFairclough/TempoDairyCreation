import { supabase } from "@/lib/supabase";

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  name?: string;
}

export interface OrderData {
  user_id: string;
  delivery_address: string;
  delivery_date: string;
  total_amount: number;
  items: OrderItem[];
  payment_status?: string;
  delivery_status?: string;
  notes?: string;
}

/**
 * Create a new order with all related items
 */
export async function createOrder(orderData: OrderData): Promise<string> {
  try {
    // First, create the order record
    const { data: orderRecord, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: orderData.user_id,
          delivery_address: orderData.delivery_address,
          delivery_date: orderData.delivery_date,
          total_amount: orderData.total_amount,
          payment_status: orderData.payment_status || "pending",
          delivery_status: orderData.delivery_status || "processing",
          notes: orderData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
      subtotal: item.price * item.quantity,
      created_at: new Date().toISOString(),
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
}

/**
 * Get order details by ID
 */
export async function getOrderById(orderId: string) {
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
      .select("*, products:product_id (id, name, image_url)")
      .eq("order_id", orderId);

    if (itemsError) {
      throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    return {
      ...order,
      items: orderItems || [],
    };
  } catch (error) {
    console.error("Error in getOrderById:", error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  type: "payment" | "delivery" = "delivery",
): Promise<void> {
  try {
    const updateField =
      type === "payment" ? "payment_status" : "delivery_status";

    const { error } = await supabase
      .from("orders")
      .update({
        [updateField]: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error updating ${type} status:`, error);
    throw error;
  }
}
