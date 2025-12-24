import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Phone, Package, Calendar, CheckCircle, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getOrderById, updateOrderStatus } from "@/services/orderService";
import { getProducts } from "@/services/productService";

interface Product {
  id: string;
  product_id: string;
  name: string;
  price: number;
  delivery_charge: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_id?: string;
  fullName: string;
  address: string;
  mobile: string;
  product: string; // Can be single product_id or CSV of product_ids
  product_id?: string;
  product_name?: string;
  quantity: string; // Can be single number or JSON string
  status: string;
  createdAt: string;
  total_amount?: number;
  notes?: string; // May contain JSON with product_ids and quantities for multiple products
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const token = localStorage.getItem("adminAuthToken") || "";

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Parse order items from order data
  useEffect(() => {
    if (!order || products.length === 0) return;

    const items: OrderItem[] = [];

    try {
      // Check if notes contain product IDs for multiple products
      let productField = order.product_id || order.product || "";
      let quantityField = order.quantity || "1";
      
      // Try to parse from notes if product_id is null (multiple products case)
      if (!productField && order.notes) {
        try {
          const notesData = JSON.parse(order.notes);
          if (notesData.product_ids && notesData.quantities) {
            productField = notesData.product_ids;
            quantityField = notesData.quantities;
          }
        } catch (e) {
          // Notes is not JSON, continue with regular parsing
        }
      }

      if (productField.includes(",")) {
        // Multiple products mode
        const productIds = productField.split(",").map((id) => id.trim());
        
        // Try to parse quantity as JSON
        let quantities: Array<{ id: string; quantity: number }> = [];
        try {
          quantities = JSON.parse(quantityField);
        } catch {
          // If parsing fails, assume equal quantity of 1 for each product
          quantities = productIds.map((id) => ({ id, quantity: 1 }));
        }

        productIds.forEach((productId, index) => {
          const product = products.find((p) => p.id === productId || p.product_id === productId);
          const quantityData = quantities.find((q) => q.id === productId);
          const quantity = quantityData?.quantity || 1;

          if (product) {
            items.push({
              productId: product.id,
              productName: product.name,
              quantity: quantity,
              price: product.price,
            });
          }
        });
      } else {
        // Single product mode
        const product = products.find((p) => p.id === productField || p.product_id === productField);
        const quantity = parseInt(quantityField) || 1;

        if (product) {
          items.push({
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            price: product.price,
          });
        } else if (order.product_name) {
          // Fallback: use product_name from order if product not found
          items.push({
            productId: productField,
            productName: order.product_name,
            quantity: quantity,
            price: 10000, // Default price
          });
        }
      }
    } catch (error) {
      console.error("Error parsing order items:", error);
    }

    setOrderItems(items);
  }, [order, products]);

  // Fetch order from API
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getOrderById(id, token);
        setOrder(data);
      } catch (error: any) {
        console.error("Error fetching order:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch order details",
          variant: "destructive",
        });
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleSendToCourier = async () => {
    if (!order) return;
    
    try {
      await updateOrderStatus(order.id, "sended", token);
      setOrder({ ...order, status: "sended" });
      
      toast({
        title: "Sent to Courier",
        description: "Order has been sent to courier successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Order not found</p>
          <Button className="mt-4" onClick={() => navigate("/admin/orders")}>
            Back to Orders
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const timeline = [
    { status: "received", label: "Order Placed", date: order.createdAt },
    {
      status: "received",
      label: "Order Received",
      date: order.status === "received" || order.status === "issued" ? order.createdAt : null,
    },
    {
      status: "issued",
      label: "Order Issued",
      date: order.status === "issued" ? order.createdAt : null,
    },
  ];

  // Calculate total quantity and amount
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = order.total_amount || orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/orders")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Order Details</h1>
            <p className="text-muted-foreground mt-1">Order ID: {order.id}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.fullName}</p>
                    <p className="text-sm text-muted-foreground">{order.mobile}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">{order.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="p-4 bg-muted rounded-xl text-center text-muted-foreground">
                    No items found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-muted rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              Rs. {item.price.toLocaleString()} each
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">Qty: {item.quantity}</p>
                          <p className="text-sm text-muted-foreground">
                            Rs. {(item.quantity * item.price).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.date
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.date && <CheckCircle className="w-5 h-5" />}
                        {!item.date && <div className="w-3 h-3 rounded-full bg-current" />}
                      </div>
                      <div className="flex-1 pb-4 border-l-2 border-muted pl-4 ml-5 -mt-2">
                        <p className="font-semibold">{item.label}</p>
                        {item.date && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge>{order.status}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Order Date</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{totalQuantity}</span>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                </div>

{order.status !== "sended" && order.status !== "in-transit" && order.status !== "delivered" && (
                  <Button
                    className="w-full rounded-2xl mb-3 bg-primary hover:bg-primary/90"
                    onClick={handleSendToCourier}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Send to Courier
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full rounded-2xl"
                  onClick={() => {
                    // Build product details for WhatsApp message
                    const productDetails = orderItems
                      .map((item) => `${item.productName} - ප්‍රමාණය: ${item.quantity}`)
                      .join("\n");
                    
                    const message = `නව ඇණවුමක්!\n\nනම: ${order.fullName}\nදුරකථන: ${order.mobile}\nලිපිනය: ${order.address}\n\nනිෂ්පාදන:\n${productDetails}\n\nමුළු ප්‍රමාණය: ${totalQuantity}\nමුළු මුදල: Rs. ${totalAmount.toLocaleString()}`;
                    window.open(`https://wa.me/94701617462?text=${encodeURIComponent(message)}`, "_blank");
                  }}
                >
                  Send to WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderDetails;
