import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/authService";
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

export default function DeliveryPreferences() {
  const [user, setUser] = useState<any>(null);
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
    const currentUser = getCurrentUser();
    setUser(currentUser);
    // In a real app, we would fetch the user's delivery preferences here
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would update the delivery preferences via an API call
    console.log("Delivery preferences updated:", preferences);
    // Show success message
  };

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
            <Button onClick={handleSubmit} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
