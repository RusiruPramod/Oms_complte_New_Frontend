import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import logo from "@/assets/logo.png";
import productAd from "@/assets/product-ad.jpg";
import { useEffect, useState, useRef } from "react";
import { getProducts } from "@/services/productService";
import jsPDF from "jspdf";

interface Product {
  id?: string;
  name: string;
  price: number;
  delivery_charge: number;
  status: string;
}

interface Order {
  id: string;
  order_id?: string;
  fullName: string;
  address: string;
  mobile: string;
  mobile2?: string;
  product: string;
  product_name?: string;
  product_id?: string;
  quantity: string | number;
  status: string;
  createdAt: string;
  price?: number;
  deliveryCharge?: number;
  discount?: number;
  total_amount?: number;
  notes?: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const InvoiceModal = ({ isOpen, onClose, order }: InvoiceModalProps) => {
  if (!order) return null;

  const [products, setProducts] = useState<Product[]>([]);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Helper function to load image as base64
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 1.0));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = () => {
        // Fallback to product-ad image if image fails to load
        resolve('');
      };
      img.src = url;
    });
  };

  // Get product image from actual product data
  const getProductImage = async (productName: string): Promise<string> => {
    try {
      // Try to find product in products list and get its image
      const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
      if (product && (product as any).image) {
        const imageBase64 = await loadImageAsBase64((product as any).image);
        if (imageBase64) return imageBase64;
      }
    } catch (e) {
      console.error('Failed to load product image:', e);
    }
    // Fallback to product ad image
    return await loadImageAsBase64(productAd);
  };

  // PDF Download Handler with full images
  const handleDownloadPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);
      let yPos = 0;

      // Load images as base64
      const logoBase64 = await loadImageAsBase64(logo);
      const productAdBase64 = await loadImageAsBase64(productAd);

      // Add header banner (full width)
      const headerHeight = 40;
      pdf.addImage(productAdBase64, 'JPEG', 0, yPos, pageWidth, headerHeight);
      
      // Add semi-transparent overlay for better text visibility
      pdf.setFillColor(0, 0, 0);
      pdf.setGState(new pdf.GState({ opacity: 0.6 }));
      pdf.rect(0, yPos, pageWidth, headerHeight, 'F');
      pdf.setGState(new pdf.GState({ opacity: 1 }));

      // Add white box behind logo for better visibility
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, yPos + 8, 28, 24, 3, 3, 'F');
      
      // Add logo on header
      pdf.addImage(logoBase64, 'PNG', margin + 1.5, yPos + 10, 25, 20);
      
      // Add "INVOICE" text with shadow effect
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(26);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', margin + 38, yPos + 20);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Order Management System', margin + 38, yPos + 28);
      
      yPos += headerHeight + 12;

      // Reset text color
      pdf.setTextColor(0, 0, 0);

      // Invoice Details Section
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(34, 139, 34); // Green
      pdf.text('INVOICE DETAILS', margin, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Invoice Number: INV-${String(order.id).slice(0, 8)}`, margin, yPos);
      yPos += 5;
      pdf.text(`Order Number: #${String(order.id).slice(0, 8)}`, margin, yPos);
      yPos += 5;
      pdf.text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, margin, yPos);
      yPos += 5;
      pdf.text('Payment Method: Cash on Delivery', margin, yPos);
      yPos += 5;
      pdf.text(`Order Status: ${order.status.toUpperCase()}`, margin, yPos);
      yPos += 10;

      // Customer Details
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(34, 139, 34);
      pdf.text('CUSTOMER DETAILS', margin, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${order.fullName}`, margin, yPos);
      yPos += 5;
      pdf.text(`Phone: ${order.mobile}`, margin, yPos);
      yPos += 5;
      if (order.mobile2) {
        pdf.text(`Alternate Phone: ${order.mobile2}`, margin, yPos);
        yPos += 5;
      }
      pdf.text(`Address: ${order.address}`, margin, yPos, { maxWidth: contentWidth });
      yPos += 10;

      // Order Items Header
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(34, 139, 34);
      pdf.text('ORDER ITEMS', margin, yPos);
      yPos += 7;

      // Table Header
      pdf.setFillColor(240, 255, 240);
      pdf.rect(margin, yPos - 5, contentWidth, 8, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(34, 139, 34);
      pdf.text('PRODUCT', margin + 2, yPos);
      pdf.text('QTY', margin + contentWidth - 60, yPos);
      pdf.text('PRICE', margin + contentWidth - 40, yPos);
      pdf.text('TOTAL', margin + contentWidth - 20, yPos);
      yPos += 8;

      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');

      // Product Items with images
      for (let i = 0; i < productItems.length; i++) {
        const item = productItems[i];
        
        // Load product-specific image (or fallback to default)
        const productImageBase64 = await getProductImage(item.name);
        
        // Add product image with border (full quality)
        const imgSize = 16; // Size in mm
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, yPos, imgSize, imgSize, 2, 2, 'S');
        pdf.addImage(productImageBase64, 'JPEG', margin + 0.5, yPos + 0.5, imgSize - 1, imgSize - 1);
        
        // Product details
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(item.name, margin + imgSize + 4, yPos + 6);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`SKU: PRD-${String(order.id).slice(0, 6)}-${i + 1}`, margin + imgSize + 4, yPos + 11);
        
        // Quantity, Price, Total (properly aligned)
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        const qtyX = margin + contentWidth - 75;
        const priceX = margin + contentWidth - 50;
        const totalX = margin + contentWidth - 2;
        
        pdf.text(String(item.quantity), qtyX, yPos + 9, { align: 'center' });
        pdf.text(`Rs. ${item.price.toLocaleString()}`, priceX, yPos + 9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(34, 139, 34);
        pdf.text(`Rs. ${(item.price * item.quantity).toLocaleString()}`, totalX, yPos + 9, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        yPos += imgSize + 6;
        
        // Add separator line
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.2);
        pdf.line(margin, yPos, margin + contentWidth, yPos);
        yPos += 4;
      }

      yPos += 3;

      // Totals Section with proper spacing and alignment
      const totalsBoxX = pageWidth - margin - 70;
      const totalsBoxWidth = 70;
      const totalsBoxHeight = discount > 0 ? 38 : 33;
      
      // Background box for totals
      pdf.setFillColor(245, 255, 245);
      pdf.setDrawColor(34, 139, 34);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(totalsBoxX, yPos, totalsBoxWidth, totalsBoxHeight, 2, 2, 'FD');
      
      yPos += 6;
      const labelX = totalsBoxX + 5;
      const valueX = totalsBoxX + totalsBoxWidth - 5;
      
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Subtotal:', labelX, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Rs. ${subtotal.toLocaleString()}`, valueX, yPos, { align: 'right' });
      yPos += 6;
      
      pdf.setTextColor(80, 80, 80);
      pdf.text('Delivery:', labelX, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Rs. ${deliveryCharge.toLocaleString()}`, valueX, yPos, { align: 'right' });
      yPos += 6;
      
      if (discount > 0) {
        pdf.setTextColor(34, 139, 34);
        pdf.text('Discount:', labelX, yPos);
        pdf.text(`- Rs. ${discount.toLocaleString()}`, valueX, yPos, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
        yPos += 6;
      }
      
      // Separator line
      pdf.setDrawColor(34, 139, 34);
      pdf.setLineWidth(0.5);
      pdf.line(labelX, yPos, valueX, yPos);
      yPos += 7;
      
      // Grand Total with proper spacing
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Grand Total:', labelX, yPos);
      pdf.setTextColor(34, 139, 34);
      pdf.text(`Rs. ${grandTotal.toLocaleString()}`, valueX, yPos, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      
      yPos += 10;

      // Footer
      yPos = pageHeight - 25;
      pdf.setFillColor(240, 255, 240);
      pdf.rect(margin, yPos, contentWidth, 15, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const footerText = 'Thank you for your business! This is a computer-generated invoice and does not require a signature.';
      pdf.text(footerText, pageWidth / 2, yPos + 5, { align: 'center', maxWidth: contentWidth - 10 });
      pdf.text('For any queries, please contact our support team.', pageWidth / 2, yPos + 10, { align: 'center' });

      // Save PDF
      pdf.save(`invoice-${order.order_id || order.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Load products to get real prices
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts();
        const productsArray = Array.isArray(data) ? data : [];
        setProducts(productsArray);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
      }
    };
    
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  // Helper function to get product price by name
  const getProductPrice = (productName: string): number => {
    const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    return product ? product.price : 1000; // Fallback to 1000 if not found
  };

  // Parse product data for multiple products
  const getProductItems = () => {
    const productName = order.product_name || order.product || '';
    
    // Check if multiple products
    if (productName.includes(',')) {
      const names = productName.split(',').map(name => name.trim());
      let productData: Array<{ id: string; name: string; quantity: number; price: number }> = [];
      
      // Try to parse from notes field - look for products array with prices
      if (order.notes) {
        try {
          const notesData = JSON.parse(order.notes);
          if (notesData.products && Array.isArray(notesData.products)) {
            // Use the complete product details from notes
            productData = notesData.products;
          } else if (notesData.quantities) {
            // Fallback: parse quantities and fetch prices from products list
            const qtys = JSON.parse(notesData.quantities);
            productData = names.map((name, index) => ({
              id: qtys[index]?.id || '',
              name: name,
              quantity: qtys[index]?.quantity || 1,
              price: getProductPrice(name) // Fetch real price from products
            }));
          }
        } catch (e) {
          console.error('Failed to parse notes:', e);
        }
      }
      
      // If we have product data, use it
      if (productData.length > 0) {
        return productData.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price || getProductPrice(item.name) // Fetch real price if not stored
        }));
      }
      
      // Fallback: create items from names with real prices
      return names.map(name => ({
        name,
        quantity: 1,
        price: getProductPrice(name) // Fetch real price from products
      }));
    }
    
    // Single product
    return [{
      name: productName,
      quantity: typeof order.quantity === 'number' ? order.quantity : parseInt(order.quantity) || 1,
      price: getProductPrice(productName) // Fetch real price from products
    }];
  };

  const productItems = getProductItems();
  
  // Calculate totals
  const subtotal = order.total_amount 
    ? (order.total_amount - (order.deliveryCharge || 350))
    : productItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const deliveryCharge = order.deliveryCharge || 350;
  const discount = order.discount || 0;
  const grandTotal = order.total_amount || (subtotal + deliveryCharge - discount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden p-0 w-[95vw] sm:w-full">
        <div className="overflow-y-auto max-h-[95vh]" ref={invoiceRef}>
          {/* Header Cover Banner */}
          <div className="relative h-24 sm:h-32">
            <img 
              src={productAd} 
              alt="Header Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 flex items-center justify-between px-3 sm:px-8">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="bg-white p-1 sm:p-2 rounded-lg shadow-lg">
                  <img src={logo} alt="Company Logo" className="h-8 sm:h-12 w-auto" />
                </div>
                <div className="text-white">
                  <h2 className="text-xl sm:text-3xl font-bold">INVOICE</h2>
                  <p className="text-xs sm:text-sm opacity-90">Order Management System</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-white">
            {/* Invoice Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-green-100">
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-3">INVOICE DETAILS</h3>
                  <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-semibold">INV-{String(order.id).slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-semibold">#{String(order.id).slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold text-green-600">Cash on Delivery</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-3">ORDER STATUS</h3>
                <div className="space-y-2">
                  <Badge 
                    className="text-sm px-4 py-1 bg-green-100 text-green-700 border-green-200" 
                    variant="outline"
                  >
                    {order.status.toUpperCase()}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-2">
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Delivery Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-green-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-green-600 rounded"></span>
                  CUSTOMER DETAILS
                </h3>
                <div className="space-y-2 text-sm bg-green-50 p-4 rounded-lg border border-green-100">
                  <div>
                    <p className="text-gray-500 text-xs">Customer Name</p>
                    <p className="font-semibold text-gray-900">{order.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Phone Number</p>
                    <p className="font-semibold text-gray-900">{order.mobile}</p>
                  </div>
                  {order.mobile2 && (
                    <div>
                      <p className="text-gray-500 text-xs">Alternate Phone</p>
                      <p className="font-semibold text-gray-900">{order.mobile2}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 text-xs">Delivery Address</p>
                    <p className="font-semibold text-gray-900">{order.address}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-green-600 rounded"></span>
                  COURIER DETAILS
                </h3>
                <div className="space-y-2 text-sm bg-green-50 p-4 rounded-lg border border-green-100">
                  <div>
                    <p className="text-gray-500 text-xs">Barcode Number</p>
                    <p className="font-semibold text-gray-900 font-mono">{order.order_id || 'ORD-' + String(order.id).slice(0, 10)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="pb-4 sm:pb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-green-600 rounded"></span>
                ORDER ITEMS
              </h3>
              <div className="border border-green-100 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-green-50 border-b border-green-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-green-700">PRODUCT</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-green-700">QTY</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-green-700">UNIT PRICE</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-green-700">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productItems.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-green-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-green-100">
                              <img src={productAd} alt="Product" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">SKU: PRD-{String(order.id).slice(0, 6)}-{index + 1}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-4 text-right text-gray-900">Rs. {item.price.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right font-semibold text-green-600">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end pb-4 sm:pb-6 border-b border-green-100">
              <div className="w-full sm:w-80 space-y-2 sm:space-y-3 bg-green-50 p-3 sm:p-4 rounded-lg border border-green-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Charge:</span>
                  <span className="font-semibold">Rs. {deliveryCharge.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span className="font-semibold">- Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                <Separator className="bg-green-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Grand Total:</span>
                  <span className="text-green-600">Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            

            {/* Footer Note */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                Thank you for your business! This is a computer-generated invoice and does not require a signature.
                <br />
                For any queries, please contact our support team.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-green-100">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 border-green-300 text-green-700 hover:bg-green-50"
              >
                Close
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="bg-green-600 hover:bg-green-700 px-6 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
