import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Star, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AdminUserRecord {
  id: number;
  name: string;
  email: string;
  instagram: string | null;
  profilePicture: string | null;
  isAthlete: boolean;
  isCoach: boolean;
  isFeatured?: boolean;
  role: string | null;
  createdAt: string | null;
}

interface UserFormState {
  name: string;
  email: string;
  password: string;
  instagram: string;
  isAthlete: boolean;
  isCoach: boolean;
  role: "user" | "admin";
}

const emptyForm: UserFormState = {
  name: "",
  email: "",
  password: "",
  instagram: "",
  isAthlete: false,
  isCoach: false,
  role: "user",
};

type UserCategory = "athletes" | "coaches" | "both";

function asBool(value: boolean | null | undefined): boolean {
  return value === true;
}

function getUserCategory(user: AdminUserRecord): UserCategory | null {
  const isAthlete = asBool(user.isAthlete);
  const isCoach = asBool(user.isCoach);
  if (isAthlete && isCoach) return "both";
  if (isAthlete) return "athletes";
  if (isCoach) return "coaches";
  return null;
}

function filterByCategory(users: AdminUserRecord[], category: UserCategory): AdminUserRecord[] {
  return users.filter((u) => getUserCategory(u) === category);
}

async function parseApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error(
      "Server returned a web page instead of API data. Restart with npm run dev, or redeploy after npm run build.",
    );
  }
  if (!text) {
    throw new Error("Empty response from server.");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON from server. Restart or redeploy the app.");
  }
}

