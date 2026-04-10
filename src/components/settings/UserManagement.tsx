import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus, MoreHorizontal, Users, Search, ShieldCheck, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/hooks/useDemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DemoUser } from "@/lib/demo-store";

type RoleType = DemoUser["role"];
const ROLE_LABELS: Record<RoleType, string> = { admin: "Admin", manager: "Inventory Manager", requestor: "Requestor" };
const ROLE_COLORS: Record<RoleType, string> = { admin: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200", manager: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", requestor: "bg-muted text-muted-foreground" };
const CURRENT_USER_ID = "user-01"; // Alice is the logged-in admin in demo

export function UserManagement() {
  const { demoStore, bumpVersion, version } = useDemo();
  const users = useMemo(() => demoStore?.getUsers() ?? [], [demoStore, version]);

  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<RoleType>("requestor");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [roleChange, setRoleChange] = useState<{ user: DemoUser; newRole: RoleType } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<DemoUser | null>(null);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const adminCount = users.filter((u) => u.role === "admin" && u.status === "active").length;

  const isLastAdmin = (user: DemoUser) => user.role === "admin" && user.status === "active" && adminCount <= 1;

  // ─── Invite ───────────────────────────────────────────
  const handleInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setInviteError("Valid email required"); return; }
    if (users.some((u) => u.email.toLowerCase() === email)) { setInviteError("User already exists"); return; }
    setInviteLoading(true);
    setTimeout(() => {
      demoStore?.addUser({ id: crypto.randomUUID(), name: email.split("@")[0], email, role: inviteRole, status: "pending", joinedAt: new Date().toISOString() });
      bumpVersion();
      toast.success(`Invitation sent to ${email}`);
      setInviteOpen(false); setInviteEmail(""); setInviteRole("requestor"); setInviteError(""); setInviteLoading(false);
    }, 400);
  };

  // ─── Role change ──────────────────────────────────────
  const confirmRoleChange = () => {
    if (!roleChange || !demoStore) return;
    demoStore.updateUser(roleChange.user.id, { role: roleChange.newRole });
    bumpVersion();
    toast.success(`${roleChange.user.name}'s role changed to ${ROLE_LABELS[roleChange.newRole]}`);
    setRoleChange(null);
  };

  // ─── Deactivate / Reactivate ──────────────────────────
  const confirmDeactivate = () => {
    if (!deactivateTarget || !demoStore) return;
    demoStore.updateUser(deactivateTarget.id, { status: "inactive" });
    bumpVersion();
    toast.success(`${deactivateTarget.name} deactivated`);
    setDeactivateTarget(null);
  };

  const handleReactivate = (user: DemoUser) => {
    demoStore?.updateUser(user.id, { status: "active" });
    bumpVersion();
    toast.success(`${user.name} reactivated`);
  };

  if (users.length === 0) {
    return <EmptyState icon={Users} title="No users found" description="Users will appear here once people sign up or are invited." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm bg-white" />
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Invite User
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
            ) : filtered.map((user) => (
              <TableRow key={user.id} className={cn(user.status === "inactive" && "opacity-50")}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <RoleDropdown user={user} currentUserId={CURRENT_USER_ID} adminCount={adminCount} isLastAdmin={isLastAdmin(user)}
                    onChangeRole={(newRole) => setRoleChange({ user, newRole })} />
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "active" ? "default" : user.status === "pending" ? "outline" : "secondary"}
                    className={cn("text-xs", user.status === "inactive" && "bg-muted text-muted-foreground")}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(user.joinedAt), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <UserActions user={user} currentUserId={CURRENT_USER_ID} isLastAdmin={isLastAdmin(user)}
                    onDeactivate={() => setDeactivateTarget(user)} onReactivate={() => handleReactivate(user)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden space-y-3">
        {filtered.map((user) => (
          <div key={user.id} className={cn("rounded-lg border border-border p-3 space-y-2", user.status === "inactive" && "opacity-50")}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{user.name}</span>
              <UserActions user={user} currentUserId={CURRENT_USER_ID} isLastAdmin={isLastAdmin(user)}
                onDeactivate={() => setDeactivateTarget(user)} onReactivate={() => handleReactivate(user)} />
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", ROLE_COLORS[user.role])}>{ROLE_LABELS[user.role]}</Badge>
              <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs">{user.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>Send an invitation email to add a new team member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }} placeholder="user@example.com" />
              {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as RoleType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Inventory Manager</SelectItem>
                  <SelectItem value="requestor">Requestor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>{inviteLoading ? "Sending…" : "Send Invite"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role change confirmation */}
      <AlertDialog open={!!roleChange} onOpenChange={(open) => !open && setRoleChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change role?</AlertDialogTitle>
            <AlertDialogDescription>
              Change {roleChange?.user.name}'s role from <strong>{roleChange ? ROLE_LABELS[roleChange.user.role] : ""}</strong> to <strong>{roleChange ? ROLE_LABELS[roleChange.newRole] : ""}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate confirmation */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>They will lose access immediately. You can reactivate them later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Role Dropdown ──────────────────────────────────────
function RoleDropdown({ user, currentUserId, adminCount, isLastAdmin, onChangeRole }: {
  user: DemoUser; currentUserId: string; adminCount: number; isLastAdmin: boolean;
  onChangeRole: (role: RoleType) => void;
}) {
  const isSelf = user.id === currentUserId;

  if (isSelf) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn("text-xs cursor-default", ROLE_COLORS[user.role])}>{ROLE_LABELS[user.role]}</Badge>
          </TooltipTrigger>
          <TooltipContent>Cannot change your own role</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isLastAdmin) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn("text-xs cursor-default", ROLE_COLORS[user.role])}>{ROLE_LABELS[user.role]}</Badge>
          </TooltipTrigger>
          <TooltipContent>Cannot change role — this is the only admin. Promote another user first.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Select value={user.role} onValueChange={(v) => { if (v !== user.role) onChangeRole(v as RoleType); }}>
      <SelectTrigger className="h-7 w-[160px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">
          <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Admin</div>
        </SelectItem>
        <SelectItem value="manager">
          <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Inventory Manager</div>
        </SelectItem>
        <SelectItem value="requestor">
          <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Requestor</div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

// ─── User Actions ───────────────────────────────────────
function UserActions({ user, currentUserId, isLastAdmin, onDeactivate, onReactivate }: {
  user: DemoUser; currentUserId: string; isLastAdmin: boolean;
  onDeactivate: () => void; onReactivate: () => void;
}) {
  const isSelf = user.id === currentUserId;
  const canDeactivate = !isSelf && !isLastAdmin && user.status !== "inactive";
  const canReactivate = user.status === "inactive";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canReactivate ? (
          <DropdownMenuItem onClick={onReactivate}>Reactivate</DropdownMenuItem>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem disabled={!canDeactivate} onClick={canDeactivate ? onDeactivate : undefined}>
                  Deactivate
                </DropdownMenuItem>
              </TooltipTrigger>
              {!canDeactivate && (
                <TooltipContent>
                  {isSelf ? "Cannot deactivate yourself" : isLastAdmin ? "Cannot deactivate the only admin" : ""}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
