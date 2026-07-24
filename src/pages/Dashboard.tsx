import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RestaurantService } from "@/services/restaurant.service";
import {
  CalculationService,
  type TipCalculation,
} from "@/services/calculation.service";
import { Store, DollarSign, Users, Percent } from "lucide-react";

// Using CSS variables from design tokens
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalTips: 0,
    totalVisits: 0,
    avgTipPercentage: 0,
  });
  const [tipsByRestaurant, setTipsByRestaurant] = useState<
    { name: string; tips: number }[]
  >([]);
  const [visitsByRestaurant, setVisitsByRestaurant] = useState<
    { name: string; visits: number }[]
  >([]);
  const [tipDistribution, setTipDistribution] = useState<
    { name: string; value: number }[]
  >([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const restaurantService = new RestaurantService();
        const calculationService = new CalculationService();

        const restaurants = await restaurantService.findAll();
        const allCalculations: TipCalculation[] = [];

        // Collect all calculations
        for (const restaurant of restaurants) {
          if (restaurant.id) {
            const calcs = await calculationService.findByRestaurantId(
              restaurant.id,
            );
            allCalculations.push(...calcs);
          }
        }

        // Stats
        const totalRestaurants = restaurants.length;
        const totalTips = allCalculations.reduce(
          (sum, c) => sum + c.totalTip,
          0,
        );
        const totalVisits = allCalculations.length;
        const avgTipPercentage =
          allCalculations.length > 0
            ? allCalculations.reduce((sum, c) => sum + c.tipPercentage, 0) /
              allCalculations.length
            : 0;

        setStats({
          totalRestaurants,
          totalTips,
          totalVisits,
          avgTipPercentage,
        });

        // Tips by Restaurant (Bar Chart)
        const tipsMap = new Map<string, number>();
        for (const restaurant of restaurants) {
          const calcs = await calculationService.findByRestaurantId(
            restaurant.id!,
          );
          const total = calcs.reduce((sum, c) => sum + c.totalTip, 0);
          if (total > 0) {
            tipsMap.set(restaurant.name, total);
          }
        }
        const tipsData = Array.from(tipsMap.entries())
          .map(([name, tips]) => ({ name, tips }))
          .sort((a, b) => b.tips - a.tips)
          .slice(0, 10);
        setTipsByRestaurant(tipsData);

        // Visits by Restaurant (Pie Chart)
        const visitsMap = new Map<string, number>();
        for (const restaurant of restaurants) {
          const calcs = await calculationService.findByRestaurantId(
            restaurant.id!,
          );
          if (calcs.length > 0) {
            visitsMap.set(restaurant.name, calcs.length);
          }
        }
        const visitsData = Array.from(visitsMap.entries())
          .map(([name, visits]) => ({ name, visits }))
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 10);
        setVisitsByRestaurant(visitsData);

        // Tip Distribution (Pie Chart)
        const distributionMap = new Map<string, number>();
        for (const calc of allCalculations) {
          const key = `${calc.tipPercentage}%`;
          distributionMap.set(key, (distributionMap.get(key) || 0) + 1);
        }
        const distributionData = Array.from(distributionMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);
        setTipDistribution(distributionData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your restaurant tips and activity.
        </p>
      </div>

      {/* Stats Cards with Icons */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <StatCard
          title="All Restaurants"
          value={loading ? undefined : stats.totalRestaurants}
          description="Restaurants you've added"
          loading={loading}
          icon={Store}
          iconColor="var(--chart-1)"
        />
        <StatCard
          title="Total Tips"
          value={loading ? undefined : `$${stats.totalTips.toFixed(2)}`}
          description="Across all restaurants"
          loading={loading}
          icon={DollarSign}
          iconColor="var(--chart-1)"
        />
        <StatCard
          title="Total Visits"
          value={loading ? undefined : stats.totalVisits}
          description="Total visits across all restaurants"
          loading={loading}
          icon={Users}
          iconColor="var(--chart-1)"
        />
        <StatCard
          title="Average Tip %"
          value={loading ? undefined : `${stats.avgTipPercentage.toFixed(1)}%`}
          description="Across all visits"
          loading={loading}
          icon={Percent}
          iconColor="var(--chart-1)"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tips by Restaurant - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tips by Restaurant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : tipsByRestaurant.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data yet. Add some tips!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tipsByRestaurant}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    stroke="var(--border)"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    stroke="var(--border)"
                  />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar
                    dataKey="tips"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Visits by Restaurant - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Visits by Restaurant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : visitsByRestaurant.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data yet. Add some visits!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={visitsByRestaurant}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent = 0 }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    dataKey="visits"
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {visitsByRestaurant.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tip Distribution - Pie Chart (Full Width) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tip Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : tipDistribution.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data yet. Add some tips!
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <ResponsiveContainer
                  width="100%"
                  height={250}
                  className="max-w-md"
                >
                  <PieChart>
                    <Pie
                      data={tipDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent = 0 }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      dataKey="value"
                      stroke="var(--background)"
                      strokeWidth={2}
                    >
                      {tipDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stat Card Component with Icon
interface StatCardProps {
  title: string;
  value?: string | number;
  description: string;
  loading: boolean;
  icon: React.ElementType;
  iconColor: string;
}

function StatCard({
  title,
  value,
  description,
  loading,
  icon: Icon,
  iconColor,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className="rounded-full p-2"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
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
