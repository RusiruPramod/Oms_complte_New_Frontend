import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import {
  LogOut,
  Menu,
  Truck,
  Package,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

interface CourierLayoutProps {
  children: ReactNode;
}

const courierMenuItems = [
  { icon: Truck, label: "My Deliveries", path: "/courier/dashboard" },
  { icon: Package, label: "Return Orders", path: "/courier/returns" },
];

const CourierLayout = ({ children }: CourierLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for courier JWT token
    const courierToken = localStorage.getItem("courierAuthToken");

    // Route protection - only courier users can access
    if (!courierToken) {
      navigate("/admin/login");
      return;
    }

    // Prevent admin users from accessing courier pages
    const adminToken = localStorage.getItem("adminAuthToken");
    if (adminToken && !courierToken) {
      navigate("/admin/dashboard");
    }
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem("courierAuthToken");
    navigate("/admin/login");
  };

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-card border-r">
      <div className="p-6 border-b">
        <img src={logo} alt="Logo" className="h-16 w-auto mx-auto" />
        <p className="text-center text-sm text-muted-foreground mt-2">Courier Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {courierMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed h-screen">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden bg-card border-b p-4 flex items-center justify-between sticky top-0 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default CourierLayout;