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

export function Tips() {
  const [calculations, setCalculations] = useState<TipCalculation[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tips</h2>
          <p className="text-muted-foreground">
            View all tip calculations and history.
          </p>
        </div>

        <Button>
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

      <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
        Tip history coming soon...
      </div>
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
