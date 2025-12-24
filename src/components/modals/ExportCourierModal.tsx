import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, X } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Order {
  id: string;
  fullName: string;
  address: string;
  mobile: string;
  product: string;
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

interface ExportCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onExport: (selectedOrders: Order[]) => void;
}

export const ExportCourierModal = ({ isOpen, onClose, orders, onExport }: ExportCourierModalProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(orders.map(o => String(o.id))));
  const [selectAll, setSelectAll] = useState(true);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(new Set(orders.map(o => String(o.id))));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(orderId);
    } else {
      newSelectedIds.delete(orderId);
    }
    setSelectedIds(newSelectedIds);
    setSelectAll(newSelectedIds.size === orders.length);
  };

  const handleExport = () => {
    const selectedOrders = orders.filter(order => selectedIds.has(order.id));
    onExport(selectedOrders);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Export Courier Details</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">Select orders to export as PDF document</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              className="h-5 w-5"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-bold text-gray-900 cursor-pointer"
            >
              Select All Orders ({orders.length})
            </label>
          </div>

          {/* Orders List */}
          <ScrollArea className="h-[400px] border-2 border-gray-200 rounded-lg">
            <div className="p-4 space-y-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                    selectedIds.has(String(order.id))
                      ? "bg-green-50 border-green-300"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Checkbox
                    id={`order-${String(order.id)}`}
                    checked={selectedIds.has(String(order.id))}
                    onCheckedChange={(checked) => handleSelectOrder(String(order.id), checked as boolean)}
                    className="h-5 w-5 mt-1"
                  />
                  <label
                    htmlFor={`order-${String(order.id)}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">{order.fullName}</p>
                        <p className="text-sm text-gray-600">
                          Order: #{String(order.id).slice(0, 8).toUpperCase()} • {order.product}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Qty: {order.quantity}</span>
                          <span>•</span>
                          <span>{order.mobile}</span>
                          <span>•</span>
                          <span className="capitalize">{order.status}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          Rs. {((order.price || 1500) * parseInt(order.quantity)).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Selected Count */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700">
              {selectedIds.size} of {orders.length} orders selected
            </p>
            <p className="text-xs text-gray-500">
              Total: Rs.{" "}
              {orders
                .filter((o) => selectedIds.has(o.id))
                .reduce((sum, o) => sum + (o.price || 1500) * parseInt(o.quantity), 0)
                .toLocaleString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedIds.size === 0}
              className="bg-green-600 hover:bg-green-700 px-6 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Export {selectedIds.size} Order{selectedIds.size !== 1 ? "s" : ""} as PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
