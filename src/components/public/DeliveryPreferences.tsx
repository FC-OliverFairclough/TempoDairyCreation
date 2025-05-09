import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalendarDays, Clock, Save, Truck } from "lucide-react";
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
    timeSlot: "morning",
    specialInstructions: "",
    contactBeforeDelivery: false,
    leaveAtDoor: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
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
          setPreferences({
            deliveryDays: {
              monday: preferencesData.monday || false,
              wednesday: preferencesData.wednesday || true,
              friday: preferencesData.friday || true,
            },
            timeSlot: preferencesData.time_slot || "morning",
            specialInstructions: preferencesData.special_instructions || "",
            contactBeforeDelivery:
              preferencesData.contact_before_delivery || false,
            leaveAtDoor: preferencesData.leave_at_door || true,
          });
        }
      } catch (err) {
        console.error("Error in useEffect:", err);
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

  const handleTimeSlotChange = (value: string) => {
    setPreferences((prev) => ({
      ...prev,
      timeSlot: value,
    }));
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: checked,
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
      // Check if preferences already exist for this user
      const { data: existingPrefs, error: checkError } = await supabase
        .from("delivery_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let result;

      if (checkError && checkError.code === "PGRST116") {
        // No existing preferences, insert new record
        result = await supabase.from("delivery_preferences").insert([
          {
            user_id: user.id,
            monday: preferences.deliveryDays.monday,
            wednesday: preferences.deliveryDays.wednesday,
            friday: preferences.deliveryDays.friday,
            time_slot: preferences.timeSlot,
            special_instructions: preferences.specialInstructions,
            contact_before_delivery: preferences.contactBeforeDelivery,
            leave_at_door: preferences.leaveAtDoor,
          },
        ]);
      } else {
        // Update existing preferences
        result = await supabase
          .from("delivery_preferences")
          .update({
            monday: preferences.deliveryDays.monday,
            wednesday: preferences.deliveryDays.wednesday,
            friday: preferences.deliveryDays.friday,
            time_slot: preferences.timeSlot,
            special_instructions: preferences.specialInstructions,
            contact_before_delivery: preferences.contactBeforeDelivery,
            leave_at_door: preferences.leaveAtDoor,
            updated_at: new Date(),
          })
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
        <div className="flex items-center mb-8">
          <Truck className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-3xl font-bold">Delivery Preferences</h1>
        </div>

        <Card className="max-w-3xl mx-auto bg-card">
          <CardHeader>
            <CardTitle>Customize Your Deliveries</CardTitle>
            <CardDescription>
              Set your preferred delivery days, times, and special instructions
            </CardDescription>
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
                <Clock className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-medium">Preferred Time Slot</h3>
              </div>
              <RadioGroup
                value={preferences.timeSlot}
                onValueChange={handleTimeSlotChange}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="morning" id="morning" />
                  <Label htmlFor="morning">Morning (6am - 10am)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="midday" id="midday" />
                  <Label htmlFor="midday">Midday (10am - 2pm)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="afternoon" id="afternoon" />
                  <Label htmlFor="afternoon">Afternoon (2pm - 6pm)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium">Delivery Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="contact">Contact Before Delivery</Label>
                    <p className="text-sm text-muted-foreground">
                      We'll call or text you before arriving
                    </p>
                  </div>
                  <Switch
                    id="contact"
                    checked={preferences.contactBeforeDelivery}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("contactBeforeDelivery", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="leaveAtDoor">Leave at Door</Label>
                    <p className="text-sm text-muted-foreground">
                      We'll leave your order at the door if you're not home
                    </p>
                  </div>
                  <Switch
                    id="leaveAtDoor"
                    checked={preferences.leaveAtDoor}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("leaveAtDoor", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmit}
              className="w-full md:w-auto"
              disabled={loading}
            >
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
