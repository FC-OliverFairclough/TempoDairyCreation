import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CustomerStats {
  total: number;
  active: number;
  new: number;
  recurring: number;
}

const CustomerStatistics = () => {
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    active: 0,
    new: 0,
    recurring: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerStats = async () => {
      try {
        setLoading(true);

        // Get current date and first day of month for filtering
        const now = new Date();
        const firstDayOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        ).toISOString();

        // Get total customers count
        const { count: totalCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        // Get new customers this month
        const { count: newCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", firstDayOfMonth);

        // Get customers with orders
        const { data: customersWithOrders } = await supabase
          .from("orders")
          .select("user_id, recurring_delivery")
          .gte("created_at", firstDayOfMonth);

        // Count unique customers with orders this month
        const uniqueCustomers = new Set();
        const recurringCustomers = new Set();

        customersWithOrders?.forEach((order) => {
          if (order.user_id) {
            uniqueCustomers.add(order.user_id);
            if (order.recurring_delivery) {
              recurringCustomers.add(order.user_id);
            }
          }
        });

        setStats({
          total: totalCount || 0,
          active: uniqueCustomers.size,
          new: newCount || 0,
          recurring: recurringCustomers.size,
        });
      } catch (error) {
        console.error("Error fetching customer statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex flex-col items-center justify-center h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium">Total Customers</h3>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Registered users</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium">Active</h3>
          <p className="text-3xl font-bold">{stats.active}</p>
          <p className="text-sm text-muted-foreground">Ordered this month</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium">New</h3>
          <p className="text-3xl font-bold">{stats.new}</p>
          <p className="text-sm text-muted-foreground">This month</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium">Recurring</h3>
          <p className="text-3xl font-bold">{stats.recurring}</p>
          <p className="text-sm text-muted-foreground">Weekly deliveries</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerStatistics;
