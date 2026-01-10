import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    // Redirect to admin dashboard after 3 seconds
    const timer = setTimeout(() => {
      navigate("/admin", { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [location.pathname, navigate]);

  return (
    <AdminLayout title="Page Not Found" subtitle="The page you're looking for doesn't exist">
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Redirecting to dashboard in a few seconds...
          </p>
          <button
            onClick={() => navigate("/admin")}
            className="text-primary underline hover:text-primary/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotFound;