function UserTable({
  users,
  onEdit,
  onDelete,
  showFeaturedActions = false,
  onToggleFeatured,
  featuringUserId,
}: {
  users: AdminUserRecord[];
  onEdit: (user: AdminUserRecord) => void;
  onDelete: (user: AdminUserRecord) => void;
  showFeaturedActions?: boolean;
  onToggleFeatured?: (user: AdminUserRecord) => void;
  featuringUserId?: number | null;
}) {
  if (users.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">No users in this category.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Instagram</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
            <TableCell className="font-medium">{u.name}</TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell>{u.instagram || "—"}</TableCell>
            <TableCell className="capitalize">{u.role ?? "user"}</TableCell>
            <TableCell>
              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {showFeaturedActions && onToggleFeatured && (
                  <Button
                    variant={u.isFeatured ? "default" : "outline"}
                    size="sm"
                    className={
                      u.isFeatured
                        ? "bg-[#F5C518] text-[#202020] hover:bg-[#F5C518]/90"
                        : ""
                    }
                    onClick={() => onToggleFeatured(u)}
                    disabled={featuringUserId === u.id}
                    data-testid={`button-feature-user-${u.id}`}
                  >
                    <Star
                      className={`w-4 h-4 mr-1 ${u.isFeatured ? "fill-current" : ""}`}
                    />
                    {u.isFeatured ? "Featured" : "Feature"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(u)}
                  data-testid={`button-edit-user-${u.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(u)}
                  data-testid={`button-delete-user-${u.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between pt-4 pb-2">
      <p className="text-sm text-gray-500">
        {total} user{total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {start > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => onPageChange(1)}>1</Button>
            {start > 2 && <span className="px-1 text-gray-400">...</span>}
          </>
        )}
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={p === page ? "bg-[#F5C518] text-[#202020] hover:bg-[#e0b014]" : ""}
          >
            {p}
          </Button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
            <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 15;

export function AdminUsersPanel() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRecord | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [activeFilter, setActiveFilter] = useState<"all" | UserCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [featuringUserId, setFeaturingUserId] = useState<number | null>(null);
  const [pages, setPages] = useState<Record<string, number>>({});

  const getPage = useCallback((key: string) => pages[key] || 1, [pages]);
  const setPage = useCallback((key: string, p: number) => {
    setPages((prev) => ({ ...prev, [key]: p }));
  }, []);

  useEffect(() => {
    setPages({});
  }, [activeFilter, searchQuery]);

  const {
    data: users,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<AdminUserRecord[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) {
        let message = "Failed to fetch users";
        try {
          const body = await parseApiJson<{ message?: string }>(res);
          if (body.message) message = body.message;
        } catch (e) {
          if (e instanceof Error && e.message.includes("web page")) throw e;
        }
        if (res.status === 403) {
          message = "Admin access required. Log in with your admin account.";
        }
        if (res.status === 404) {
          message =
            "Users API not found. Restart the server (npm run dev) or redeploy after npm run build.";
        }
        throw new Error(message);
      }
      return parseApiJson<AdminUserRecord[]>(res);
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
  }, []);

  const createMutation = useMutation({
    mutationFn: async (data: UserFormState) => {
      await apiRequest("POST", "/api/admin/users", {
        name: data.name,
        email: data.email,
        password: data.password,
        instagram: data.instagram || undefined,
        isAthlete: data.isAthlete,
        isCoach: data.isCoach,
        role: data.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDialogOpen(false);
      toast({
        title: "User Created",
        description: "The user account has been created.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: async (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserFormState }) => {
      const body: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        instagram: data.instagram || null,
        isAthlete: data.isAthlete,
        isCoach: data.isCoach,
        role: data.role,
      };
      if (data.password) body.password = data.password;
      await apiRequest("PUT", `/api/admin/users/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "User Updated",
        description: "The user profile has been updated.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const featuredMutation = useMutation({
    mutationFn: async (userId: number) => {
      setFeaturingUserId(userId);
      const res = await apiRequest("POST", `/api/admin/users/${userId}/featured`);
      return parseApiJson<{ isFeatured: boolean }>(res);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-coaches"] });
      toast({
        title: data.isFeatured ? "Coach Featured" : "Coach Unfeatured",
        description: data.isFeatured
          ? "This coach will appear in Featured Coaches on the home page."
          : "This coach was removed from Featured Coaches.",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: async (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update featured status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setFeaturingUserId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDeleteTarget(null);
      toast({ title: "User Deleted", description: "The user has been removed." });
    },
    onError: async (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: AdminUserRecord) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      instagram: user.instagram || "",
      isAthlete: user.isAthlete,
      isCoach: user.isCoach,
      role: user.role === "admin" ? "admin" : "user",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }
    if (!editingUser && form.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (!form.isAthlete && !form.isCoach) {
      toast({
        title: "Validation Error",
        description: "Select Athlete, Coach, or both.",
        variant: "destructive",
      });
      return;
    }
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const allUsers = users ?? [];
  const search = searchQuery.trim().toLowerCase();
  const searchedUsers = search
    ? allUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          u.name.toLowerCase().includes(search),
      )
    : allUsers;

  const athletes = filterByCategory(searchedUsers, "athletes");
  const coaches = filterByCategory(searchedUsers, "coaches");
  const both = filterByCategory(searchedUsers, "both");
  const memberCount = filterByCategory(allUsers, "athletes").length
    + filterByCategory(allUsers, "coaches").length
    + filterByCategory(allUsers, "both").length;
  const visibleCount = athletes.length + coaches.length + both.length;

  const sections: { key: UserCategory; title: string; description: string; list: AdminUserRecord[] }[] = [
    {
      key: "athletes",
      title: "Athletes",
      description: "Users registered as athletes only",
      list: athletes,
    },
    {
      key: "coaches",
      title: "Coaches",
      description: "Users registered as coaches only",
      list: coaches,
    },
    {
      key: "both",
      title: "Both",
      description: "Users registered as both athlete and coach",
      list: both,
    },
  ];

  const visibleSections =
    activeFilter === "all"
      ? sections
      : sections.filter((s) => s.key === activeFilter);

  const paginatedSections = visibleSections.map((s) => {
    const page = getPage(s.key);
    const totalPages = Math.max(1, Math.ceil(s.list.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return { ...s, page: safePage, totalPages, paginatedList: s.list.slice(start, start + PAGE_SIZE) };
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold text-[#202020]" data-testid="text-users-count">
          Users ({memberCount})
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-users"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreate} className="btn-primary-yellow" data-testid="button-add-user">
            <Plus className="w-4 h-4 mr-1" />
            Add User
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="user-search" className="sr-only">
          Search by name or email
        </Label>
        <Input
          id="user-search"
          type="search"
          placeholder="Search by name or email (e.g. hosea@gmail.com)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
          data-testid="input-user-search"
        />
      </div>

      {isError && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="py-4 text-red-800 text-sm">
            {error instanceof Error ? error.message : "Could not load users."}{" "}
            <button
              type="button"
              className="underline font-medium"
              onClick={() => refetch()}
            >
              Try again
            </button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          size="sm"
          className={activeFilter === "all" ? "bg-[#F5C518] text-[#202020] hover:bg-[#F5C518]/90" : ""}
          onClick={() => setActiveFilter("all")}
          data-testid="filter-users-all"
        >
          All ({memberCount})
        </Button>
        <Button
          variant={activeFilter === "athletes" ? "default" : "outline"}
          size="sm"
          className={activeFilter === "athletes" ? "bg-[#F5C518] text-[#202020] hover:bg-[#F5C518]/90" : ""}
          onClick={() => setActiveFilter("athletes")}
          data-testid="filter-users-athletes"
        >
          Athletes ({athletes.length})
        </Button>
        <Button
          variant={activeFilter === "coaches" ? "default" : "outline"}
          size="sm"
          className={activeFilter === "coaches" ? "bg-[#F5C518] text-[#202020] hover:bg-[#F5C518]/90" : ""}
          onClick={() => setActiveFilter("coaches")}
          data-testid="filter-users-coaches"
        >
          Coaches ({coaches.length})
        </Button>
        <Button
          variant={activeFilter === "both" ? "default" : "outline"}
          size="sm"
          className={activeFilter === "both" ? "bg-[#F5C518] text-[#202020] hover:bg-[#F5C518]/90" : ""}
          onClick={() => setActiveFilter("both")}
          data-testid="filter-users-both"
        >
          Both ({both.length})
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? null : memberCount === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No athletes, coaches, or both-type users yet.</p>
          </CardContent>
        </Card>
      ) : search && visibleCount === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              No users match &quot;{searchQuery.trim()}&quot;. Try Refresh or check the email spelling.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {paginatedSections.map((section) => (
            <div key={section.key} data-testid={`section-users-${section.key}`}>
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-[#202020]">
                  {section.title}{" "}
                  <span className="text-gray-500 font-normal">({section.list.length})</span>
                </h3>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <UserTable
                    users={section.paginatedList}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    showFeaturedActions={section.key === "coaches" || section.key === "both"}
                    onToggleFeatured={(user) => featuredMutation.mutate(user.id)}
                    featuringUserId={featuringUserId}
                  />
                  <div className="px-4">
                    <Pagination
                      page={section.page}
                      totalPages={section.totalPages}
                      total={section.list.length}
                      onPageChange={(p) => setPage(section.key, p)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                data-testid="input-user-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                data-testid="input-user-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">
                {editingUser ? "New Password (leave blank to keep)" : "Password"}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                data-testid="input-user-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-instagram">Instagram</Label>
              <Input
                id="user-instagram"
                value={form.instagram}
                onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                data-testid="input-user-instagram"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v: "user" | "admin") => setForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account type</Label>
              <p className="text-xs text-gray-500">
                Select Athlete only, Coach only, or both checkboxes for Both.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="user-athlete"
                    checked={form.isAthlete}
                    onCheckedChange={(c) =>
                      setForm((f) => ({ ...f, isAthlete: c === true }))
                    }
                    data-testid="checkbox-user-athlete"
                  />
                  <Label htmlFor="user-athlete">Athlete</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="user-coach"
                    checked={form.isCoach}
                    onCheckedChange={(c) =>
                      setForm((f) => ({ ...f, isCoach: c === true }))
                    }
                    data-testid="checkbox-user-coach"
                  />
                  <Label htmlFor="user-coach">Coach</Label>
                </div>
                {form.isAthlete && form.isCoach && (
                  <span className="text-sm font-medium text-[#202020] bg-[#F5C518]/20 px-2 py-0.5 rounded">
                    → Both
                  </span>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="btn-primary-yellow" data-testid="button-save-user">
                {editingUser ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.name} ({deleteTarget?.email}). This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              data-testid="button-confirm-delete-user"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
