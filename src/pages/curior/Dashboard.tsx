import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Eye, CheckCircle, Download, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getCourierOrders, updateCourierStatus } from "@/services/courierService";
import { InvoiceModal } from "@/components/modals/InvoiceModal";
import { ExportCourierModal } from "@/components/modals/ExportCourierModal";
import Pagination from '@/components/ui/paginations';
import CourierLayout from "@/components/courier/CourierLayout";
import { io } from "socket.io-client"; // Import socket.io-client
import UpdateDeliveryStatusModal from "@/components/modals/UpdateDeliveryStatusModal";

interface Order {
  id: string;
  fullName: string;
  address: string;
  mobile: string;
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
}

const Courier = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
  const [manuallyUpdatedOrders, setManuallyUpdatedOrders] = useState<Set<string>>(new Set());

  const token = localStorage.getItem("adminAuthToken") || "";

  // Connect to WebSocket server
  const socket = io("http://localhost:4000");

  // Load courier orders from API
  const loadOrders = async () => {
    try {
      const response = await getCourierOrders({ 
        page, 
        limit, 
        status: statusFilter !== 'all' ? statusFilter : undefined, 
        search: searchTerm || undefined 
      }, token);

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
  }, []);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, statusFilter, searchTerm]);

  // Filter and search - Exclude returned orders from main dashboard view
  useEffect(() => {
    let filtered = orders;

    // Exclude returned orders from the main dashboard (they go to Return Orders page)
    filtered = filtered.filter((order) => order.status !== 'returned');

    // Apply status filter if not "all"
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.mobile.includes(searchTerm)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, manuallyUpdatedOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // Add to manually updated orders set
      setManuallyUpdatedOrders(prev => new Set([...prev, orderId]));
      
      // Optimistically update the order status in local state
      setOrders((prev) => 
        prev.map((o) => 
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
      
      setIsStatusModalOpen(false);
      setOrderToUpdate(null);

      // Call API to update status
      await updateCourierStatus(orderId, newStatus, token);

      toast({
        title: "Status Updated",
        description: `Order status changed to "${newStatus}"`,
      });

      // Refresh orders from server to ensure consistency
      await loadOrders();
    } catch (error: any) {
      // Revert optimistic update on failure
      setOrders((prev) => 
        prev.map((o) => 
          o.id === orderId ? { ...o, status: orderToUpdate?.status || "sended" } : o
        )
      );
      
      // Remove from manually updated orders set on failure
      setManuallyUpdatedOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
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
      "sended": "Received",
      "in-transit": "In Transit",
      "delivered": "Delivered",
      "returned": "Returned",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const downloadOrderDetails = (order: Order) => {
    // Generate PDF-like content
    const content = `
=====================================
        COURIER ORDER INVOICE
=====================================

Order Details
-------------
Invoice Number: INV-${String(order.id).slice(0, 8).toUpperCase()}
Order Number: #${String(order.id).slice(0, 8).toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status.toUpperCase()}

Customer Information
--------------------
Name: ${order.fullName}
Mobile: ${order.mobile}
Email: ${order.email || 'N/A'}
Address: ${order.address}

Courier Details
---------------
Company: ${order.courierCompany || 'Express Delivery'}
Tracking: ${order.trackingNumber || 'TRK-' + String(order.id).slice(0, 10).toUpperCase()}
Method: Standard Delivery

Order Items
-----------
Product: ${order.product_name}
Quantity: ${order.quantity}
Unit Price: Rs. ${(order.price || 1500).toLocaleString()}
Subtotal: Rs. ${((order.price || 1500) * parseInt(order.quantity)).toLocaleString()}

Payment Summary
---------------
Subtotal: Rs. ${((order.price || 1500) * parseInt(order.quantity)).toLocaleString()}
Delivery: Rs. ${(order.deliveryCharge || 200).toLocaleString()}
${order.discount ? `Discount: -Rs. ${order.discount.toLocaleString()}` : ''}
-------------------------------------
TOTAL: Rs. ${((order.price || 1500) * parseInt(order.quantity) + (order.deliveryCharge || 200) - (order.discount || 0)).toLocaleString()}

Payment Method: Cash on Delivery (COD)

=====================================
Thank you for your business!
=====================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${String(order.id).slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Invoice downloaded successfully",
    });
  };

  const handleExportSelected = (selectedOrders: Order[]) => {
    const content = selectedOrders.map((order, index) => `
=====================================
    COURIER ORDER ${index + 1} OF ${selectedOrders.length}
=====================================

Order Number: #${String(order.id).slice(0, 8).toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status.toUpperCase()}

Customer: ${order.fullName}
Mobile: ${order.mobile}
Address: ${order.address}

Product: ${order.product_name}
Quantity: ${order.quantity}
Total: Rs. ${((order.price || 1500) * parseInt(order.quantity) + (order.deliveryCharge || 200) - (order.discount || 0)).toLocaleString()}

Courier: ${order.courierCompany || 'Express Delivery'}
Tracking: ${order.trackingNumber || 'TRK-' + String(order.id).slice(0, 10).toUpperCase()}
    `).join('\n\n');

    const header = `
=====================================
   COURIER ORDERS EXPORT REPORT
=====================================
Export Date: ${new Date().toLocaleDateString()}
Total Orders: ${selectedOrders.length}
=====================================

`;

    const fullContent = header + content;

    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courier-orders-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exported Successfully",
      description: `${selectedOrders.length} courier order(s) exported as PDF`,
    });
  };

  const openExportModal = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No Orders",
        description: "No orders available to export",
        variant: "destructive",
      });
      return;
    }
    setIsExportModalOpen(true);
  };

  const openInvoiceModal = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceModalOpen(true);
  };

  // Listen for real-time updates from WebSocket
  useEffect(() => {
    socket.on("orderStatusUpdated", (updatedOrder) => {
      // Add to manually updated orders when status changes via WebSocket
      setManuallyUpdatedOrders(prev => new Set([...prev, updatedOrder.id]));
      
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id ? { ...order, status: updatedOrder.status } : order
        )
      );
    });

    return () => {
      socket.off("orderStatusUpdated");
    };
  }, []);

  // Reset manually updated orders when status filter changes to "all"
  useEffect(() => {
    if (statusFilter === "all") {
      setManuallyUpdatedOrders(new Set());
    }
  }, [statusFilter]);

  return (
    <CourierLayout>
      <div className="space-y-6 pb-28">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Courier Management</h1>
            <p className="text-muted-foreground mt-2">Track and manage delivery orders</p>
          </div>
          <Button
            onClick={openExportModal}
            className="bg-primary hover:bg-primary/90"
            disabled={filteredOrders.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export as PDF
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Returned orders are shown in the <strong>Return Orders</strong> page in the sidebar. Click on any order's update button and select "Returned" to move it there.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sended">Received</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {manuallyUpdatedOrders.size > 0 && statusFilter !== "all" && (
              <div className="mt-3 text-sm text-blue-600 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Showing {manuallyUpdatedOrders.size} recently updated order(s) along with filtered results
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courier Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-hidden -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-left text-xs sm:text-sm whitespace-nowrap">Customer</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Address</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Mobile</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Product</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Quantity</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Date</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Feedback</TableHead>
                      <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className={manuallyUpdatedOrders.has(order.id) ? "bg-blue-50" : ""}>
                      <TableCell className="font-medium py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {order.fullName}
                          {manuallyUpdatedOrders.has(order.id) && (
                            <Badge variant="outline" className="text-xs bg-blue-100">
                              Updated
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4 text-center max-w-[120px] sm:max-w-xs truncate text-xs sm:text-sm">{order.address}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">{order.mobile}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">{order.product_name}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm">{order.quantity}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm">{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4 text-center text-xs sm:text-sm">
                        {/* Feedback content based on status */}
                        {order.status === 'delivered' ? (
                          <span className="text-green-500 font-semibold">Delivered on time</span>
                        ) : order.status === 'in-transit' ? (
                          <span className="text-yellow-500 font-semibold">In transit</span>
                        ) : order.status === 'returned' ? (
                          <span className="text-red-500 font-semibold">Returned</span>
                        ) : (
                          <span className="text-gray-500 font-semibold">Not Updated</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center justify-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openInvoiceModal(order)}
                            className="h-9 w-9"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => downloadOrderDetails(order)}
                            className="h-9 w-9"
                            title="Download Order"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            className="bg-primary hover:bg-primary/90 h-9 w-9"
                            size="icon"
                            onClick={() => openStatusModal(order)}
                            title="Update Status"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Pad with empty rows to always show 6 rows */}
                  {filteredOrders.length < 5 && Array.from({ length: 6 - filteredOrders.length }).map((_, idx) => (
                    <TableRow key={`empty-row-${idx}`}>
                      <TableCell className="py-4">&nbsp;</TableCell>
                      <TableCell className="py-4" colSpan={7}></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No courier orders found
                </div>
              )}
            </div>
            </div>
          </CardContent>
        </Card>
        {/* Pagination for courier orders */}
        <Pagination
          total={total}
          page={page}
          limit={limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          limits={[5,10,15,20]}
          fixed={false}
        />
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={selectedOrder}
      />

      {/* Export Courier Modal */}
      <ExportCourierModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        orders={filteredOrders}
        onExport={handleExportSelected}
      />

      {/* Status Update Modal */}
      <UpdateDeliveryStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        orderToUpdate={orderToUpdate}
        handleStatusChange={handleStatusChange}
      />
    </CourierLayout>
  );
};

export default Courier;