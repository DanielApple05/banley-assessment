import { useEffect, useState } from "react";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RestaurantService,
  type Restaurant,
} from "@/services/restaurant.service";
import { CalculationService } from "@/services/calculation.service";

export function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgTip: 0,
    totalVisits: 0,
  });

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    tipPercentage: 15,
    currency: "$",
    city: "",
    state: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const totalPages = Math.ceil(restaurants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRestaurants = restaurants.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const service = new RestaurantService();
      const data = await service.findAll();
      setRestaurants(data);

      // Calculate stats
      const total = data.length;
      const avgTip =
        total > 0
          ? data.reduce((sum, r) => sum + r.tipPercentage, 0) / total
          : 0;

      // Calculate total visits from calculations
      const calcService = new CalculationService();
      let totalVisits = 0;
      for (const restaurant of data) {
        if (restaurant.id) {
          const visits = await calcService.getTotalVisits(restaurant.id);
          totalVisits += visits;
        }
      }

      setStats({
        total,
        avgTip,
        totalVisits,
      });
    } catch (error) {
      console.error("Failed to load restaurants:", error);
      toast.error("Failed to load restaurants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await loadData();
    };
    void run();
  }, []);

  // Create restaurant
  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.city.trim() || !formData.state.trim() || !formData.currency ) {
      toast.warning("All feilds is required.");
      return;
    }

    try {
      const service = new RestaurantService();
      await service.create({
        name: formData.name,
        tipPercentage: formData.tipPercentage,
        currency: formData.currency,
        city: formData.city,
        state: formData.state,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsCreateDialogOpen(false);
      resetForm();
      await loadData();
      toast.success(`"${formData.name}" has been added.`);
    } catch (error) {
      console.error("Failed to create restaurant:", error);
      toast.error("Failed to create restaurant. Please try again.");
    }
  };

  // Delete restaurant
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this restaurant?")) return;
    try {
      const service = new RestaurantService();
      const restaurant = restaurants.find((r) => r.id === id);
      await service.delete(id);
      setIsViewSheetOpen(false);
      setSelectedRestaurant(null);
      await loadData();
      toast.success(`"${restaurant?.name}" has been removed.`);
    } catch (error) {
      console.error("Failed to delete restaurant:", error);
      toast.error("Failed to delete restaurant. Please try again.");
    }
  };

  // Edit restaurant
  const handleEdit = async () => {
    if (!selectedRestaurant?.id) return;
    try {
      const service = new RestaurantService();
      await service.update(selectedRestaurant.id, {
        name: selectedRestaurant.name,
        tipPercentage: selectedRestaurant.tipPercentage,
        currency: selectedRestaurant.currency,
        city: selectedRestaurant.city,
        state: selectedRestaurant.state,
        updatedAt: new Date().toISOString(),
      });
      setIsEditMode(false);
      await loadData();
      toast.success(`"${selectedRestaurant.name}" has been updated.`);
    } catch (error) {
      console.error("Failed to update restaurant:", error);
      toast.error("Failed to update restaurant. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      tipPercentage: 15,
      currency: "$",
      city: "",
      state: "",
    });
  };

  const openViewSheet = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsEditMode(false);
    setIsViewSheetOpen(true);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Restaurants</h2>
          <p className="text-muted-foreground">
            Manage your restaurants and their tip settings.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Restaurant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Restaurants"
          value={loading ? undefined : stats.total}
          description="Restaurants you've added"
          loading={loading}
        />
        <StatCard
          title="Average Tip"
          value={loading ? undefined : `${stats.avgTip.toFixed(1)}%`}
          description="Across all restaurants"
          loading={loading}
        />
        <StatCard
          title="Total Visits"
          value={loading ? undefined : stats.totalVisits}
          description="Total visits across all restaurants"
          loading={loading}
        />
      </div>

      {/* Restaurant Table */}
      <div className="rounded-lg border bg-card">
        <div className="">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tip %</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : paginatedRestaurants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No restaurants yet. Add your first one!
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell className="font-medium">
                      {restaurant.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {restaurant.tipPercentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>{restaurant.currency}</TableCell>
                    <TableCell>
                      {restaurant.city}, {restaurant.state}
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
                            onClick={() => openViewSheet(restaurant)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRestaurant(restaurant);
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
                              restaurant.id && handleDelete(restaurant.id)
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && restaurants.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t flex-wrap">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, restaurants.length)} of{" "}
              {restaurants.length} entries
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Restaurant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Restaurant</DialogTitle>
            <DialogDescription>
              Enter the restaurant details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Pizza Place"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipPercentage">Tip Percentage</Label>
                <Input
                  id="tipPercentage"
                  type="number"
                  value={formData.tipPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipPercentage: Number(e.target.value),
                    })
                  }
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>

                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Allow only letters and common currency symbols
                    if (/^[A-Za-z₦$€£¥₹₽₩₿]*$/.test(value)) {
                      setFormData({
                        ...formData,
                        currency: value.toUpperCase(),
                      });
                    }
                  }}
                  placeholder="USD or $"
                  maxLength={3}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="e.g., New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="e.g., NY"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Restaurant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Restaurant Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-1 pb-4 border-b">
            <SheetTitle className="text-2xl font-semibold flex items-center gap-2">
              <span>{isEditMode ? "Edit" : "View"} Restaurant</span>
              {selectedRestaurant && (
                <Badge variant="outline" className="text-xs font-normal">
                  ID: {selectedRestaurant.id}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {isEditMode
                ? "Update the restaurant details below."
                : "View restaurant details and manage tip calculations."}
            </SheetDescription>
          </SheetHeader>

          {selectedRestaurant && (
            <div className="space-y-6 py-6 px-4">
              {/* Restaurant Name */}
              <div className="space-y-2">
                <Label htmlFor="view-name" className="text-sm font-medium">
                  Restaurant Name
                </Label>
                <Input
                  id="view-name"
                  value={selectedRestaurant.name}
                  onChange={(e) =>
                    setSelectedRestaurant({
                      ...selectedRestaurant,
                      name: e.target.value,
                    })
                  }
                  disabled={!isEditMode}
                  className={!isEditMode ? "bg-muted/50" : "h-10"}
                />
              </div>

              {/* Tip Percentage & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="view-tipPercentage"
                    className="text-sm font-medium"
                  >
                    Tip Percentage
                  </Label>
                  <div className="relative">
                    <Input
                      id="view-tipPercentage"
                      type="number"
                      value={selectedRestaurant.tipPercentage}
                      onChange={(e) =>
                        setSelectedRestaurant({
                          ...selectedRestaurant,
                          tipPercentage: Number(e.target.value),
                        })
                      }
                      min={0}
                      max={100}
                      disabled={!isEditMode}
                      className={!isEditMode ? "bg-muted/50 pr-8" : "h-10 pr-8"}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="view-currency"
                    className="text-sm font-medium"
                  >
                    Currency
                  </Label>
                  <Input
                    id="view-currency"
                    value={selectedRestaurant.currency}
                    onChange={(e) =>
                      setSelectedRestaurant({
                        ...selectedRestaurant,
                        currency: e.target.value,
                      })
                    }
                    placeholder="$"
                    maxLength={3}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted/50" : "h-10"}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Location</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="view-city"
                      className="text-xs text-muted-foreground"
                    >
                      City
                    </Label>
                    <Input
                      id="view-city"
                      value={selectedRestaurant.city}
                      onChange={(e) =>
                        setSelectedRestaurant({
                          ...selectedRestaurant,
                          city: e.target.value,
                        })
                      }
                      placeholder="e.g., New York"
                      disabled={!isEditMode}
                      className={!isEditMode ? "bg-muted/50" : "h-10"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="view-state"
                      className="text-xs text-muted-foreground"
                    >
                      State
                    </Label>
                    <Input
                      id="view-state"
                      value={selectedRestaurant.state}
                      onChange={(e) =>
                        setSelectedRestaurant({
                          ...selectedRestaurant,
                          state: e.target.value,
                        })
                      }
                      placeholder="e.g., NY"
                      disabled={!isEditMode}
                      className={!isEditMode ? "bg-muted/50" : "h-10"}
                    />
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Created:{" "}
                  <span className="font-mono">
                    {new Date(selectedRestaurant.createdAt).toLocaleString()}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Last updated:{" "}
                  <span className="font-mono">
                    {new Date(selectedRestaurant.updatedAt).toLocaleString()}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {isEditMode ? (
                  <>
                    <Button className="flex-1" onClick={handleEdit}>
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditMode(false);
                        // Reset to original data
                        const original = restaurants.find(
                          (r) => r.id === selectedRestaurant.id,
                        );
                        if (original) setSelectedRestaurant(original);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() =>
                        selectedRestaurant.id &&
                        handleDelete(selectedRestaurant.id)
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Stat Card Component
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
