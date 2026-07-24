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
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Receipt,
  Users,
  TrendingUp,
  UtensilsCrossed,
  ListFilter,
  X,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

import { formatDateShort, formatDateTime } from "@/lib/date-helpers";

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
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

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

  const filteredCalculations = (
    selectedFilter === null
      ? calculations
      : calculations.filter((calc) => calc.restaurantId === selectedFilter)
  ).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const totalTips = filteredCalculations.reduce(
    (sum, calc) => sum + calc.totalTip,
    0,
  );

  const totalPages = Math.ceil(filteredCalculations.length / ITEMS_PER_PAGE);

  const paginatedCalculations = filteredCalculations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const totalVisits = filteredCalculations.length;

  const averageTipAmount = totalVisits > 0 ? totalTips / totalVisits : 0;

  const handleCalculateAndSave = async () => {
    try {
      setCalculating(true);
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
        updatedAt: "",
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

      if (selectedCalculation.numberOfPeople  <= 0 || selectedCalculation.billAmount <= 0) {
        return toast.warning("Enter a valid number")
      }

      const restaurant = getRestaurant(selectedCalculation.restaurantId);

      if (!restaurant) return;

      const totalTip =
        (selectedCalculation.billAmount * restaurant.tipPercentage) / 100;

      const totalBill = selectedCalculation.billAmount + totalTip;

      const perPerson = totalBill / selectedCalculation.numberOfPeople;

      const calcService = new CalculationService();

      await calcService.update(selectedCalculation.id, {
        ...selectedCalculation,
        totalTip,
        totalBill,
        perPerson,
        updatedAt: new Date().toISOString(),
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

  const selectedFilterRestaurant =
    selectedFilter !== null ? getRestaurant(selectedFilter) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tips</h2>
            <p className="text-muted-foreground text-sm">
              View all tip calculations and history.
            </p>
          </div>
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
          icon={Receipt}
        />

        <StatCard
          title="Average Tip Amount"
          value={loading ? undefined : averageTipAmount.toFixed(2)}
          description="Average tip per visit"
          loading={loading}
          icon={TrendingUp}
        />

        <StatCard
          title="Total Visits"
          value={loading ? undefined : totalVisits}
          description="Total tip calculations"
          loading={loading}
          icon={Users}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ListFilter className="h-4 w-4" />
          <span className="text-sm">Filter</span>
        </div>

        <select
          className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedFilter ?? ""}
          onChange={(e) => {
            setSelectedFilter(e.target.value ? Number(e.target.value) : null);

            setCurrentPage(1);
          }}
        >
          <option value="">All Restaurants</option>

          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>

        {selectedFilter !== null && (
          <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
            {selectedFilterRestaurant?.name ?? "Restaurant"}
            <button
              type="button"
              onClick={() => setSelectedFilter(null)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted"
              aria-label="Clear filter"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
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
                <TableHead className="text-right">Bill</TableHead>
                <TableHead>Tip %</TableHead>
                <TableHead className="text-right">Total Tip</TableHead>
                <TableHead className="text-right">Per Person</TableHead>
                <TableHead className="text-right">People</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedCalculations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-14">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Receipt className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium">No tip calculations yet</p>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Calculate your first restaurant tip to see it show up
                        here.
                      </p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => setIsCalculateSheetOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Calculate Tip
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCalculations.map((calculation) => {
                  const restaurant = getRestaurant(calculation.restaurantId);

                  return (
                    <TableRow key={calculation.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDateShort(calculation.createdAt)}
                      </TableCell>

                      <TableCell className="font-medium">
                        {restaurant?.name}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(
                          restaurant?.currency,
                          calculation.billAmount,
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {calculation.tipPercentage}%
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(
                          restaurant?.currency,
                          calculation.totalTip,
                        )}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(
                          restaurant?.currency,
                          calculation.perPerson,
                        )}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {calculation.numberOfPeople}
                      </TableCell>

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
                              className="text-red-500 focus:text-red-500"
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
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages || 1}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
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
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                placeholder="0.00"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tip Percentage</Label>
              <Input
                readOnly
                className="bg-muted"
                value={
                  getRestaurant(selectedRestaurantId ?? 0)?.tipPercentage ?? ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Number of People</Label>

              <Input
                type="number"
                min={1}
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleCalculateAndSave}
              disabled={calculating}
            >
              {calculating ? "Calculating…" : "Calculate & Save"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditMode ? "Edit Tip" : "View Tip"}</SheetTitle>

            <SheetDescription>
              {isEditMode
                ? "Update this tip calculation."
                : "View tip calculation details."}
            </SheetDescription>
          </SheetHeader>

          {selectedCalculation && (
            <>
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label>Restaurant</Label>
                  <Input
                    disabled
                    value={
                      getRestaurant(selectedCalculation.restaurantId)?.name ??
                      ""
                    }
                  />
                </div>

                <div className="flex justify-between gap-5">
                  <div className="space-y-2 flex-1">
                    <Label>Tip Percentage</Label>
                    <Input disabled value={selectedCalculation.tipPercentage} />
                  </div>

                  <div className="space-y-2 flex-1">
                    <Label>Total Tip</Label>
                    <Input
                      disabled
                      value={selectedCalculation.totalTip.toFixed(2)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>People</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
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
                  <Input
                    disabled
                    value={selectedCalculation.perPerson.toFixed(2)}
                  />
                </div>

                <div className="flex justify-between gap-5">
                  <div className="space-y-2 flex-1">
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
                  <div className="space-y-2 flex-1">
                    <Label>Total Bill</Label>
                    <Input
                      disabled
                      value={selectedCalculation.totalBill.toFixed(2)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {isEditMode ? (
                    <Button
                      className="flex-1"
                      onClick={handleUpdate}
                      disabled={!selectedCalculation || saving}
                    >
                      {saving ? "Saving…" : "Save changes"}
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
                    size="icon"
                    onClick={() =>
                      selectedCalculation?.id &&
                      handleDelete(selectedCalculation.id)
                    }
                    aria-label="Delete tip"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewSheetOpen(false);
                      setIsEditMode(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mx-4 rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Created: {formatDateTime(selectedCalculation.createdAt)}
                </p>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Last Updated: {formatDateTime(selectedCalculation.updatedAt)}
                </p>
              </div>
            </>
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
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({
  title,
  value,
  description,
  loading,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">{value ?? 0}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
