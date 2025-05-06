import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/services/supabaseAuthService";
import Layout from "./Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Package,
  Settings,
  ShoppingCart,
  User,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  linkText: string;
}

interface OrderSummary {
  count: number;
  pending: number;
  delivered: number;
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    count: 0,
    pending: 0,
    delivered: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          // Redirect to login if not authenticated
          navigate("/login");
          return;
        }
        setUser(currentUser);

        // Fetch order summary for this user
        if (currentUser.id) {
          const { data: orders, error } = await supabase
            .from("orders")
            .select("delivery_status")
            .eq("user_id", currentUser.id);

          if (!error && orders) {
            const pending = orders.filter(
              (o) =>
                o.delivery_status === "pending" ||
                o.delivery_status === "processing",
            ).length;
            const delivered = orders.filter(
              (o) => o.delivery_status === "delivered",
            ).length;
            setOrderSummary({
              count: orders.length,
              pending,
              delivered,
            });
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [navigate]);

  const dashboardCards: DashboardCard[] = [
    {
      title: "Order History",
      description: `${orderSummary.count} orders, ${orderSummary.pending} pending`,
      icon: <Package className="h-8 w-8 text-primary" />,
      link: "/order-history",
      linkText: "View Orders",
    },
    {
      title: "Profile Settings",
      description: "Update your personal information and preferences",
      icon: <User className="h-8 w-8 text-primary" />,
      link: "/profile",
      linkText: "Edit Profile",
    },
    {
      title: "Delivery Preferences",
      description: "Set your preferred delivery days and times",
      icon: <CalendarDays className="h-8 w-8 text-primary" />,
      link: "/delivery-preferences",
      linkText: "Manage Deliveries",
    },
    {
      title: "Shop Products",
      description: "Browse our catalog and add items to your cart",
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      link: "/products",
      linkText: "Shop Now",
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Please log in to view your dashboard</p>
          <Button asChild className="mt-4">
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your orders, profile, and delivery preferences from your
            dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => (
            <Card key={index} className="bg-card">
              <CardHeader>
                <div className="mb-2">{card.icon}</div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={card.link}>{card.linkText}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
