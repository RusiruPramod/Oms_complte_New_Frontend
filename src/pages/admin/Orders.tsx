// src/pages/admin/Orders.tsx
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Added missing Button import
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowRight, Eye, Trash2, Send, Undo2,Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getOrders, updateOrderStatus, deleteOrder } from "@/services/orderService";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "@/components/modals/ConfirmModal";
import Pagination from '@/components/ui/paginations';
import { saveTimeRange, getTimeRange, getTodaysOrdersCount } from "@/services/timeRangeService";

interface Order {
  id: string;
  order_id: string;
  fullName: string;
  address: string;
  mobile: string;
  mobile2?: string;
  product_name: string;
  quantity: number | string; // Can be number or JSON string
  status: string;
  createdAt: string;
  notes?: string;
  total_amount?: number;
}

const Orders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [todaysOrdersCount, setTodaysOrdersCount] = useState(0);

  // Load time range from localStorage
  const savedTimeRange = getTimeRange();
  const [startTime, setStartTime] = useState(savedTimeRange.startTime);
  const [endTime, setEndTime] = useState(savedTimeRange.endTime);
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">(savedTimeRange.startPeriod);
  const [endPeriod, setEndPeriod] = useState<"PM" | "AM">(savedTimeRange.endPeriod);

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders({ page, limit, status: statusFilter !== 'all' ? statusFilter : undefined, search: searchTerm || undefined });
      console.log("Orders API response:", response);

      // Response may be { orders, total, page, limit } or array
      if (response && response.data === undefined && Array.isArray(response)) {
        // request() sometimes unwraps and returns array directly
        setOrders(response);
        setTotal(response.length || 0);
      } else if (response && Array.isArray(response)) {
        setOrders(response);
        setTotal(response.length || 0);
      } else if (response && response.orders) {
        setOrders(response.orders);
        setTotal(response.total || 0);
      } else if (response && Array.isArray(response.data)) {
        setOrders(response.data);
        setTotal(response.count || response.data.length || 0);
      } else if (response && response.data) {
        // when request() unwraps and returns response.data
        // data may be orders array or paginated object
        if (Array.isArray(response.data)) {
          setOrders(response.data);
          setTotal(response.count || response.data.length || 0);
        } else if (response.data.orders) {
          setOrders(response.data.orders);
          setTotal(response.data.total || 0);
        }
      }

    } catch (error: any) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch orders",
        variant: "destructive",
      });
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to first page when component mounts
    setPage(1);
    loadOrders();
  }, []);

  // Reload when page/limit/search/status changes
  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, statusFilter, searchTerm]);

  // Reset to first page when search or status filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // Filter orders based on search & status
  useEffect(() => {
    // When using server-side pagination & filters, orders already reflect search/status
    setFilteredOrders(Array.isArray(orders) ? orders : []);

    // Calculate today's orders count within time range
    const count = getTodaysOrdersCount(Array.isArray(orders) ? orders : []);
    setTodaysOrdersCount(count);
  }, [orders, searchTerm, statusFilter]);

  // Helper function to display quantity (handles both number and JSON string)
  const getQuantityDisplay = (quantity: number | string, order?: Order): string => {
    console.log('getQuantityDisplay called with:', { quantity, notes: order?.notes });
    
    if (typeof quantity === 'number') {
      return quantity.toString();
    }
    
    // Try to parse from notes field first (for multiple products)
    if (order?.notes) {
      try {
        const notesData = JSON.parse(order.notes);
        console.log('Parsed notes:', notesData);
        if (notesData.quantities) {
          const qtys = JSON.parse(notesData.quantities);
          console.log('Parsed quantities from notes:', qtys);
          if (Array.isArray(qtys)) {
            const total = qtys.reduce((sum, item) => sum + (item.quantity || 0), 0);
            console.log('Total calculated:', total);
            return total.toString();
          }
        }
      } catch (e) {
        console.error('Notes parsing failed:', e);
      }
    }

    // Try to parse quantity field as JSON
    try {
      const parsed = JSON.parse(quantity);
      console.log('Parsed quantity field:', parsed);
      if (Array.isArray(parsed)) {
        // Sum up all quantities
        const total = parsed.reduce((sum, item) => sum + (item.quantity || 0), 0);
        console.log('Total from quantity field:', total);
        return total.toString();
      }
    } catch (e) {
      console.error('Quantity parsing failed:', e);
    }

    return quantity.toString();
  };

  // Helper function to display product names with line breaks for multiple products
  const getProductDisplay = (productName: string, quantity: number | string, order: Order) => {
    // If product_name contains commas, it's multiple products
    if (productName.includes(',')) {
      const names = productName.split(',').map(name => name.trim());
      
      // Try to get product IDs and quantities from notes
      let productData: Array<{ id: string; quantity: number }> = [];
      
      // First try to parse from notes field
      if (order.notes) {
        try {
          const notesData = JSON.parse(order.notes);
          if (notesData.product_ids && notesData.quantities) {
            const ids = notesData.product_ids.split(',');
            const qtys = JSON.parse(notesData.quantities);
            productData = qtys;
          }
        } catch (e) {
          // Notes parsing failed, try quantity field directly
        }
      }
      
      // Fallback: try to parse quantity field directly
      if (productData.length === 0 && typeof quantity === 'string') {
        try {
          productData = JSON.parse(quantity);
        } catch (e) {
          // Couldn't parse quantities
        }
      }
      
      return (
        <div className="flex flex-col items-start gap-1 py-1">
          {names.map((name, index) => {
            // Try to find matching quantity by index
            const qty = productData[index]?.quantity || '?';
            return (
              <div key={index} className="flex items-center gap-2 text-sm w-full">
                <span className="font-medium text-gray-700 flex-1 text-left">{name}</span>
                <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  <Package className="w-3 h-3 text-gray-600" />
                  <span className="font-semibold text-gray-700">{qty}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    return <span className="text-sm font-medium">{productName || 'N/A'}</span>;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast({
        title: "Status Updated",
        description: `Order status changed to "${newStatus}"`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleSendToCourier = (orderId: string) =>
    handleStatusChange(orderId, "sended");

  const handleUnsendOrder = (orderId: string) =>
    handleStatusChange(orderId, "received");

  const handleDelete = (orderId: string) => {
    setOrderToDelete(orderId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      await deleteOrder(orderToDelete);
      // Reload current page after deletion to keep pagination accurate
      await loadOrders();
      toast({
        title: 'Order Deleted',
        description: 'The order was deleted successfully.'
      });
    } catch (error: any) {
      console.error('Delete order error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete order',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setOrderToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "yellow" | "green"> =
    {
      received: "yellow",
      issued: "default",
      "sended": "green",
      "in-transit": "outline",
      "delivered": "default",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-28"> {/* add bottom padding to prevent overlap with fixed pagination */}
        <div>
          <h1 className="text-4xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all customer orders
          </p>
        </div>

        {/* Order Time Range Adjustment */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📅</span>
              Today's Order Time Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Start Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Start Time</label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="rounded-xl"
                    />
                    <Select value={startPeriod} onValueChange={(v) => setStartPeriod(v as "AM" | "PM")}>
                      <SelectTrigger className="w-24 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Close Time</label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="rounded-xl"
                    />
                    <Select value={endPeriod} onValueChange={(v) => setEndPeriod(v as "AM" | "PM")}>
                      <SelectTrigger className="w-24 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Time Range Display */}
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Active Order Time Range</p>
                    <p className="text-lg font-semibold">
                      {startTime} {startPeriod} → {endTime} {endPeriod}
                    </p>
                    <p className="text-sm text-green-600 font-medium mt-2">
                      Today's Orders in Range: {todaysOrdersCount}
                    </p>
                  </div>
                  <Button className="rounded-xl" onClick={() => {
                    // Save time range to localStorage
                    saveTimeRange({ startTime, endTime, startPeriod, endPeriod });

                    // Recalculate today's orders
                    const count = getTodaysOrdersCount(orders);
                    setTodaysOrdersCount(count);

                    toast({
                      title: "Time Range Updated",
                      description: `Orders are now accepted from ${startTime} ${startPeriod} to ${endTime} ${endPeriod}. Today's orders: ${count}`
                    });
                  }}>
                    Apply Time Range
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-2xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="sended">Sended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-hidden -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs sm:text-sm whitespace-nowrap">Order ID</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs sm:text-sm whitespace-nowrap">Customer</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Address</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Mobile</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Product</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Quantity</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Total</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Date</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Time</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {Array.isArray(filteredOrders) && filteredOrders.length > 0 ? (
                    <>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs sm:text-sm py-3 px-2 sm:py-4 sm:px-4 whitespace-nowrap">{order.order_id || 'N/A'}</TableCell>
                          <TableCell className="font-medium py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">{order.fullName}</TableCell>
                          <TableCell className="py-3 px-2 sm:py-4 sm:px-4 text-center max-w-[150px] sm:max-w-xs truncate text-xs sm:text-sm" title={order.address}>{order.address || 'N/A'}</TableCell>
                          <TableCell className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm">
                            <div className="flex flex-col items-center ">
                              <span className="text-sm">{order.mobile || 'N/A'}</span>
                              {order.mobile2 && (
                                <span className="text-sm">{order.mobile2}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-3">
                            {getProductDisplay(order.product_name, order.quantity, order)}
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 font-bold text-gray-900">
                              {getQuantityDisplay(order.quantity, order)}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <span className="font-semibold text-gray-900">
                              Rs. {order.total_amount ? order.total_amount.toLocaleString() : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-center">{getStatusBadge(order.status || 'received')}</TableCell>
                          <TableCell className="py-4 text-center">
                            {order.createdAt ?
                              new Date(order.createdAt).toLocaleDateString() :
                              'N/A'}
                          </TableCell>
                          <TableCell className="py-4 text-center font-mono text-sm">
                            {order.createdAt ?
                              new Date(order.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              }) :
                              'N/A'}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate(`/admin/orders/${order.id}`)}
                                className="h-9 w-9"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {order.status === "sended" ||
                                order.status === "in-transit" ||
                                order.status === "delivered" ? (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleUnsendOrder(order.id)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300 h-9 w-9"
                                  title="Unsend Order"
                                >
                                  <Undo2 className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleSendToCourier(order.id)}
                                  className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 h-9 w-9"
                                  title="Send to Courier"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDelete(order.id)}
                                className="h-9 w-9"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Pad with empty rows to always show 6 rows */}
                      {filteredOrders.length < 5 && Array.from({ length: 6 - filteredOrders.length }).map((_, idx) => (
                        <TableRow key={`empty-row-${idx}`}>
                          <TableCell className="py-4">&nbsp;</TableCell>
                          <TableCell className="py-4" colSpan={10}></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                        {loading ? 'Loading orders...' : 'No orders found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-4">
          <Pagination

            total={total}
            page={page}
            limit={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            limits={[5, 10, 15, 20]}
            fixed={false} // embedded, right-aligned pagination

          /></div>
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setOrderToDelete(null); }}
        onConfirm={confirmDelete}
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
      />
    </AdminLayout>
  );
};

export default Orders;