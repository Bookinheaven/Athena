import React from 'react';
import { Edit, UserPlus, ShieldCheck, User, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { PLACEHOLDERS } from '@/constants/placeholders.js';

const Field = ({ label, action, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {action}
    </div>
    {children}
  </div>
);

export function UserFormModal({
  open,
  onClose,
  onSubmit,
  formData,
  setFormData,
  isEdit,
  formError,
  setFormError
}) {
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (setFormError) setFormError('');
  };

  const handleSuggestUsername = () => {
    const suffix = Math.floor(100 + Math.random() * 900);
    const base = formData.username?.trim() || 
      (formData.fullName?.trim() ? formData.fullName.toLowerCase().replace(/\s+/g, '_') : 'dev_user');
    const cleanBase = base.replace(/_\d+$/, '');
    setFormData((prev) => ({ ...prev, username: `${cleanBase}_${suffix}` }));
    if (setFormError) setFormError('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden border-border/50">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-border/30 bg-muted/20 px-5 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            {isEdit ? <Edit className="size-3.5 text-primary" /> : <UserPlus className="size-3.5 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-bold">{isEdit ? 'Edit User' : 'New User'}</p>
            <p className="font-mono text-[9px] text-muted-foreground">
              {isEdit ? '// update user profile' : '// create account'}
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(e); }}
          className="space-y-4 p-5"
        >
          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Field
            label="Username"
            action={!isEdit && (
              <button
                type="button"
                onClick={handleSuggestUsername}
                className="text-[9px] font-mono text-primary hover:underline flex items-center gap-1"
                title="Generate unique username"
              >
                <Sparkles className="size-2.5" />
                unique suffix
              </button>
            )}
          >
            <Input
              type="text"
              placeholder={PLACEHOLDERS.admin.username}
              value={formData.username}
              onChange={handleChange('username')}
              className="h-8 font-mono text-xs bg-background/60 border-border/50 rounded-lg focus:border-primary/50"
              required
            />
          </Field>

          <Field label="Full Name">
            <Input
              type="text"
              placeholder={PLACEHOLDERS.admin.fullName}
              value={formData.fullName}
              onChange={handleChange('fullName')}
              className="h-8 font-mono text-xs bg-background/60 border-border/50 rounded-lg focus:border-primary/50"
              required
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              placeholder={PLACEHOLDERS.admin.email}
              value={formData.email}
              onChange={handleChange('email')}
              className="h-8 font-mono text-xs bg-background/60 border-border/50 rounded-lg focus:border-primary/50"
              required
            />
          </Field>

          {!isEdit && (
            <Field label="Password">
              <Input
                type="password"
                placeholder={PLACEHOLDERS.admin.password}
                value={formData.password}
                onChange={handleChange('password')}
                className="h-8 font-mono text-xs bg-background/60 border-border/50 rounded-lg focus:border-primary/50"
                required
              />
            </Field>
          )}

          <Field label="Role">
            <div className="flex gap-2">
              {['user', 'admin'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, type: role }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border font-mono text-[11px] font-bold transition-all ${
                    formData.type === role
                      ? role === 'admin'
                        ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                        : 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border/50 text-muted-foreground hover:border-border hover:bg-muted/50'
                  }`}
                >
                  {role === 'admin' ? <ShieldCheck className="size-3" /> : <User className="size-3" />}
                  {role}
                </button>
              ))}
            </div>
          </Field>

          {isEdit && (
            <p className="font-mono text-[9px] text-muted-foreground/60 bg-muted/20 rounded-lg px-3 py-2">
              <span className="text-amber-400">// note:</span> password cannot be changed here
            </p>
          )}

          <DialogFooter className="pt-1">
            <DialogClose render={
              <Button variant="outline" className="h-8 px-4 font-mono text-xs rounded-lg border-border/50" />
            }>
              cancel
            </DialogClose>
            <Button type="submit" className="h-8 px-4 font-mono text-xs rounded-lg">
              {isEdit ? 'save' : 'create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
