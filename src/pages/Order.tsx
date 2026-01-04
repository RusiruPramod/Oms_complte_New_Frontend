import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import productAd from "@/assets/product-ad.jpg";
import { Star, Package, Clock, Shield } from "lucide-react";
import { createOrder } from "@/services/orderService";
import { createInquiry } from "@/services/inquiryService";
import { getProducts } from "@/services/productService";

interface Product {
  id: string;
  name: string;
  price: number;
  delivery_charge: number;
  status: string;
}

const testimonials = [
  { name: "නිමල් පෙරේරා", rating: 5, text: "මාස 2ක් භාවිතා කරපු පසු ඉතා හොඳ ප්‍රතිඵල දැක්කා. මිල වටිනවා!" },
  { name: "සුනිල් රත්නායක", rating: 5, text: "ඉතාමත් ඵලදායී නිෂ්පාදනයක්. පවුලේ හැමෝම භාවිතා කරනවා." },
  { name: "ප්‍රියංකා සිල්වා", rating: 5, text: "ස්වභාවික හා අතුරු ආබාධ නැති විශිෂ්ට නිෂ්පාදනයක්." },
  { name: "කමල් ජයසිංහ", rating: 5, text: "මාස 3කින් සම්පූර්ණ සුවයක් ලැබුණා. ස්තූතියි!" },
];

