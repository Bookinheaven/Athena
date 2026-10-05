import React from "react";
import { PageContainer, PageHeader } from "@/components/layout";
import { SettingsLayout } from "@/features/settings";

export default function Settings() {
  return (
    <PageContainer maxWidth="5xl" className="space-y-6">
      <PageHeader
        title="Settings"
        description="Customize Athena workspace appearance, focus session cadence, and preferences."
      />

      <SettingsLayout />
    </PageContainer>
  );
}
