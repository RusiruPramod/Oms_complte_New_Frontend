// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, CheckCircle, TrendingUp, Calendar, Truck } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getOrders } from "@/services/orderService";
import Pagination from '@/components/ui/paginations';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
// Today's orders are computed locally by matching createdAt date to current date

interface Order {
  id: string;
  fullName: string;
  mobile: string;
  product: string;
  quantity: number | string;
  status: string;
  createdAt: string;
}

interface Stats {
  total: number;
  received: number;
  Conform: number;
  issued: number;
  courier: number;
  today: number;
  monthly: number;
}

const Dashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    received: 0,
    issued: 0,
    courier: 0,
    today: 0,
    monthly: 0,
    Conform: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentLimit, setRecentLimit] = useState(5);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Remove the token parameter since your service doesn't need it
        const response = await getOrders();
        
        console.log("Orders API Response:", response); // Debug log
        
        // Handle different response formats
        let ordersData: Order[] = [];
        
        if (Array.isArray(response)) {
          // If response is already an array
          ordersData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // If response has data property with array
          ordersData = response.data;
        } else if (response && response.orders && Array.isArray(response.orders)) {
          // If response has orders property with array
          ordersData = response.orders;
        }
        
        console.log("Processed orders data:", ordersData); // Debug log
        setOrders(ordersData);

        // Calculate stats
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const newStats: Stats = {
          total: ordersData.length,
          Conform: ordersData.filter(o => o.status === "conform").length,
          received: ordersData.filter(o => o.status === "received").length,
          // Use 'sended' as the issued/completed status coming from admin/orders
          issued: ordersData.filter(o => o.status === "sended").length,
          courier: ordersData.filter(o => o.status === "sended" || o.status === "in-transit" || o.status === "delivered").length,
          // Count orders whose createdAt date equals today's date
          today: ordersData.filter(o => {
            try {
              const d = new Date(o.createdAt);
              const now = new Date();
              return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
            } catch {
              return false;
            }
          }).length,
          monthly: ordersData.filter(o => {
            try {
              return new Date(o.createdAt) >= monthStart;
            } catch {
              return false;
            }
          }).length,
        };

        setStats(newStats);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        // Set empty state to prevent further errors
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on date range
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter((order) => {
      try {
        const orderDate = new Date(order.createdAt);
        return isWithinInterval(orderDate, {
          start: startOfDay(dateRange.from!),
          end: endOfDay(dateRange.to!),
        });
      } catch {
        return false;
      }
    });

    setFilteredOrders(filtered);
  }, [dateRange, orders]);

  const statusData = [
    { name: "Total Orders", value: filteredOrders.length },
    { name: "Received", value: filteredOrders.filter(o => o.status === "received").length },
    // Issued orders are represented by the 'sended' status in admin/orders
    { name: "Issued Orders", value: filteredOrders.filter(o => o.status === "sended").length },
    { name: "Conform Orders", value: filteredOrders.filter(o => o.status === "conform").length },
  ];

  // Safely generate daily data
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    
    let count = 0;
    if (Array.isArray(orders)) {
      count = orders.filter(o => {
        try {
          return o.createdAt && o.createdAt.startsWith && o.createdAt.startsWith(dateStr);
        } catch {
          return false;
        }
      }).length;
    }
    
    return { 
      name: date.toLocaleDateString("en-US", { weekday: "short" }), 
      orders: count 
    };
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "yellow" | "green"> = {
      received: "yellow",
      issued: "outline",
      "sended": "green",
      "in-transit": "outline",
      delivered: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 pb-28">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Received Orders</CardTitle>
              <Clock className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{stats.received}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conform Orders</CardTitle>
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{stats.Conform}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Issued Orders</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.issued}</div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Courier Orders</CardTitle>
              <Truck className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">{stats.courier}</div>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium  ">Today's Orders</CardTitle>
              <Calendar className="w-5 h-5 text-muted-foreground text-purple-500 " />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">{stats.today}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Orders</CardTitle>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.monthly}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="space-y-4">
              <CardTitle>Orders by Status</CardTitle>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-4">
              <CardTitle>Orders (Last 7 Days)</CardTitle>
              <div className="h-10" />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(orders) && orders.length > 0 ? (
                <>
                  {orders.slice().reverse().slice((recentPage - 1) * recentLimit, recentPage * recentLimit).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex-1">
                        <p className="font-semibold">{order.fullName}</p>
                        <p className="text-sm text-muted-foreground">{order.mobile}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Qty: {order.quantity}</p>
                      </div>
                      <div>{getStatusBadge(order.status)}</div>
                    </div>
                  ))}

                  {/* If there are orders, render pagination for recent orders */}
                  <Pagination
                    total={orders.length}
                    page={recentPage}
                    limit={recentLimit}
                    onPageChange={(p) => setRecentPage(p)}
                    onLimitChange={(l) => { setRecentLimit(l); setRecentPage(1); }}
                    limits={[5,10,15,20]}
                    fixed={false}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No orders found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {loading ? "Loading..." : "Try refreshing or check your API connection"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;