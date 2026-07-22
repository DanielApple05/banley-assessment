import { useEffect, useState } from "react";
import {
  CalculationService,
  TipCalculation,
} from "@/services/calculation.service";
import { RestaurantService, Restaurant } from "@/services/restaurant.service";

export function Tips() {
  const [calculations, setCalculations] = useState<TipCalculation[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

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