const Order = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const orderFormRef = useRef<HTMLDivElement>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [multipleMode, setMultipleMode] = useState(true); // Always use multiple mode for better UX
  const [selectedProductsMultiple, setSelectedProductsMultiple] = useState<Array<{ id: string; quantity: number }>>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    mobile: "",
    mobile2: "",
    product: "",
    quantity: "",
  });
  const [inquiry, setInquiry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [showAdditionalMobile, setShowAdditionalMobile] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Totals calculation (single or multiple) - delivery charge is applied once per order
  const totals = useMemo(() => {
    const zero = { subtotal: 0, deliveryTotal: 0, extraCharge: 0, grandTotal: 0 };
    // read common delivery charge from settings (fallback to 350)
    const commonDeliveryCharge = parseFloat(localStorage.getItem("commonDeliveryCharge") ?? "350") || 350;
    const extraAddOnPrice = parseFloat(localStorage.getItem("extraAddOnPrice") ?? "1000") || 1000;

    if (!multipleMode) {
      if (!selectedProduct) return zero;
      const qty = Math.max(1, parseInt(formData.quantity || "1"));
      const subtotal = Number(selectedProduct.price) * qty;
      const deliveryTotal = qty < 15 ? commonDeliveryCharge : 0;
      
      // Calculate extra charge for quantities > 15 (per 15 units after first 15)
      const extraUnits = Math.ceil(Math.max(0, qty - 15) / 15);
      const extraCharge = extraUnits > 0 ? extraUnits * extraAddOnPrice : 0;
      
      return { subtotal, deliveryTotal, extraCharge, grandTotal: subtotal + deliveryTotal + extraCharge };
    }

    // multiple mode: calculate total quantity across selected products
    if (!selectedProductsMultiple || selectedProductsMultiple.length === 0) return zero;
    let subtotal = 0;
    let totalQty = 0;
    for (const sel of selectedProductsMultiple) {
      const prod = products.find((p) => p.id === sel.id);
      if (!prod) continue;
      subtotal += Number(prod.price) * sel.quantity;
      totalQty += sel.quantity;
    }
    const deliveryTotal = totalQty < 15 ? commonDeliveryCharge : 0;
    
    // Calculate extra charge for total quantities > 15
    const extraUnits = Math.ceil(Math.max(0, totalQty - 15) / 15);
    const extraCharge = extraUnits > 0 ? extraUnits * extraAddOnPrice : 0;
    
    return { subtotal, deliveryTotal, extraCharge, grandTotal: subtotal + deliveryTotal + extraCharge };
  }, [multipleMode, selectedProduct, formData.quantity, selectedProductsMultiple, products]);

  // Load products function (can be called multiple times)
  const loadProducts = async () => {
    try {
      const data = await getProducts();
      const productsArray = Array.isArray(data) ? data : [];
      // Filter only available products
      const availableProducts = productsArray.filter((p: Product) => p.status === 'available');
      setProducts(availableProducts);
      
      // Set first product as default if available and no product is selected
      if (availableProducts.length > 0 && !formData.product) {
        setFormData(prev => ({ ...prev, product: availableProducts[0].id }));
        setSelectedProduct(availableProducts[0]);
      } else if (formData.product) {
        // Update selected product reference if it exists in new data
        const currentProduct = availableProducts.find(p => p.id === formData.product);
        if (currentProduct) {
          setSelectedProduct(currentProduct);
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Reload products when window gains focus (user comes back to page)
  useEffect(() => {
    const handleFocus = () => {
      loadProducts();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Update selected product when form product changes
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormData({ ...formData, product: productId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Send order to backend API
      const payload: any = {
        fullName: formData.fullName,
        address: formData.address,
        mobile: formData.mobile,
        mobile2: formData.mobile2 || "",
        status: "received",
      };

      if (!multipleMode) {
        payload.product_id = formData.product;
        payload.quantity = parseInt(formData.quantity);
      } else {
        // For multiple mode send a CSV of product ids and include quantities as JSON string
        payload.product_id = selectedProductsMultiple.map((s) => s.id).join(",");
        payload.quantity = JSON.stringify(selectedProductsMultiple.map((s) => ({ id: s.id, quantity: s.quantity })));
      }

      const result = await createOrder(payload);

      console.log('Order created successfully:', result);

      toast({
        title: "ඇණවුම සාර්ථකයි!",
        description: `ඔබගේ ඇණවුම් අංකය: ${result.order_id || result.orderId || ''}` || "ඔබගේ ඇණවුම අප වෙත ලැබී ඇත. ඉක්මනින් සම්බන්ධ වෙමු.",
      });

      // Reset form to initial state
      setFormData({
        fullName: "",
        address: "",
        mobile: "",
        mobile2: "",
        product: products.length > 0 ? products[0].id : "",
        quantity: "1",
      });
      setShowAdditionalMobile(false);
      
      // Reset selected product to first product
      if (products.length > 0) {
        setSelectedProduct(products[0]);
      }
      // reset multiple selections
      setSelectedProductsMultiple([]);
      // always keep multiple mode
      setMultipleMode(true);
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast({
        title: "දෝෂයක්",
        description: error.message || "ඇණවුම සාර්ථක නොවීය. නැවත උත්සාහ කරන්න.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Send inquiry to backend API
      const result = await createInquiry({ message: inquiry });
      console.log('Inquiry submitted successfully:', result);

      toast({
        title: "විමසුම ලැබී ඇත",
        description: "අපි ඉක්මනින් ඔබව සම්බන්ධ කරගන්නෙමු.",
      });

      setInquiry("");
    } catch (error: any) {
      console.error('Inquiry submission error:', error);
      toast({
        title: "දෝෂයක්",
        description: error.message || "විමසුම යැවීම අසාර්ථක විය. නැවත උත්සාහ කරන්න.",
        variant: "destructive",
      });
    }
  };

  // Auto-scroll testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Hide/show header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show header at the top
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        setShowHeader(false);
      } else {
        // Scrolling up - show header
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Auto-scroll to order form on mobile devices
  useEffect(() => {
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    
    if (isMobile && orderFormRef.current) {
      // Use requestAnimationFrame for better timing
      const scrollToForm = () => {
        setTimeout(() => {
          orderFormRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 100);
      };

      // Try multiple times to ensure it works
      const timer1 = setTimeout(scrollToForm, 500);
      const timer2 = setTimeout(scrollToForm, 1000);
      const timer3 = setTimeout(scrollToForm, 2000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className={`bg-white shadow-md sticky top-0 z-50 transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="Logo" className="h-16 w-auto" />
          <Button
            variant="outline"
            onClick={() => navigate("/admin/login")}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Admin Login
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            ටිනියා රෝගීන්
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8">
            10,000 වැඩි සංඛ්‍යාවක් සුව ලත් කළ ආයුර්වේදික ආලේපය
          </p>
          <img
            src={productAd}
            alt="Product"
            className="w-full max-w-3xl mx-auto rounded-2xl shadow-2xl"
          />
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">100% ස්වභාවික</h3>
              <p className="text-sm text-muted-foreground">රසායනික නොමැත</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">නොමිලේ බෙදාහැරීම</h3>
              <p className="text-sm text-muted-foreground">දිවයින පුරා</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">වේගවත් බෙදාහැරීම</h3>
              <p className="text-sm text-muted-foreground">දින 3-5 තුළ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">තත්ත්ව සහතිකය</h3>
              <p className="text-sm text-muted-foreground">පරීක්ෂා කළ</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Order Form */}
          <div ref={orderFormRef} className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">ඔබගේ ඇණවුම කරන්න</h2>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">සම්පූර්ණ නම</label>
                    <Input
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="ඔබගේ නම ඇතුලත් කරන්න"
                      className="rounded-2xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">බෙදාහැරීමේ ලිපිනය</label>
                    <Textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="සම්පූර්ණ ලිපිනය ඇතුලත් කරන්න"
                      className="rounded-2xl"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ජංගම දුරකථන</label>
                    <div className="flex items-center justify-between mb-2">
                      <Input
                        required
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="07xxxxxxxx"
                        className="rounded-2xl flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdditionalMobile((v) => !v)}
                        aria-expanded={showAdditionalMobile}
                        aria-controls="additional-mobile"
                        className="ml-2 px-2 py-1 rounded-[12px] border bg-white text-lg"
                        title={showAdditionalMobile ? "Remove additional number" : "Add another number"}
                      >
                        {showAdditionalMobile ? "−" : "+"}
                      </button>
                    </div>

                    {showAdditionalMobile && (
                      <div id="additional-mobile" className="mt-2">
                        <Input
                          type="tel"
                          value={formData.mobile2}
                          onChange={(e) => setFormData({ ...formData, mobile2: e.target.value })}
                          placeholder="විකල්ප - 07xxxxxxxx"
                          className="rounded-2xl"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => setListOpen((v) => !v)}
                        aria-expanded={listOpen}
                        aria-controls="product-list"
                        className="block text-sm font-medium text-left"
                      >
                        නිෂ්පාදනය තෝරන්න
                      </button>
                      <div className="flex items-center text-sm gap-2">
                        {/* <button
                          type="button"
                          onClick={() => setListOpen((v) => !v)}
                          aria-expanded={listOpen}
                          className="px-3 py-1 rounded-md border bg-white text-sm"
                        >
                          {listOpen ? "Collapse" : "Expand"}
                        </button> */}
                        {/* <input
                          type="checkbox"
                          checked={multipleMode}
                          onChange={(e) => {
                            setMultipleMode(e.target.checked);
                            if (!e.target.checked) {
                              setSelectedProductsMultiple([]);
                        
                            } else {
                              
                              setFormData((prev) => ({ ...prev, product: "" }));
                              setSelectedProduct(null);
                            }
                          }}
                        /> */}
                        {/* <span>Multiple products</span> */}
                      </div>
                    </div>

                      {/* Clickable summary input toggles the product list */}
                      <div className="mt-2">
                        <Input
                          readOnly
                          value={
                            selectedProductsMultiple && selectedProductsMultiple.length > 0
                              ? selectedProductsMultiple
                                  .map((s) => {
                                    const prod = products.find((p) => p.id === s.id);
                                    return prod ? `${prod.name} (රු.${prod.price.toLocaleString()})` : s.id;
                                  })
                                  .join(", ")
                              : ""
                          }
                          placeholder="නිෂ්පාදනයක් තෝරන්න"
                          onClick={() => setListOpen((v) => !v)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setListOpen((v) => !v);
                          }}
                          className="rounded-2xl cursor-pointer"
                        />
                      </div>

                      {listOpen ? (
                      <div id="product-list" className="mt-2 space-y-2">
                        {/* Scroll indicator for more products */}
                        {products.length > 3 && (
                          <div className="text-center text-xs text-muted-foreground py-1 bg-blue-50 rounded-t-md border border-b-0 animate-pulse">
                            ↓ පහළට ගොස් තවත් නිෂ්පාදන බලන්න ↓
                          </div>
                        )}
                        
                        <div className="max-h-[240px] overflow-y-auto rounded-md border p-2 bg-white">
                          {products.map((product) => {
                            const selectedEntry = selectedProductsMultiple.find((s) => s.id === product.id);
                            return (
                              <div key={product.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-gray-50">
                                <label className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedEntry}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedProductsMultiple((prev) => [...prev, { id: product.id, quantity: 1 }]);
                                      } else {
                                        setSelectedProductsMultiple((prev) => prev.filter((p) => p.id !== product.id));
                                      }
                                    }}
                                  />
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-muted-foreground">රු. {product.price.toLocaleString()}</div>
                                  </div>
                                </label>

                                    {selectedEntry && (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={1}
                                      value={selectedEntry.quantity || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const q = val === "" ? 0 : Math.max(1, parseInt(val));
                                        setSelectedProductsMultiple((prev) => prev.map((it) => (it.id === product.id ? { ...it, quantity: q } : it)));
                                      }}
                                      placeholder="ගණන"
                                      className="w-16 rounded-md border px-2 py-1 text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Show summary for multiple selection */}
                        {selectedProductsMultiple.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl space-y-2">
                            {selectedProductsMultiple.map((sel) => {
                              const prod = products.find((p) => p.id === sel.id)!;
                              return (
                                <div key={sel.id} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700">{prod.name} × {sel.quantity}</span>
                                  <span className="font-semibold">රු. {(prod.price * sel.quantity).toLocaleString()}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

               

                  {/* Total Amount Calculation */}
                  {(selectedProduct || selectedProductsMultiple.length > 0) ? (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">මුළු මුදල ගණනය</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">නිෂ්පාදන මිල:</span>
                          <span className="font-medium">රු. {totals.subtotal.toLocaleString()}</span>
                        </div>
                        {totals.extraCharge > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">අමතර ගාස්තුව (15+):</span>
                            <span className="font-medium text-orange-600">රු. {totals.extraCharge.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">බෙදාහැරීමේ ගාස්තුව:</span>
                          <span className="font-medium">රු. {totals.deliveryTotal.toLocaleString()}</span>
                        </div>
                        <div className="border-t-2 border-green-300 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-bold text-gray-800">මුළු මුදල:</span>
                            <span className="text-xl font-bold text-green-600">රු. {totals.grandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <Button 
                    type="submit" 
                    className="w-full rounded-2xl h-12 text-lg font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "ඇණවුම කරමින්..." : "ඇණවුම කරන්න"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Testimonials */}
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-center">පාරිභෝගික අදහස්</h3>
                <div className="space-y-4">
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      className={`transition-all duration-500 ${
                        index === currentTestimonial
                          ? "opacity-100 transform scale-100"
                          : "opacity-0 h-0 overflow-hidden transform scale-95"
                      }`}
                    >
                      {index === currentTestimonial && (
                        <div className="bg-muted rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                            ))}
                          </div>
                          <p className="text-sm mb-2">{testimonial.text}</p>
                          <p className="text-xs font-semibold text-primary">- {testimonial.name}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inquiry Form */}
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-center">විමසුම් / ගැටළු</h3>
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <Textarea
                    required
                    value={inquiry}
                    onChange={(e) => setInquiry(e.target.value)}
                    placeholder="ඔබගේ විමසුම හෝ ගැටළුව මෙහි ලියන්න..."
                    className="rounded-2xl"
                    rows={4}
                  />
                  <Button type="submit" variant="outline" className="w-full rounded-2xl">
                    යවන්න
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-semibold">NIRVAAN ENTERPRISES (PVT) LTD</p>
          <p className="text-sm mt-2">ලියාපදිංචි අංකය: PV 00332270</p>
          <p className="text-sm mt-2">දුරකථන: 070 161 7462</p>
        </div>
      </footer>
    </div>
  );
};

export default Order;
