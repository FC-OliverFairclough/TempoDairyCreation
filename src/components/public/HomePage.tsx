import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "./Layout";
import { Truck, Clock, ThumbsUp, CalendarCheck } from "lucide-react";

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Fresh Dairy Delivered <br />
              <span className="text-primary">Right To Your Door</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-md">
              Enjoy farm-fresh milk and dairy products delivered on your
              schedule. No more trips to the store for your essentials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/signup">Sign Up Now</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80"
              alt="Fresh milk bottles"
              className="rounded-lg shadow-lg w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Us?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Free Delivery</h3>
                <p className="text-muted-foreground">
                  We deliver to your doorstep at no extra cost within our
                  service area.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Flexible Schedule
                </h3>
                <p className="text-muted-foreground">
                  Choose delivery on Monday, Wednesday, or Friday that fits your
                  needs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <ThumbsUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
                <p className="text-muted-foreground">
                  All our products are sourced from local farms with the highest
                  standards.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <CalendarCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Recurring Orders</h3>
                <p className="text-muted-foreground">
                  Set up weekly deliveries and never worry about running out
                  again.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied customers who enjoy fresh dairy products
            delivered to their door.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">Create an Account</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
