import React from "react";
import { HistoryView } from "@/features/history";

/**
 * Route page component for /sessions (History).
 * Delegates rendering directly to the dedicated feature boundary HistoryView.
 */
export default function SessionHistory() {
  return <HistoryView />;
}
