import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Building, Phone } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: "Admin",
    email: "admin@nirvaan.lk",
    phone: "070 161 7462",
  });
  const [business, setBusiness] = useState({
    name: "NIRVAAN ENTERPRISES (PVT) LTD",
    registration: "PV 00332270",
    whatsapp: "94701617462",
    address: "Colombo, Sri Lanka",
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    });
  };

  const handleBusinessUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Business Info Updated",
      description: "Business information has been updated successfully",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and business settings</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="rounded-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="rounded-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="rounded-2xl"
                  />
                </div>
                <Button type="submit" className="w-full rounded-2xl">
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const currentPassword = formData.get('currentPassword') as string;
                  const newPassword = formData.get('newPassword') as string;
                  const confirmPassword = formData.get('confirmPassword') as string;

                  if (!currentPassword || !newPassword || !confirmPassword) {
                    toast({
                      title: "Error",
                      description: "All fields are required",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (newPassword !== confirmPassword) {
                    toast({
                      title: "Error",
                      description: "New passwords do not match",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (newPassword.length < 6) {
                    toast({
                      title: "Error",
                      description: "Password must be at least 6 characters long",
                      variant: "destructive",
                    });
                    return;
                  }

                  toast({
                    title: "Password Updated",
                    description: "Your password has been changed successfully",
                  });
                  e.currentTarget.reset();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <Input type="password" name="currentPassword" className="rounded-2xl" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <Input type="password" name="newPassword" className="rounded-2xl" required minLength={6} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <Input type="password" name="confirmPassword" className="rounded-2xl" required minLength={6} />
                </div>
                <Button type="submit" className="w-full rounded-2xl">
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBusinessUpdate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Name</label>
                    <Input
                      value={business.name}
                      onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                      className="rounded-2xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Registration Number</label>
                    <Input
                      value={business.registration}
                      onChange={(e) => setBusiness({ ...business, registration: e.target.value })}
                      className="rounded-2xl"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      WhatsApp Number
                    </label>
                    <Input
                      value={business.whatsapp}
                      onChange={(e) => setBusiness({ ...business, whatsapp: e.target.value })}
                      className="rounded-2xl"
                      placeholder="94xxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Address</label>
                    <Input
                      value={business.address}
                      onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                      className="rounded-2xl"
                    />
                  </div>
                </div>
                <Button type="submit" className="rounded-2xl">
                  Update Business Info
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
