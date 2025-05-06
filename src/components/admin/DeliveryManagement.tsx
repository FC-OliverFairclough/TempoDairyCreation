import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Save,
  X,
  Check,
} from "lucide-react";

const DeliveryManagement = () => {
  // State for delivery zones
  const [origin, setOrigin] = useState({ lat: 51.505, lng: -0.09 }); // Default London coordinates
  const [radius, setRadius] = useState(5); // Default radius in km

  // State for delivery schedule
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [deliveryDays, setDeliveryDays] = useState({
    monday: true,
    wednesday: true,
    friday: true,
  });
  const [cutoffTime, setCutoffTime] = useState("17:00"); // Default 5:00 PM

  // Handler for blocking a date
  const handleBlockDate = () => {
    if (date) {
      setBlockedDates([...blockedDates, date]);
    }
  };

  // Handler for unblocking a date
  const handleUnblockDate = (dateToRemove: Date) => {
    setBlockedDates(
      blockedDates.filter(
        (d) =>
          d.getDate() !== dateToRemove.getDate() ||
          d.getMonth() !== dateToRemove.getMonth() ||
          d.getFullYear() !== dateToRemove.getFullYear(),
      ),
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Delivery Management</h1>

      <Tabs defaultValue="zones">
        <TabsList className="mb-4">
          <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
          <TabsTrigger value="schedule">Delivery Schedule</TabsTrigger>
        </TabsList>

        {/* Delivery Zones Tab */}
        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Zone Configuration</CardTitle>
              <CardDescription>
                Set your delivery origin point and maximum delivery radius.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="h-[400px] bg-gray-100 rounded-md mb-4 flex items-center justify-center">
                  {/* This would be replaced with actual Google Maps integration */}
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto text-primary mb-2" />
                    <p className="text-muted-foreground">
                      Google Maps would be integrated here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Current Origin: {origin.lat.toFixed(4)},{" "}
                      {origin.lng.toFixed(4)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Delivery Radius: {radius} km
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Origin Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      value={origin.lat}
                      onChange={(e) =>
                        setOrigin({
                          ...origin,
                          lat: parseFloat(e.target.value),
                        })
                      }
                      step="0.0001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Origin Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      value={origin.lng}
                      onChange={(e) =>
                        setOrigin({
                          ...origin,
                          lng: parseFloat(e.target.value),
                        })
                      }
                      step="0.0001"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="radius">Delivery Radius (km)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="radius"
                      type="number"
                      value={radius}
                      onChange={(e) => setRadius(parseFloat(e.target.value))}
                      min="1"
                      max="50"
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      kilometers
                    </span>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Zone Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Schedule Management</CardTitle>
              <CardDescription>
                Configure regular delivery days, block specific dates, and set
                order cutoff times.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Regular Delivery Days
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="monday" className="flex items-center">
                        <span>Monday</span>
                      </Label>
                      <Switch
                        id="monday"
                        checked={deliveryDays.monday}
                        onCheckedChange={(checked) =>
                          setDeliveryDays({ ...deliveryDays, monday: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="wednesday" className="flex items-center">
                        <span>Wednesday</span>
                      </Label>
                      <Switch
                        id="wednesday"
                        checked={deliveryDays.wednesday}
                        onCheckedChange={(checked) =>
                          setDeliveryDays({
                            ...deliveryDays,
                            wednesday: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="friday" className="flex items-center">
                        <span>Friday</span>
                      </Label>
                      <Switch
                        id="friday"
                        checked={deliveryDays.friday}
                        onCheckedChange={(checked) =>
                          setDeliveryDays({ ...deliveryDays, friday: checked })
                        }
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <h3 className="text-lg font-medium mb-4">
                    Order Cutoff Time
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="cutoff">Cutoff Time</Label>
                      <Input
                        id="cutoff"
                        type="time"
                        value={cutoffTime}
                        onChange={(e) => setCutoffTime(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Clock className="h-5 w-5 text-muted-foreground mb-2 ml-2" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Orders placed after this time will be scheduled for the next
                    available delivery day.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Block Specific Dates
                  </h3>
                  <div className="mb-4">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="border rounded-md p-3"
                      disabled={blockedDates}
                    />
                  </div>

                  <div className="flex gap-2 mb-6">
                    <Button onClick={handleBlockDate} disabled={!date}>
                      Block Selected Date
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">Manage Blocked Dates</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Blocked Delivery Dates
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            These dates are currently unavailable for delivery.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="max-h-[300px] overflow-y-auto py-4">
                          {blockedDates.length > 0 ? (
                            <div className="space-y-2">
                              {blockedDates.map((blockedDate, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-muted p-2 rounded-md"
                                >
                                  <span>
                                    {blockedDate.toLocaleDateString()}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleUnblockDate(blockedDate)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground">
                              No blocked dates
                            </p>
                          )}
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Close</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Current Delivery Schedule
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Monday:</span>
                        {deliveryDays.monday ? (
                          <Badge
                            variant="secondary"
                            className="flex items-center"
                          >
                            <Check className="h-3 w-3 mr-1" /> Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="flex items-center"
                          >
                            <X className="h-3 w-3 mr-1" /> Unavailable
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Wednesday:</span>
                        {deliveryDays.wednesday ? (
                          <Badge
                            variant="secondary"
                            className="flex items-center"
                          >
                            <Check className="h-3 w-3 mr-1" /> Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="flex items-center"
                          >
                            <X className="h-3 w-3 mr-1" /> Unavailable
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Friday:</span>
                        {deliveryDays.friday ? (
                          <Badge
                            variant="secondary"
                            className="flex items-center"
                          >
                            <Check className="h-3 w-3 mr-1" /> Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="flex items-center"
                          >
                            <X className="h-3 w-3 mr-1" /> Unavailable
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm">Order Cutoff:</span>
                        <Badge>{cutoffTime}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Blocked Dates:</span>
                        <Badge>{blockedDates.length}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-6">
                <Save className="mr-2 h-4 w-4" />
                Save Schedule Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryManagement;
