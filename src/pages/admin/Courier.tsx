import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import CourierLayout from "@/components/courier/CourierLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Eye, CheckCircle, Download, Truck, Package, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCourierOrders, updateCourierStatus } from "@/services/courierService";
import { InvoiceModal } from "@/components/modals/InvoiceModal";
import Pagination from '@/components/ui/paginations';
import AdminLayout from "@/components/admin/AdminLayout";

interface Order {
  id: string;
  order_id: string;
  fullName: string;
  address: string;
  mobile: string;
  mobile2?: string;
  product: string;
  product_name: string;
  quantity: string;
  status: string;
  createdAt: string;
  email?: string;
  price?: number;
  deliveryCharge?: number;
  discount?: number;
  courierCompany?: string;
  trackingNumber?: string;
  total_amount?: number;
  notes?: string;
}

interface Stats {
  pending: number;
  inTransit: number;
  delivered: number;
  returned: number;
  total: number;
}

const CourierDashboard = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    inTransit: 0,
    delivered: 0,
    returned: 0,
    total: 0,
  });

  const token = localStorage.getItem("adminAuthToken") || "";

  // Load courier orders from API
  const loadOrders = async () => {
    try {
      const response = await getCourierOrders(
        { 
          page, 
          limit, 
          status: statusFilter !== 'all' ? statusFilter : undefined, 
          search: searchTerm || undefined 
        }, 
        token
      );

      if (response && response.data && response.data.orders) {
        setOrders(response.data.orders as Order[]);
        setTotal(response.data.total || 0);
      } else if (Array.isArray(response)) {
        setOrders(response);
        setTotal(response.length);
      } else if (response && response.orders) {
        setOrders(response.orders);
        setTotal(response.total || 0);
      } else {
        setOrders([]);
        setTotal(0);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch courier orders",
        variant: "destructive",
      });
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh every 10 seconds to sync status changes from courier
    const refreshInterval = setInterval(() => {
      loadOrders();
    }, 10000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, statusFilter, searchTerm]);

  // Calculate stats
  useEffect(() => {
    const newStats: Stats = {
      pending: orders.filter(o => o.status === "sended").length,
      inTransit: orders.filter(o => o.status === "in-transit").length,
      delivered: orders.filter(o => o.status === "delivered").length,
      returned: orders.filter(o => o.status === "returned").length,
      total: orders.length,
    };
    setStats(newStats);
  }, [orders]);

  // Filter and search
  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.mobile.includes(searchTerm) ||
          order.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  // Helper function to display product names with line breaks for multiple products
  const getProductDisplay = (productName: string, quantity: string, order: Order) => {
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

  // Keep selection in sync when filteredOrders change
  useEffect(() => {
    // Remove any selected ids that are no longer present in filteredOrders
    setSelectedIds((prev) => prev.filter((id) => filteredOrders.some((o) => o.id === id)));
  }, [filteredOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateCourierStatus(orderId, newStatus, token);
      
      toast({
        title: "Status Updated",
        description: `Delivery status changed to ${newStatus}`,
      });
      setIsStatusModalOpen(false);
      setOrderToUpdate(null);
      
      // Reload orders from server to ensure data consistency
      await loadOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery status",
        variant: "destructive",
      });
    }
  };

  const openStatusModal = (order: Order) => {
    setOrderToUpdate(order);
    setIsStatusModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive" | "yellow" | "green"> = {
      "sended": "secondary",
      "in-transit": "yellow",
      "delivered": "green",
      "returned": "destructive",
    };
    const labels: Record<string, string> = {
      "sended": "Received Orders",
      "in-transit": "In Transit",
      "delivered": "Delivered",
      "returned": "Returned",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const downloadOrderDetails = (order: Order) => {
    const content = `
=====================================
        DELIVERY ORDER DETAILS
=====================================

Order Information
-----------------
Order Number: #${String(order.id).slice(0, 8).toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status.toUpperCase()}

Customer Information
--------------------
Name: ${order.fullName}
Mobile: ${order.mobile}
Email: ${order.email || 'N/A'}
Address: ${order.address}

Delivery Details
----------------
Company: ${order.courierCompany || 'Express Delivery'}
Tracking: ${order.trackingNumber || 'TRK-' + String(order.id).slice(0, 10).toUpperCase()}

Package Information
-------------------
Product: ${order.product_name}
Quantity: ${order.quantity}
Weight: Standard

=====================================
      Thank you for delivering!
=====================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-${String(order.id).slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Delivery details downloaded successfully",
    });
  };

  const toggleSelect = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const exportToExcel = (ordersToExport: Order[], fileName = "orders") => {
    if (!ordersToExport || ordersToExport.length === 0) {
      toast({ title: "No orders", description: "No orders to export", variant: "destructive" });
      return;
    }

    // Export only requested columns in this order:
    // Order ID, Customer Name, Mobile, Address, Product, Quantity, Date
    const data = ordersToExport.map((o) => ({
      "Order ID": o.order_id || o.id,
      "Customer Name": o.fullName,
      Mobile: o.mobile,
      Address: o.address,
      Product: o.product_name || "",
      Quantity: o.quantity,
      Date: new Date(o.createdAt).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    // Apply column widths (wch: character width) as requested
    ws['!cols'] = [
      { wch: 15 }, // Order ID
      { wch: 22 }, // Customer Name
      { wch: 16 }, // Mobile
      { wch: 35 }, // Address
      { wch: 20 }, // Product
      { wch: 10 }, // Quantity
      { wch: 25 }, // Date
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    toast({ title: "Exported", description: `Exported ${ordersToExport.length} orders` });
  };

  const exportSelected = () => {
    const selected = orders.filter((o) => selectedIds.includes(o.id));
    exportToExcel(selected, `selected-orders-${new Date().toISOString().slice(0,10)}`);
  };

  const exportAll = () => {
    exportToExcel(orders, `all-orders-${new Date().toISOString().slice(0,10)}`);
  };

  const exportSingleOrder = (order: Order) => {
    exportToExcel([order], `order-${order.order_id || order.id}`);
  };

  const exportToday = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    const todays = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= start && t < end;
    });
    exportToExcel(todays, `today-orders-${new Date().toISOString().slice(0,10)}`);
  };

  const openInvoiceModal = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-28">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">My Deliveries</h1>
            <p className="text-muted-foreground mt-2">Manage your delivery orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Received Orders
              </CardTitle>
              <Clock className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Transit
              </CardTitle>
              <Truck className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inTransit}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Delivered
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delivered}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <Package className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, mobile, or address..."
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
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sended">Received Orders</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                    title="Select all"
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </label>
                <div className="text-sm text-muted-foreground">{filteredOrders.length} shown</div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={exportSelected} title="Export selected to Excel">
                  <Download className="w-4 h-4 mr-2" /> Export Selected
                </Button>
                <Button variant="outline" onClick={exportAll} title="Export all to Excel">
                  <Package className="w-4 h-4 mr-2" /> Export All
                </Button>
                <Button variant="outline" onClick={exportToday} title="Export today's orders">
                  <Clock className="w-4 h-4 mr-2" /> Export Today
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-4 text-left"> </TableHead>
                    <TableHead className="py-4 text-left">Order ID</TableHead>
                    <TableHead className="py-4 text-left">Customer</TableHead>
                    <TableHead className="py-4 text-center">Address</TableHead>
                    <TableHead className="py-4 text-center">Mobile</TableHead>
                    <TableHead className="py-4 text-center">Product</TableHead>
                    <TableHead className="py-4 text-center">Quantity</TableHead>
                    <TableHead className="py-4 text-center">Total</TableHead>
                    <TableHead className="py-4 text-center">Status</TableHead>
                    <TableHead className="py-4 text-center">Date</TableHead>
                    <TableHead className="py-4 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="w-4 h-4"
                          title="Select order"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm py-4">{order.order_id || 'N/A'}</TableCell>
                      <TableCell className="font-medium py-4">{order.fullName}</TableCell>
                      <TableCell className="py-4 text-center max-w-xs truncate" title={order.address}>
                        {order.address}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{order.mobile || 'N/A'}</span>
                          {order.mobile2 && (
                            <span className="text-sm">{order.mobile2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-3">
                        {getProductDisplay(order.product_name || '', order.quantity, order)}
                      </TableCell>
                      <TableCell className="py-4 text-center">{order.quantity}</TableCell>
                      <TableCell className="py-4 text-center">
                        <span className="font-semibold text-gray-900">
                          Rs. {order.total_amount ? order.total_amount.toLocaleString() : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-center">{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="py-4 text-center">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center justify-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openInvoiceModal(order)}
                            className="h-9 w-9"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => exportSingleOrder(order)}
                            className="h-9 w-9"
                            title="Download Excel"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        No delivery orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <Pagination
          total={total}
          page={page}
          limit={limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          limits={[10, 20, 30, 50]}
          fixed={false}
        />
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={selectedOrder}
      />
    </AdminLayout>
  );
};

export default CourierDashboard;