import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { loginUser } from "@/services/authService";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Trim email and password before sending
      const email = formData.email.trim();
      const password = formData.password.trim();
      const res = await loginUser({ email, password });
      
      // Check if response is valid
      if (res && res.success && res.token && res.user) {
        const userRole = res.user.role;
        
        // Handle different user roles
        if (userRole === "admin") {
          localStorage.setItem("adminAuthToken", res.token);
          toast({ title: "Login Successful", description: "Welcome to admin dashboard" });
          navigate("/admin/dashboard");
        } else if (userRole === "courier") {
          localStorage.setItem("courierAuthToken", res.token);
          toast({ title: "Login Successful", description: "Welcome to courier dashboard" });
          navigate("/courier/dashboard");
        } else {
          toast({ 
            title: "Access Denied", 
            description: `Access not allowed for role: ${userRole}`, 
            variant: "destructive" 
          });
        }
      } else {
        toast({ 
          title: "Login Failed", 
          description: res?.message || "Invalid credentials", 
          variant: "destructive" 
        });
      }
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      {/* Top-left back button */}
      <Button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-10 right-20 z-40 text-sm rounded-md"
        aria-label="Back to landing page"
      >
        ← Back to landing
      </Button>

      <Card className="w-full max-w-md shadow-2xl">
       
        <CardHeader className="text-center">
          <img src={logo} alt="Logo" className="h-24 w-auto mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold">Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Admin & Courier Portal</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className="rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                className="rounded-2xl"
              />
            </div>

            <Button type="submit" className="w-full rounded-2xl h-12 text-lg font-semibold" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
