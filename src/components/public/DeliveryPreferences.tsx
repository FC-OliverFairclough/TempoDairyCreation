import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import Layout from "./Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CalendarDays, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function DeliveryPreferences() {
  const { user } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    deliveryDays: {
      monday: false,
      wednesday: true,
      friday: true,
    },
    saved_address: "",
    delivery_notes: "",
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // Fetch the user's delivery preferences
        const { data: preferencesData, error } = await supabase
          .from("delivery_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching delivery preferences:", error);
          return;
        }

        // If preferences exist, update the state with existing data
        if (preferencesData) {
          // Handle both formats: specific columns or preferred_days array
          const monday =
            preferencesData.monday ||
            (preferencesData.preferred_days &&
              preferencesData.preferred_days.includes("monday"));
          const wednesday =
            preferencesData.wednesday ||
            (preferencesData.preferred_days &&
              preferencesData.preferred_days.includes("wednesday"));
          const friday =
            preferencesData.friday ||
            (preferencesData.preferred_days &&
              preferencesData.preferred_days.includes("friday"));

          setPreferences({
            deliveryDays: {
              monday: monday || false,
              wednesday: wednesday || true,
              friday: friday || true,
            },
            saved_address: preferencesData.saved_address || "",
            delivery_notes: preferencesData.delivery_notes || "",
          });
        }
      } catch (err) {
        console.error("Error in useEffect:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const handleDayToggle = (day: string) => {
    setPreferences((prev) => ({
      ...prev,
      deliveryDays: {
        ...prev.deliveryDays,
        [day]: !prev.deliveryDays[day as keyof typeof prev.deliveryDays],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description:
          "You must be logged in to update your delivery preferences",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Convert boolean object to string array for preferred_days
      const preferredDays: string[] = [];
      if (preferences.deliveryDays.monday) preferredDays.push("monday");
      if (preferences.deliveryDays.wednesday) preferredDays.push("wednesday");
      if (preferences.deliveryDays.friday) preferredDays.push("friday");

      // Check if preferences already exist for this user
      const { data: existingPrefs, error: checkError } = await supabase
        .from("delivery_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // Prepare the data for insert/update based on your table structure
      const preferencesData = {
        user_id: user.id,
        preferred_days: preferredDays,
        monday: preferences.deliveryDays.monday,
        wednesday: preferences.deliveryDays.wednesday,
        friday: preferences.deliveryDays.friday,
        time_slot: "11pm - 7am",
        saved_address: preferences.saved_address,
        delivery_notes: preferences.delivery_notes,
        updated_at: new Date(),
      };

      let result;

      if (checkError && checkError.code === "PGRST116") {
        // No existing preferences, insert new record
        result = await supabase
          .from("delivery_preferences")
          .insert([preferencesData]);
      } else {
        // Update existing preferences
        result = await supabase
          .from("delivery_preferences")
          .update(preferencesData)
          .eq("user_id", user.id);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: "Your delivery preferences have been updated successfully",
      });
    } catch (error) {
      console.error("Error updating delivery preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery preferences. Please try again.",
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
            <p className="text-center text-lg">Loading your preferences...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex items-center"
          >
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex items-center mb-8">
          <CalendarDays className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-3xl font-bold">Delivery Preferences</h1>
        </div>

        <Card className="max-w-3xl mx-auto bg-card">
          <CardHeader>
            <CardTitle>Customize Your Deliveries</CardTitle>
            <CardDescription>Set your preferred delivery days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-medium">Delivery Days</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Select which days you'd like your dairy products delivered
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="monday"
                    checked={preferences.deliveryDays.monday}
                    onCheckedChange={() => handleDayToggle("monday")}
                  />
                  <Label htmlFor="monday">Monday</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wednesday"
                    checked={preferences.deliveryDays.wednesday}
                    onCheckedChange={() => handleDayToggle("wednesday")}
                  />
                  <Label htmlFor="wednesday">Wednesday</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="friday"
                    checked={preferences.deliveryDays.friday}
                    onCheckedChange={() => handleDayToggle("friday")}
                  />
                  <Label htmlFor="friday">Friday</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <h3 className="text-lg font-medium">Delivery Time</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Your delivery will arrive between 11pm - 7am
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link to="/dashboard">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
