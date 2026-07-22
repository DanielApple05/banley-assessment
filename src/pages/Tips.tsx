import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalculationService,
  type TipCalculation,
} from "@/services/calculation.service";
import {
  RestaurantService,
  type Restaurant,
} from "@/services/restaurant.service";
import { Plus, Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Tips() {
  const [calculations, setCalculations] = useState<TipCalculation[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalculateSheetOpen, setIsCalculateSheetOpen] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [billAmount, setBillAmount] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("1");
  const [selectedFilter, setSelectedFilter] = useState<number | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCalculation, setSelectedCalculation] =
    useState<TipCalculation | null>(null);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const formatCurrency = (currency: string | undefined, amount: number) =>
    `${currency ?? ""} ${amount.toFixed(2)}`;

  const getRestaurant = (restaurantId: number) => {
    return restaurants.find((restaurant) => restaurant.id === restaurantId);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const calcService = new CalculationService();
      const restaurantService = new RestaurantService();

      const calculationsData = await calcService.findAll();
      const restaurantsData = await restaurantService.findAll();

      setCalculations(calculationsData);
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  //Auto update Tip on-edit
  useEffect(() => {
    if (!selectedCalculation) return;

    const restaurant = getRestaurant(selectedCalculation.restaurantId);

    if (!restaurant) return;

    const totalTip =
      (selectedCalculation.billAmount * restaurant.tipPercentage) / 100;

    const totalBill = selectedCalculation.billAmount + totalTip;

    const perPerson = totalBill / selectedCalculation.numberOfPeople;

    setSelectedCalculation({
      ...selectedCalculation,
      totalTip,
      totalBill,
      perPerson,
    });
  }, [selectedCalculation?.billAmount, selectedCalculation?.numberOfPeople]);

  const filteredCalculations =
    selectedFilter === null
      ? calculations
      : calculations.filter(
          (calculation) => calculation.restaurantId === selectedFilter,
        );

  const totalTips = filteredCalculations.reduce(
    (sum, calc) => sum + calc.totalTip,
    0,
  );

  const totalVisits = filteredCalculations.length;

  const averageTipAmount = totalVisits > 0 ? totalTips / totalVisits : 0;

  const handleCalculateAndSave = async () => {
    try {
      setCalculating(true)
      if (!selectedRestaurantId) {
        toast.warning("Please select a restaurant.");
        return;
      }

      const restaurant = getRestaurant(selectedRestaurantId);

      if (!restaurant) {
        toast.error("Restaurant not found.");
        return;
      }

      if (Number(billAmount) <= 0) {
        toast.warning("Bill amount must be greater than 0.");
        return;
      }

      if (Number(numberOfPeople) <= 0) {
        toast.warning("Number of people must be at least 1.");
        return;
      }

      const bill = Number(billAmount);
      const people = Number(numberOfPeople);

      const totalTip = (bill * restaurant.tipPercentage) / 100;
      const totalBill = bill + totalTip;
      const perPerson = Math.round(totalBill / people);

      const calcService = new CalculationService();

      await calcService.create({
        restaurantId: restaurant.id!,
        billAmount: bill,
        tipPercentage: restaurant.tipPercentage,
        numberOfPeople: people,
        totalTip,
        totalBill,
        perPerson,
        createdAt: new Date().toISOString(),
      });

      toast.success("Tip calculation saved.");

      setIsCalculateSheetOpen(false);

      setSelectedRestaurantId(null);
      setBillAmount("");
      setNumberOfPeople("1");

      await loadData();
    } catch (error) {
      toast.warning("Failed to add tip");
    } finally {
      setCalculating(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      if (!selectedCalculation?.id) return;

      const restaurant = getRestaurant(selectedCalculation.restaurantId);

      if (!restaurant) return;

      const totalTip =
        (selectedCalculation.billAmount * restaurant.tipPercentage) / 100;

      const totalBill = selectedCalculation.billAmount + totalTip;

      const perPerson = (totalBill / selectedCalculation.numberOfPeople);

      const calcService = new CalculationService();

      await calcService.update(selectedCalculation.id, {
        ...selectedCalculation,
        totalTip,
        totalBill,
        perPerson,
      });

      toast.success("Tip updated successfully.");

      setIsEditMode(false);
      setIsViewSheetOpen(false);
      await loadData();
    } catch (error) {
      toast.warning("Failed to updated tips.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this tip?",
    );

    if (!confirmed) return;

    const calcService = new CalculationService();

    await calcService.delete(id);

    toast.success("Tip deleted.");

    setIsViewSheetOpen(false);
    setSelectedCalculation(null);

    await loadData();
    if (filteredCalculations.length === 1 && selectedFilter !== null) {
      setSelectedFilter(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tips</h2>
          <p className="text-muted-foreground">
            View all tip calculations and history.
          </p>
        </div>

        <Button onClick={() => setIsCalculateSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Calculate Tip
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Tips"
          value={loading ? undefined : totalTips.toFixed(2)}
          description="Sum of all tip amounts"
          loading={loading}
        />

        <StatCard
          title="Average Tip Amount"
          value={loading ? undefined : averageTipAmount.toFixed(2)}
          description="Average tip per visit"
          loading={loading}
        />

        <StatCard
          title="Total Visits"
          value={loading ? undefined : totalVisits}
          description="Total tip calculations"
          loading={loading}
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          className="rounded-md border px-3 py-2"
          value={selectedFilter ?? ""}
          onChange={(e) =>
            setSelectedFilter(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">All Restaurants</option>

          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>

        {selectedFilter !== null && (
          <Button variant="outline" onClick={() => setSelectedFilter(null)}>
            Clear Filter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tip History</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Bill</TableHead>
                <TableHead>Tip %</TableHead>
                <TableHead>Total Tip</TableHead>
                <TableHead>Per Person</TableHead>
                <TableHead>People</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : filteredCalculations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No tip calculations found. Calculate your first restaurant
                    tip.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCalculations.map((calculation) => {
                  const restaurant = getRestaurant(calculation.restaurantId);

                  return (
                    <TableRow key={calculation.id}>
                      <TableCell>
                        {new Date(calculation.createdAt).toLocaleDateString()}
                      </TableCell>

                      <TableCell>{restaurant?.name}</TableCell>

                      <TableCell>
                        {formatCurrency(
                          restaurant?.currency,
                          calculation.billAmount,
                        )}
                      </TableCell>

                      <TableCell>{calculation.tipPercentage}%</TableCell>

                      <TableCell>
                        {restaurant?.currency} {calculation.totalTip}
                      </TableCell>

                      <TableCell>
                        {restaurant?.currency} {calculation.perPerson}
                      </TableCell>

                      <TableCell>{calculation.numberOfPeople}</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCalculation(calculation);
                                setIsEditMode(false);
                                setIsViewSheetOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCalculation(calculation);
                                setIsEditMode(true);
                                setIsViewSheetOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() =>
                                calculation.id && handleDelete(calculation.id)
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isCalculateSheetOpen} onOpenChange={setIsCalculateSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Calculate Tip</SheetTitle>
            <SheetDescription>
              Calculate and save a new restaurant tip.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4 px-4">
            <div className="space-y-2">
              <Label>Restaurant</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={selectedRestaurantId ?? ""}
                onChange={(e) =>
                  setSelectedRestaurantId(Number(e.target.value))
                }
              >
                <option value="">Select a restaurant</option>

                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} 
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Bill Amount</Label>
              <Input
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tip Percentage</Label>
              <Input
                readOnly
                value={
                  getRestaurant(selectedRestaurantId ?? 0)?.tipPercentage ?? ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Number of People</Label>

              <Input
                type="number"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleCalculateAndSave}>
             { calculating ? "calculating" : "Calculate & Save" }
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{isEditMode ? "Edit Tip" : "View Tip"}</SheetTitle>

            <SheetDescription>
              {isEditMode
                ? "Update this tip calculation."
                : "View tip calculation details."}
            </SheetDescription>
          </SheetHeader>

          {selectedCalculation && (
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label>Restaurant</Label>
                <Input
                  disabled
                  value={
                    getRestaurant(selectedCalculation.restaurantId)?.name ?? ""
                  }
                />
              </div>

              <div className="flex justify-between gap-5">
                <div className="space-y-2">
                  <Label>Tip Percentage</Label>
                  <Input disabled value={selectedCalculation.tipPercentage} />
                </div>

                <div className="space-y-2">
                  <Label>Total Tip</Label>
                  <Input disabled value={selectedCalculation.totalTip} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>People</Label>
                <Input
                  type="number"
                  disabled={!isEditMode}
                  value={selectedCalculation.numberOfPeople}
                  onChange={(e) =>
                    setSelectedCalculation({
                      ...selectedCalculation,
                      numberOfPeople: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Per Person</Label>
                <Input disabled value={selectedCalculation.perPerson} />
              </div>

              <div className="flex justify-between gap-5">
                <div className="space-y-2">
                  <Label>Bill Amount</Label>
                  <Input
                    type="number"
                    disabled={!isEditMode}
                    value={selectedCalculation.billAmount}
                    onChange={(e) =>
                      setSelectedCalculation({
                        ...selectedCalculation,
                        billAmount: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Bill</Label>
                  <Input disabled value={selectedCalculation.totalBill} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {isEditMode ? (
                  <Button
                    className="flex-1"
                    onClick={handleUpdate}
                    disabled={!selectedCalculation}
                  >
                    {saving ? "saving..." : "save changes"}
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={() => setIsEditMode(true)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() =>
                    selectedCalculation?.id &&
                    handleDelete(selectedCalculation.id)
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    (setIsViewSheetOpen(false), setIsEditMode(false));
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value?: string | number;
  description: string;
  loading: boolean;
}

function StatCard({ title, value, description, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
