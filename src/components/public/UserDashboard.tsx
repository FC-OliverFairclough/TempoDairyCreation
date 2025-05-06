import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "@/services/authService";
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
} from "lucide-react";

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  linkText: string;
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const dashboardCards: DashboardCard[] = [
    {
      title: "Order History",
      description: "View your past orders and track current deliveries",
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

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
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
