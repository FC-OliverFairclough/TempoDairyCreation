import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Layout from "./Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, Home, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function ProfileEdit() {
  const { user, updateUserState } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "", // Street address
    city: "", // City/Town
    county: "", // County (changed from state for UK)
    postcode: "", // Postcode (changed from zipCode for UK)
  });

  useEffect(() => {
    if (user) {
      // If user exists, populate the form with their data
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "", // These fields might not be in the user object
        county: user.county || "", // We'll need to fetch them separately if needed
        postcode: user.postcode || "",
      });

      // Fetch additional address details if needed
      const fetchAddressDetails = async () => {
        try {
          const { data: profileData, error } = await supabase
            .from("users")
            .select("city, county, postcode")
            .eq("id", user.id)
            .single();

          if (!error && profileData) {
            setFormData((prev) => ({
              ...prev,
              city: profileData.city || "",
              county: profileData.county || "",
              postcode: profileData.postcode || "",
            }));
          }
        } catch (err) {
          console.error("Error fetching address details:", err);
        }
      };

      fetchAddressDetails();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update the user profile in the database
      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          county: formData.county, // Changed from state to county
          postcode: formData.postcode, // Changed from zipCode to postcode
          updated_at: new Date(),
        })
        .eq("id", user.id);

      console.log("Profile update response:", { error });

      if (error) throw error;

      // Update the auth user email if it has changed
      if (formData.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (authError) throw authError;
      }

      // We'll handle the database update directly here instead of through updateUserState
      // to ensure we can update all fields including city, county, and postcode

      // Just update the local state
      updateUserState({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        phone: formData.phone,
        city: formData.city,
        county: formData.county,
        postcode: formData.postcode,
      });

      toast({
        title: "Success",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-center text-lg">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <User className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        <Card className="max-w-3xl mx-auto bg-card">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Personal Details</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      <span>Email</span>
                    </div>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      <span>Phone Number</span>
                    </div>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </TabsContent>
              <TabsContent value="address" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="address">
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-1" />
                      <span>Street Address</span>
                    </div>
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City/Town</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Input
                      id="county"
                      name="county"
                      value={formData.county}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmit}
              className="w-full md:w-auto"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
