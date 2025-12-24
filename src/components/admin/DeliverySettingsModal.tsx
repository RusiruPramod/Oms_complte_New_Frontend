import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (vals: { commonDeliveryCharge: number; extraAddOnPrice: number; editMode: boolean }) => void;
}

export default function DeliverySettingsModal({ open, onOpenChange, onSave }: Props) {
  const DEFAULT_EXTRA = 1000;
  const [commonDeliveryCharge, setCommonDeliveryCharge] = useState<number>(350);
  const [extraAddOnPrice, setExtraAddOnPrice] = useState<number>(DEFAULT_EXTRA);
  const [editMode, setEditMode] = useState<boolean>(false);

  useEffect(() => {
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
  }, [open]);

  const handleSave = () => {
    localStorage.setItem("commonDeliveryCharge", String(commonDeliveryCharge));
    localStorage.setItem("extraAddOnPrice", String(extraAddOnPrice));
    localStorage.setItem("deliveryEditMode", String(editMode));
    onSave?.({ commonDeliveryCharge, extraAddOnPrice, editMode });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delivery Settings</DialogTitle>
          <DialogDescription>Set common delivery charge, extra add-on price and edit mode.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-sm">Common Delivery Charge</Label>
            <Input
              type="number"
              className="mt-2 w-full rounded-xl"
              value={commonDeliveryCharge}
              onChange={(e) => setCommonDeliveryCharge(parseFloat(e.target.value || "0") || 0)}
            />
          </div>

          <div>
            <Label className="text-sm">Extra Add-on Price</Label>
            <Input
              type="number"
              className="mt-2 w-full rounded-xl"
              value={extraAddOnPrice}
              onChange={(e) => setExtraAddOnPrice(parseFloat(e.target.value || "0") || 0)}
            />
          </div>

          <div>
            <Label className="text-sm">Mode</Label>
            <div className="mt-2">
              <Button
                variant={editMode ? undefined : "outline"}
                className="rounded-full w-full flex items-center justify-center gap-2"
                onClick={() => setEditMode((s) => !s)}
              >
                {editMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{editMode ? "Edit Mode" : "Locked"}</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSave} className="rounded-xl">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
