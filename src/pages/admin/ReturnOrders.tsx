import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Download, RotateCcw, Package, AlertCircle, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrders, updateOrderStatus } from '@/services/orderService';
import { InvoiceModal } from '@/components/modals/InvoiceModal';
import Pagination from '@/components/ui/paginations';
import { io } from 'socket.io-client';

interface ReturnOrder {
  id: string;
  fullName: string;
  address: string;
  mobile: string;
  product_name?: string;
  product?: string;
  quantity: string | number;
  status: string;
  createdAt: string;
  email?: string;
  price?: number;
  deliveryCharge?: number;
  discount?: number;
  courierCompany?: string;
  trackingNumber?: string;
}

const AdminReturnOrders = () => {
  const { toast } = useToast();
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ReturnOrder[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ReturnOrder | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const token = localStorage.getItem('adminAuthToken') || '';

  // Connect to WebSocket server
  const socket = io('http://localhost:4000');

  const loadReturnOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders();
      
      let ordersData: ReturnOrder[] = [];
      
      if (Array.isArray(response)) {
        ordersData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response && response.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
      }
      
      // Filter only returned orders
      const returnedOrders = ordersData.filter((order) => order.status === 'returned');
      
      setReturnOrders(returnedOrders);
      setTotal(returnedOrders.length);
      
      if (returnedOrders.length === 0) {
        toast({
          title: 'No Return Orders',
          description: 'There are currently no returned orders.',
        });
      }
    } catch (error) {
      console.error('Failed to fetch return orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load return orders',
        variant: 'destructive',
      });
      setReturnOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturnOrders();
  }, []);

  // Filter orders based on search and status
  useEffect(() => {
    let filtered = returnOrders;
    
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.mobile.includes(searchTerm) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [returnOrders, searchTerm, statusFilter]);

  // Listen for real-time status updates from WebSocket
  useEffect(() => {
    socket.on('orderStatusUpdated', (updatedOrder) => {
      // If order status is 'returned', add it to the return orders table
      if (updatedOrder.status === 'returned') {
        setReturnOrders((prevOrders) => {
          // Check if order already exists
          const exists = prevOrders.some((o) => o.id === updatedOrder.id);
          if (!exists) {
            return [updatedOrder, ...prevOrders];
          }
          return prevOrders.map((o) =>
            o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
          );
        });

        toast({
          title: 'New Return Order',
          description: `${updatedOrder.fullName}'s order marked as returned`,
        });
      }
    });

    return () => {
      socket.off('orderStatusUpdated');
    };
  }, [toast]);

  const handleDownloadReport = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: 'No Data',
        description: 'No return orders to download',
        variant: 'destructive',
      });
      return;
    }

    const csv = [
      ['Order ID', 'Customer Name', 'Mobile', 'Product', 'Quantity', 'Status', 'Created Date', 'Email', 'Address'],
      ...filteredOrders.map((order) => [
        order.id,
        order.fullName,
        order.mobile,
        order.product_name || order.product || 'N/A',
        order.quantity,
        order.status,
        new Date(order.createdAt).toLocaleDateString(),
        order.email || 'N/A',
        order.address || 'N/A',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `return-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Report downloaded successfully',
    });
  };

  const paginatedOrders = filteredOrders.slice((page - 1) * limit, page * limit);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'returned':
        return 'bg-red-100 text-red-800';
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'issued':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRestoreOrder = async (order: ReturnOrder) => {
    try {
      await updateOrderStatus(order.id, 'delivered', token);
      
      // Remove from return orders list
      setReturnOrders((prevOrders) => 
        prevOrders.filter((o) => o.id !== order.id)
      );
      
      // Update filtered orders
      setFilteredOrders((prevOrders) =>
        prevOrders.filter((o) => o.id !== order.id)
      );

      toast({
        title: 'Success',
        description: `Order ${order.id} has been restored`,
      });
    } catch (error) {
      console.error('Failed to restore order:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore order',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-8 w-8" />
              Return Orders
            </h1>
            <p className="text-gray-600 mt-1">Manage and track returned orders</p>
          </div>
          <Button
            onClick={handleDownloadReport}
            variant="outline"
            className="gap-2"
            disabled={filteredOrders.length === 0}
          >
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>

        {/* Stats Card */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{total}</div>
              <p className="text-xs text-gray-500 mt-1">All returned orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {returnOrders.filter((o) => o.status === 'returned').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {returnOrders.filter((o) => {
                  const orderDate = new Date(o.createdAt);
                  const now = new Date();
                  return (
                    orderDate.getMonth() === now.getMonth() &&
                    orderDate.getFullYear() === now.getFullYear()
                  );
                }).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Monthly returns</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Return Orders List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, mobile, or order ID..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <RotateCcw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Loading return orders...</p>
                  </div>
                </div>
              ) : paginatedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600">No return orders found</p>
                  <p className="text-sm text-gray-500">Orders marked as returned will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader className="bg-gray-50 border-b">
                      <TableRow className="hover:bg-gray-50">
                        <TableHead className="w-24 font-semibold text-gray-700">Order ID</TableHead>
                        <TableHead className="w-32 font-semibold text-gray-700">Customer</TableHead>
                        <TableHead className="w-24 font-semibold text-gray-700">Mobile</TableHead>
                        <TableHead className="w-40 font-semibold text-gray-700">Product</TableHead>
                        <TableHead className="w-16 font-semibold text-gray-700 text-center">Qty</TableHead>
                        <TableHead className="w-24 font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="w-28 font-semibold text-gray-700">Date</TableHead>
                        <TableHead className="w-40 font-semibold text-gray-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-blue-50 transition-colors border-b last:border-b-0">
                          <TableCell className="font-medium text-gray-900 py-4">{order.id}</TableCell>
                          <TableCell className="text-gray-800 py-4">{order.fullName}</TableCell>
                          <TableCell className="text-gray-700 py-4">{order.mobile}</TableCell>
                          <TableCell className="text-gray-700 py-4 truncate">{order.product_name || order.product || 'N/A'}</TableCell>
                          <TableCell className="text-gray-700 py-4 text-center font-medium">{order.quantity}</TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${getStatusBadgeColor(order.status)} font-medium`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 py-4">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsInvoiceModalOpen(true);
                                }}
                                className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreOrder(order)}
                                className="gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                              >
                                <RotateCw className="h-4 w-4" />
                                <span className="hidden sm:inline">Restore</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {paginatedOrders.length > 0 && (
                <Pagination
                  page={page}
                  limit={limit}
                  total={filteredOrders.length}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedOrder(null);
          }}
          order={{
            ...selectedOrder,
            product: selectedOrder.product_name || selectedOrder.product || '',
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminReturnOrders;
