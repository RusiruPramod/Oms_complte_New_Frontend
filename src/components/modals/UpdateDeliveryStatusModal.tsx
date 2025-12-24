import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle } from "lucide-react";
import React from "react";

interface UpdateDeliveryStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToUpdate: any;
  handleStatusChange: (orderId: string, newStatus: string) => void;
}

const UpdateDeliveryStatusModal: React.FC<UpdateDeliveryStatusModalProps> = ({
  isOpen,
  onClose,
  orderToUpdate,
  handleStatusChange,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-gray-800">Update Delivery Status</DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Choose the new status for order <span className="font-semibold text-gray-800">#{String(orderToUpdate?.id || '').slice(0, 8).toUpperCase()}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer</span>
              <span className="text-sm font-semibold text-gray-900">{orderToUpdate?.fullName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Product</span>
              <span className="text-sm font-medium text-gray-800">{orderToUpdate?.product_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Status</span>
              <span className="text-sm font-medium text-blue-600 capitalize">{orderToUpdate?.status?.replace('-', ' ')}</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 mb-3">Select New Status:</p>
            <button
              onClick={() => handleStatusChange(String(orderToUpdate?.id || ""), "in-transit")}
              disabled={orderToUpdate?.status === "in-transit"}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                orderToUpdate?.status === "in-transit"
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                  : 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    orderToUpdate?.status === "in-transit" ? 'bg-gray-300' : 'bg-blue-500'
                  }`}>
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">In Transit</p>
                    <p className="text-xs text-gray-600">Package is on the way</p>
                  </div>
                </div>
                {orderToUpdate?.status === "in-transit" && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </button>
            <button
              onClick={() => handleStatusChange(String(orderToUpdate?.id || ""), "delivered")}
              disabled={orderToUpdate?.status === "delivered"}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                orderToUpdate?.status === "delivered"
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                  : 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    orderToUpdate?.status === "delivered" ? 'bg-gray-300' : 'bg-green-500'
                  }`}>
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Delivered</p>
                    <p className="text-xs text-gray-600">Successfully delivered to customer</p>
                  </div>
                </div>
                {orderToUpdate?.status === "delivered" && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </button>
            <button
              onClick={() => handleStatusChange(String(orderToUpdate?.id || ""), "returned")}
              disabled={orderToUpdate?.status === "returned"}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                orderToUpdate?.status === "returned"
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                  : 'border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    orderToUpdate?.status === "returned" ? 'bg-gray-300' : 'bg-red-500'
                  }`}>
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Returned</p>
                    <p className="text-xs text-gray-600">Package returned to sender</p>
                  </div>
                </div>
                {orderToUpdate?.status === "returned" && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </button>
          </div>
        </div>
        <DialogFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDeliveryStatusModal;
