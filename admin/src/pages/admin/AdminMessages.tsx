import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesService } from "@/services/apiService";
import type { StaticContactMessage } from "@/data/staticData";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Mail, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminMessages() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<StaticContactMessage | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-messages", search],
    queryFn: async () => {
      const messagesData = await messagesService.getAll();
      
      let result = messagesData.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      if (search) {
        const searchLower = search.toLowerCase();
        result = result.filter((m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.email.toLowerCase().includes(searchLower) ||
          (m.subject && m.subject.toLowerCase().includes(searchLower))
        );
      }
      
      return result;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await messagesService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Message deleted successfully");
      setSelectedMessage(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete message");
    },
  });

  return (
    <AdminLayout title="Contact Messages" subtitle="Manage contact form submissions">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages by name, email, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Messages Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : messages?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              messages?.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{message.name}</p>
                        <p className="text-xs text-muted-foreground">{message.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {message.subject || "No subject"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setSelectedMessage(message)}
                        title="View message"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this message?")) {
                            deleteMutation.mutate(message.id);
                          }
                        }}
                        title="Delete message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a 
                    href={`mailto:${selectedMessage.email}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
              </div>
              
              {selectedMessage.subject && (
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{selectedMessage.subject}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Message</p>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <div className="flex justify-end items-center pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this message?")) {
                      deleteMutation.mutate(selectedMessage.id);
                    }
                  }}
                >
                  Delete Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
