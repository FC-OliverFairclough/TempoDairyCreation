import React from "react";
import Layout from "./Layout";
import { Milk, Truck, Users, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-center">About Us</h1>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Delivering fresh dairy products to your doorstep since 1985
        </p>

        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Our Story</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="mb-4">
                Milkman Delivery started as a small family business in 1985 when
                John Miller, a third-generation dairy farmer, decided to bring
                back the traditional milkman service to his local community.
              </p>
              <p className="mb-4">
                What began with a single truck and a handful of loyal customers
                has grown into a beloved service that combines the nostalgia of
                doorstep dairy delivery with modern technology and convenience.
              </p>
              <p>
                Today, we're proud to serve thousands of households across the
                region, delivering not just milk but a wide range of fresh dairy
                products and local goods while maintaining the personal touch
                that has been our hallmark for over three decades.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1595150045251-33a7137bb9f5?w=800&q=80"
                alt="Vintage milk delivery truck"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Milk className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quality</h3>
              <p className="text-muted-foreground">
                We partner with local farms that share our commitment to quality
                and sustainable practices.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Reliability</h3>
              <p className="text-muted-foreground">
                Count on us for consistent, on-time deliveries that fit
                seamlessly into your routine.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-muted-foreground">
                We're proud to support local farmers and strengthen the
                community we serve.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Sustainability</h3>
              <p className="text-muted-foreground">
                Our reusable glass bottles and electric delivery vehicles
                minimize our environmental impact.
              </p>
            </div>
          </div>
        </div>

        {/* Our Team */}
        <div>
          <h2 className="text-2xl font-semibold mb-8 text-center">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                  alt="John Miller"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold">John Miller</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Founder & CEO
              </p>
              <p className="text-muted-foreground">
                Third-generation dairy farmer with a passion for quality dairy
                products and customer service.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                  alt="Sarah Johnson"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold">Sarah Johnson</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Operations Manager
              </p>
              <p className="text-muted-foreground">
                Ensures our delivery operations run smoothly and efficiently
                every day.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
                  alt="Michael Chen"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold">Michael Chen</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Product Specialist
              </p>
              <p className="text-muted-foreground">
                Curates our product selection and works directly with local
                farmers and producers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
