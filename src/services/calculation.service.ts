import { BaseModel } from "./BaseModel";

export interface TipCalculation {
  id?: number;
  restaurantId: number;
  billAmount: number;
  tipPercentage: number;
  numberOfPeople: number;
  totalTip: number;
  totalBill: number;
  perPerson: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class CalculationService extends BaseModel<TipCalculation> {
  protected collectionName = "calculations";

  // Get all calculations for a specific restaurant
  async findByRestaurantId(restaurantId: number): Promise<TipCalculation[]> {
    return this.findWhere({ restaurantId });
  }

  // Get latest calculations for a restaurant (with limit)
  async getLatestForRestaurant(
    restaurantId: number,
    limit: number = 10,
  ): Promise<TipCalculation[]> {
    const all = await this.findByRestaurantId(restaurantId);
    return all
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  // Get calculations by date range
  async getByDateRange(
    restaurantId: number,
    startDate: string,
    endDate: string,
  ): Promise<TipCalculation[]> {
    const all = await this.findByRestaurantId(restaurantId);
    return all.filter(
      (calc) => calc.createdAt >= startDate && calc.createdAt <= endDate,
    );
  }

  // Get total tips for a restaurant
  async getTotalTips(restaurantId: number): Promise<number> {
    const calculations = await this.findByRestaurantId(restaurantId);
    return calculations.reduce((sum, calc) => sum + calc.totalTip, 0);
  }

  // Get average tip percentage for a restaurant
  async getAverageTipPercentage(restaurantId: number): Promise<number> {
    const calculations = await this.findByRestaurantId(restaurantId);
    if (calculations.length === 0) return 0;
    const sum = calculations.reduce((sum, calc) => sum + calc.tipPercentage, 0);
    return sum / calculations.length;
  }

  // Get total bill amount for a restaurant
  async getTotalBills(restaurantId: number): Promise<number> {
    const calculations = await this.findByRestaurantId(restaurantId);
    return calculations.reduce((sum, calc) => sum + calc.billAmount, 0);
  }

  // Get total number of visits for a restaurant
  async getTotalVisits(restaurantId: number): Promise<number> {
    const calculations = await this.findByRestaurantId(restaurantId);
    return calculations.length;
  }

  // Delete all calculations for a restaurant
  async deleteByRestaurantId(restaurantId: number): Promise<void> {
    const calculations = await this.findByRestaurantId(restaurantId);
    for (const calc of calculations) {
      if (calc.id) {
        await this.delete(calc.id);
      }
    }
  }
}
