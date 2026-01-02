import { useQuery } from "@tanstack/react-query";
import { statsService } from "@/services/apiService";
import { adminDashboardApi } from "@/lib/api";
import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { Store, Package, FolderOpen, Mail, Users, Ban } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      return await statsService.getStats();
    },
  });

  const { data: recentBrands, isLoading: brandsLoading } = useQuery({
    queryKey: ["recent-brands"],
    queryFn: async () => {
      const brands = await adminDashboardApi.getRecentBrands(5);
      return brands.map((brand: { _id?: string; id?: string; name: string; createdAt?: string; created_at?: string; category_id?: { name: string } | string | null }) => ({
        id: brand._id || brand.id,
        name: brand.name,
        created_at: brand.createdAt || brand.created_at,
        categories: brand.category_id && typeof brand.category_id === 'object'
          ? { name: brand.category_id.name || "Uncategorized" }
          : null,
      }));
    },
  });

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back to the admin panel">
      <div className="w-full max-w-full">
      {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <StatsCard
          title="Total Brands"
          value={stats?.brands || 0}
          icon={Store}
        />
        <StatsCard
          title="Total Products"
          value={stats?.products || 0}
          icon={Package}
        />
        <StatsCard
          title="Categories"
          value={stats?.categories || 0}
          icon={FolderOpen}
        />
        <StatsCard
            title="Messages"
            value={stats?.messages || 0}
            icon={Mail}
          />
          {stats?.pendingBrandOwners !== undefined && (
            <StatsCard
              title="Pending Brand Owners"
              value={stats.pendingBrandOwners || 0}
              icon={Users}
              change={stats.pendingBrandOwners ? "Awaiting approval" : undefined}
              changeType={stats.pendingBrandOwners ? "negative" : "neutral"}
        />
          )}
          {stats?.bannedBrandOwners !== undefined && (
        <StatsCard
              title="Banned Brand Owners"
              value={stats.bannedBrandOwners || 0}
              icon={Ban}
              change={stats.bannedBrandOwners ? "Banned" : undefined}
              changeType={stats.bannedBrandOwners ? "negative" : "neutral"}
        />
          )}
      </div>

      {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Recent Brands */}
          <div className="glass rounded-2xl p-4 sm:p-6 w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Recent Brands</h2>
              <Link to="/admin/brands" className="text-sm text-primary hover:underline whitespace-nowrap">
              View all
            </Link>
          </div>
            <div className="space-y-3 sm:space-y-4">
            {recentBrands?.map((brand) => (
                <div key={brand.id} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium text-foreground truncate text-sm sm:text-base">{brand.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{brand.categories?.name || "Uncategorized"}</p>
                </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {formatDistanceToNow(new Date(brand.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
              {brandsLoading ? (
                <p className="text-muted-foreground text-center py-4">Loading...</p>
              ) : !recentBrands?.length ? (
              <p className="text-muted-foreground text-center py-4">No brands yet</p>
              ) : null}
              </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
