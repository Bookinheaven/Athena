import React, { useCallback } from "react";
import { useAuth } from "@contexts/AuthContext";
import { PageContainer, PageHeader } from "@/components/layout";
import {
  ProfileHeader,
  AccountDetailsSection,
  SecuritySection,
  AccountActionsSection,
} from "@/features/profile";

export default function Profile() {
  const { user, setUser } = useAuth();

  const handleUserUpdated = useCallback(
    (updatedUser) => {
      if (!updatedUser) return;
      setUser((prev) => ({
        ...prev,
        ...updatedUser,
        fullName: updatedUser.fullName,
      }));
    },
    [setUser]
  );

  if (!user) return null;

  return (
    <PageContainer maxWidth="4xl" className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your Athena personal identity and account credentials."
      />

      <ProfileHeader user={user} onUserUpdated={handleUserUpdated} />

      <AccountDetailsSection user={user} />

      <SecuritySection />

      <AccountActionsSection user={user} />
    </PageContainer>
  );
}
