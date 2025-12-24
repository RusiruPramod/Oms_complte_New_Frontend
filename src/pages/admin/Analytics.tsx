import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getCourierOrders } from "@/services/courierService";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  order_id: string;
  fullName: string;
  address: string;
  mobile: string;
  product_name: string;
  quantity: string;
  status: string;
  createdAt: string;
  total_amount?: number;
}

interface StatusDataItem {
  name: string;
  value: number;
  color: string;
}

interface WeeklyDataItem {
  name: string;
  orders: number;
  revenue: number;
}

interface MonthlyDataItem {
  name: string;
  orders: number;
  revenue: number;
}

const Analytics = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("adminAuthToken") || "";

  // Load all courier orders
  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Get all orders without pagination
      const response = await getCourierOrders({ page: 1, limit: 10000 }, token);
      
      let allOrders: Order[] = [];
      if (response && response.data && response.data.orders) {
        allOrders = response.data.orders;
      } else if (Array.isArray(response)) {
        allOrders = response;
      } else if (response && response.orders) {
        allOrders = response.orders;
      }
      
      setOrders(allOrders);
    } catch (error: any) {
      console.error("Failed to load orders:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Calculate analytics from orders
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(String(o.total_amount || 0)), 0);

  // Status distribution - Premium UI Color Palette
  const statusData: StatusDataItem[] = [
    { name: "Received", value: orders.filter(o => o.status === 'received').length, color: "#f59e0b" }, // Amber 500 - Warm pending
    { name: "Issued", value: orders.filter(o => o.status === 'issued').length, color: "#3b82f6" }, // Blue 500 - Active blue
    { name: "Sent to Courier", value: orders.filter(o => o.status === 'sended').length, color: "#f97316" }, // Orange 500 - Vibrant orange
    { name: "Delivered", value: orders.filter(o => o.status === 'delivered').length, color: "hsl(var(--primary))" }, // Primary theme color
    { name: "Returned", value: orders.filter(o => o.status === 'returned').length, color: "#dc2626" } // Red 600 - Strong alert
  ].filter(s => s.value > 0);

  // Weekly data (last 7 days)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData: WeeklyDataItem[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = days[date.getDay()];
    
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate === dateStr;
    });
    
    const dayDeliveredOrders = dayOrders.filter(o => o.status === 'delivered');
    const dayRevenue = dayDeliveredOrders.reduce((sum, o) => sum + parseFloat(String(o.total_amount || 0)), 0);
    
    weeklyData.push({
      name: dayName,
      orders: dayOrders.length,
      revenue: dayRevenue
    });
  }

  // Monthly data (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData: MonthlyDataItem[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const monthOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getFullYear() === year && orderDate.getMonth() + 1 === month;
    });
    
    const monthDeliveredOrders = monthOrders.filter(o => o.status === 'delivered');
    const monthRevenue = monthDeliveredOrders.reduce((sum, o) => sum + parseFloat(String(o.total_amount || 0)), 0);
    
    monthlyData.push({
      name: monthNames[month - 1],
      orders: monthOrders.length,
      revenue: monthRevenue
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">Track your business performance</p>
          </div>
          <Button 
            onClick={loadAnalyticsData} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading && orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
        ) : (
          <>
            {/* Revenue Card */}
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue (Delivered Orders Only)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">
                  Rs. {totalRevenue.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-2">
                  From {orders.length} total orders ({deliveredOrders.length} delivered)
                </p>
              </CardContent>
            </Card>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#dc8813ff"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">No orders found</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="orders" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">No weekly data available</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">No weekly revenue data available</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">No monthly data available</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Analytics;
