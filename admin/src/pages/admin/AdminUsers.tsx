import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, CheckCircle2, Ban, Unlock, Loader2 } from "lucide-react";
import { adminUsersApi } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("brand_owner");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<any>(null);
  const [banReason, setBanReason] = useState("");

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter, statusFilter],
    queryFn: async () => {
      const response = await adminUsersApi.getAll({
        role: roleFilter,
        status: statusFilter,
        search,
        page: 1,
        limit: 100,
      });
      return response;
    },
  });

  const handleApprove = async (userId: string) => {
    try {
      await adminUsersApi.approve(userId);
      toast.success("Brand owner approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to approve brand owner");
    }
  };

  const handleBan = async () => {
    if (!userToBan) return;
    try {
      await adminUsersApi.ban(userToBan._id || userToBan.id, banReason || undefined);
      toast.success("Brand owner banned successfully");
      setBanDialogOpen(false);
      setUserToBan(null);
      setBanReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to ban brand owner");
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await adminUsersApi.unban(userId);
      toast.success("Brand owner unbanned successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to unban brand owner");
    }
  };

  const handleSetPending = async (userId: string) => {
    try {
      await adminUsersApi.setPending(userId);
      toast.success("Brand owner status set to pending successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to set brand owner to pending");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            ⏳ Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
            🟢 Approved
          </Badge>
        );
      case "banned":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400">
            🔴 Banned
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const users = usersData?.data || [];

  return (
    <AdminLayout title="Brand Owners" subtitle="Manage brand owner accounts">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl p-4 sm:p-6 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No brand owners found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user._id || user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || `${user.first_name} ${user.last_name}`}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.brand_id?.name || "No brand"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(user._id || user.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {user.status === "approved" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUserToBan(user);
                                setBanDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Ban
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetPending(user._id || user.id)}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              Set Pending
                            </Button>
                          </>
                        )}
                        {user.status === "banned" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnban(user._id || user.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            Unban
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban Brand Owner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban this brand owner? They will lose access to their dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="banReason">Ban Reason (Optional)</Label>
              <Textarea
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for banning..."
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBanReason("");
              setUserToBan(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBan} className="bg-red-600 hover:bg-red-700">
              Ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
