import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, Edit, Trash2, Lock, Unlock } from "lucide-react";
import DeliverySettingsModal from "@/components/admin/DeliverySettingsModal";
import { useToast } from "@/hooks/use-toast";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/productService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id?: string;
  name: string;
  price: number;
  delivery_charge: number;
  status: string;
}

const Products = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [commonDeliveryCharge, setCommonDeliveryCharge] = useState<number>(350);
  const DEFAULT_EXTRA_ADDON = 1000;
  const [extraAddOnPrice, setExtraAddOnPrice] = useState<number>(DEFAULT_EXTRA_ADDON);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product>({
    name: "",
    price: 0,
    delivery_charge: 0,
    status: "available",
  });

  const token = localStorage.getItem("adminAuthToken") || "";

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      // Ensure data is an array
      const productsArray = Array.isArray(data) ? data : [];
      setProducts(productsArray);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load products", variant: "destructive" });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // load common delivery charge from localStorage if available
    const saved = localStorage.getItem("commonDeliveryCharge");
    if (saved) {
      const val = Number(saved);
      if (!isNaN(val)) setCommonDeliveryCharge(val);
    }
    const savedAddon = localStorage.getItem("extraAddOnPrice");
    if (savedAddon) {
      const val = Number(savedAddon);
      if (!isNaN(val)) setExtraAddOnPrice(val);
    }
    const savedMode = localStorage.getItem("deliveryEditMode");
    if (savedMode) setEditMode(savedMode === "true");
  }, []);

  // persist settings and apply common delivery charge to listed products
  useEffect(() => {
    localStorage.setItem("commonDeliveryCharge", String(commonDeliveryCharge));
    localStorage.setItem("extraAddOnPrice", String(extraAddOnPrice));
    localStorage.setItem("deliveryEditMode", String(editMode));
    setProducts((prev) => prev.map((p) => ({ ...p, delivery_charge: commonDeliveryCharge })));
  }, [commonDeliveryCharge, extraAddOnPrice, editMode]);

  // Open modal for add/edit
  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: "", price: 0, delivery_charge: commonDeliveryCharge || 0, status: "available" });
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Handle input change
  const handleChange = (field: keyof Product, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Submit add/edit
  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id!, formData, token);
        toast({ title: "Updated", description: "Product updated successfully" });
      } else {
        await createProduct(formData, token);
        toast({ title: "Created", description: "Product created successfully" });
      }
      closeModal();
      loadProducts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Operation failed", variant: "destructive" });
    }
  };

  // Delete product
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(id, token);
      toast({ title: "Deleted", description: "Product deleted successfully" });
      loadProducts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Delete failed", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Products</h1>
            <p className="text-muted-foreground mt-2">Manage your product catalog</p>
          </div>
          <div className="flex items-start gap-4">
            <div>


              <Button className="w-full " onClick={() => setSettingsOpen(true)}>
                <Plus className="w-5 h-5 mr-2" /> Add Delivery price
              </Button>

              <DeliverySettingsModal
                open={settingsOpen}
                onOpenChange={(v) => setSettingsOpen(v)}
                onSave={(vals) => {
                  setCommonDeliveryCharge(vals.commonDeliveryCharge);
                  setExtraAddOnPrice(vals.extraAddOnPrice);
                  setEditMode(vals.editMode);
                  // reflect change in UI for all products
                  setProducts((prev) => prev.map((p) => ({ ...p, delivery_charge: vals.commonDeliveryCharge })));
                  toast({ title: "Saved", description: `Delivery settings updated` });
                }}
              />
            </div>

            <div className="ml-auto flex items-center">
              <Button className="rounded-2xl" onClick={() => openModal()}>
                <Plus className="w-5 h-5 mr-2" /> Add Product
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading products...</div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No products found</p>
                <p className="text-sm mt-2">Click "Add Product" to create your first product</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                Product List ({products.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto overflow-y-hidden -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32 text-left py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Product Name</TableHead>
                        <TableHead className="w-24 sm:w-28 text-center py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Price (Rs.)</TableHead>
                        <TableHead className="w-24 sm:w-28 text-center py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Extra Charge (Rs.)</TableHead>
                        <TableHead className="w-24 sm:w-28 text-center py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Total (Rs.)</TableHead>
                        <TableHead className="w-28 sm:w-32 text-center py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Delivery Charge (Rs.)</TableHead>
                        <TableHead className="w-32 sm:w-36 text-center py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Availability</TableHead>
                        <TableHead className="w-40 sm:w-48 text-center py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium max-w-[10rem] sm:max-w-[16rem] truncate py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm" title={product.name}>{product.name}</TableCell>
                        <TableCell className="text-center font-semibold w-24 sm:w-28 py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                          {product.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center w-28">
                        <div className="flex items-center justify-center gap-2">
                        
                          <Input
                            type="number"
                            className="w-28 rounded-xl text-center"
                            value={extraAddOnPrice}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value || "0", 10) || 0);
                              setExtraAddOnPrice(val);
                            }}
                            disabled={!editMode}
                          />
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-semibold w-28">
                        {(() => {
                          const qty = quantities[product.id || ""] ?? 1;
                          const extraUnits = Math.ceil(Math.max(0, qty - 15) / 15);
                          const addon = extraUnits > 0 ? extraUnits * (extraAddOnPrice || DEFAULT_EXTRA_ADDON) : 0;
                          const total = product.price + addon;
                          return total.toLocaleString();
                        })()}
                      </TableCell>
                      <TableCell className="text-center w-32">
                        <Input
                          type="number"
                          className="w-28 mx-auto rounded-xl text-center"
                          value={commonDeliveryCharge}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value || "0", 10) || 0);
                            setCommonDeliveryCharge(val);
                            // apply to UI list
                            setProducts((prev) => prev.map((p) => ({ ...p, delivery_charge: val })));
                          }}
                          disabled={!editMode}
                        />
                      </TableCell>
                      <TableCell className="text-center w-36">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${product.status === "available"
                              ? "bg-green-100 text-green-700"
                              : product.status === "out-of-stock"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                        >
                          {product.status === "available" ? "Available" :
                            product.status === "out-of-stock" ? "Out of Stock" :
                              "Discontinued"}
                        </span>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => openModal(product)}
                          >
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Add / Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update the product details below" : "Fill in the product information to add a new item to your catalog"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Price and Delivery Charge Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (Rs.) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price || ""}
                    onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_charge">Delivery Charge (Rs.)</Label>
                  <Input
                    id="delivery_charge"
                    type="number"
                    placeholder="0.00"
                    value={formData.delivery_charge || ""}
                    onChange={(e) => handleChange("delivery_charge", parseFloat(e.target.value) || 0)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <Label htmlFor="status">Availability *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger id="status" className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={closeModal} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="rounded-xl">
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Products;
