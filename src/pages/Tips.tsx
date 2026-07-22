import { useEffect, useState } from "react";
import {
  CalculationService,
  type TipCalculation,
} from "@/services/calculation.service";
import {
  RestaurantService,
  type Restaurant,
} from "@/services/restaurant.service";

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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tips</h2>
        <p className="text-muted-foreground">
          View all tip calculations and history.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
        Tip history coming soon...
      </div>
    </div>
  );
}
