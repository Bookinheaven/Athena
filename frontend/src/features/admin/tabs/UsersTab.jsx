import { Search, Mail, CheckCircle, XCircle, Eye, Edit, Trash2, AlertCircle, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PLACEHOLDERS } from '@/constants/placeholders.js';

const RoleBadge = ({ type }) => {
  const isAdmin = type === 'admin';
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ring-1',
      isAdmin
        ? 'bg-violet-500/10 text-violet-400 ring-violet-500/25'
        : 'bg-muted/60 text-muted-foreground ring-border/50'
    )}>
      {isAdmin ? <ShieldCheck className="size-2.5" /> : <User className="size-2.5" />}
      {type}
    </span>
  );
};

const StatusPill = ({ verified, active }) => (
  <div className="flex items-center gap-1.5">
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ring-1',
      verified
        ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25'
        : 'bg-destructive/10 text-destructive ring-destructive/25'
    )}>
      {verified ? <CheckCircle className="size-2.5" /> : <XCircle className="size-2.5" />}
      {verified ? 'verified' : 'unverified'}
    </span>
    <span className={cn(
      'size-1.5 rounded-full ring-1',
      active ? 'bg-emerald-500 ring-emerald-500/50 shadow-emerald-500/50 shadow-sm' : 'bg-muted-foreground/30 ring-border/50'
    )} />
  </div>
);

export function UsersTab({
  searchQuery,
  setSearchQuery,
  filteredUsers,
  setSelectedUser,
  setShowUserDetails,
  handleEditUser,
  handleDeleteUser,
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden max-w-5xl">
      {/* toolbar */}
      <div className="flex items-center gap-3 border-b border-border/40 bg-muted/10 px-4 py-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            type="text"
            placeholder={PLACEHOLDERS.admin.searchUsers}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 font-mono text-xs bg-background/50 border-border/50 rounded-lg focus:border-primary/50"
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          <span className="text-foreground font-bold">{filteredUsers.length}</span> records
        </span>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/30">
              {['#', 'User', 'Email', 'Role', 'Status', ''].map((h, i) => (
                <th key={i} className="px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u, idx) => (
                <tr key={u.id || u._id} className="group transition-colors hover:bg-muted/20">
                  {/* index */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-mono text-[10px] text-muted-foreground/40 tabular-nums">
                      {String(idx + 1).padStart(3, '0')}
                    </span>
                  </td>

                  {/* user */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/60 to-primary text-[13px] font-black text-primary-foreground ring-1 ring-primary/20">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        {u.isActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-card bg-emerald-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{u.fullName}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  </td>

                  {/* email */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-mono text-[11px] text-muted-foreground">{u.email}</span>
                  </td>

                  {/* role */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <RoleBadge type={u.type || u.accountType} />
                  </td>

                  {/* status */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusPill verified={u.isEmailVerified} active={u.isActive} />
                  </td>

                  {/* actions */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => { setSelectedUser(u); setShowUserDetails(true); }}>
                            <Eye className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="font-mono text-xs">inspect</TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => handleEditUser(u)}>
                            <Edit className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="font-mono text-xs">edit</TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUser(u.id || u._id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="font-mono text-xs">delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-14 text-center">
                  <AlertCircle className="mx-auto mb-2 size-7 text-muted-foreground/20" />
                  <p className="font-mono text-xs text-muted-foreground">// no records found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
