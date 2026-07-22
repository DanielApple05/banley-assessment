import { useEffect, useState } from "react";
import {
  CalculationService,
  type TipCalculation,
} from "@/services/calculation.service";
import {
  RestaurantService,
  type Restaurant,
} from "@/services/restaurant.service";
import { Plus } from "lucide-react";
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

  const totalTips = calculations.reduce((sum, calc) => sum + calc.totalTip, 0);

  const totalVisits = calculations.length;

  const averageTipAmount = totalVisits > 0 ? totalTips / totalVisits : 0;
  
  const filteredCalculations =
    selectedFilter === null
      ? calculations
      : calculations.filter(
          (calculation) => calculation.restaurantId === selectedFilter,
        );

  const handleCalculateAndSave = async () => {
    if (!selectedRestaurantId) {
      alert("Please select a restaurant.");
      return;
    }

    const restaurant = getRestaurant(selectedRestaurantId);

    if (!restaurant) {
      alert("Restaurant not found.");
      return;
    }

    const bill = Number(billAmount);
    const people = Number(numberOfPeople);

    const totalTip = (bill * restaurant.tipPercentage) / 100;
    const totalBill = bill + totalTip;
    const perPerson = totalBill / people;

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

    setIsCalculateSheetOpen(false);

    setSelectedRestaurantId(null);
    setBillAmount("");
    setNumberOfPeople("1");

    await loadData();
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
              {filteredCalculations.map((calculation) => {
                const restaurant = getRestaurant(calculation.restaurantId);

                return (
                  <TableRow key={calculation.id}>
                    <TableCell>
                      {new Date(calculation.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell>{restaurant?.name}</TableCell>

                    <TableCell>
                      {restaurant?.currency} {calculation.billAmount}
                    </TableCell>

                    <TableCell>{calculation.tipPercentage}%</TableCell>

                    <TableCell>
                      {restaurant?.currency} {calculation.totalTip}
                    </TableCell>

                    <TableCell>
                      {restaurant?.currency} {calculation.perPerson}
                    </TableCell>

                    <TableCell>{calculation.numberOfPeople}</TableCell>

                    <TableCell className="text-right">Actions</TableCell>
                  </TableRow>
                );
              })}
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
              Calculate & Save
            </Button>
          </div>
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
