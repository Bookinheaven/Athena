import { useState } from "react";
import {
  Repeat,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Archive,
  Play,
  Pause,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import RoutineCard from "./RoutineCard.jsx";
import RoutineModal from "./RoutineModal.jsx";
import RoutineDeleteModal from "./RoutineDeleteModal.jsx";
import { useRoutinesData } from "../hooks/useRoutinesData.js";

export default function RoutinesView({
  goals = [],
  onOpenCreateRoutineFromHeader = null,
}) {
  const {
    routines,
    filteredRoutines,
    stats,
    isLoading,
    isError,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    editingRoutine,
    routineToDelete,
    setRoutineToDelete,
    isDeleting,
    loadRoutines,
    openCreateRoutine,
    openEditRoutine,
    saveRoutine,
    toggleRoutineStatus,
    archiveRoutine,
    confirmDeleteRoutine,
  } = useRoutinesData();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-semibold text-foreground">
            Failed to load routines
          </h3>
          <p className="text-xs text-muted-foreground">
            An error occurred while fetching your routines. Please verify your connection and try again.
          </p>
        </div>
        <Button
          onClick={loadRoutines}
          variant="outline"
          size="sm"
          className="rounded-xl font-medium text-xs"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filters & Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-xl border border-border/50 w-full sm:w-fit overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter("active_paused")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === "active_paused"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Active & Paused</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-mono">
              {stats.totalActivePaused}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("archived")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === "archived"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="w-3 h-3" />
            <span>Archived</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-mono">
              {stats.archived}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === "all"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>All</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-mono">
              {stats.total}
            </span>
          </button>
        </div>

        {/* Search & New Routine Action */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routines..."
              className="pl-8.5 rounded-xl border-border bg-background text-xs h-9 focus-visible:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <Button
            size="sm"
            onClick={openCreateRoutine}
            className="rounded-xl font-semibold text-xs h-9 px-4 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" /> New Routine
          </Button>
        </div>
      </div>

      {/* Routine Cards Grid or Loading/Empty States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : filteredRoutines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRoutines.map((routine) => (
            <RoutineCard
              key={routine.id || routine._id}
              routine={routine}
              goals={goals}
              onEdit={openEditRoutine}
              onToggleStatus={toggleRoutineStatus}
              onArchive={archiveRoutine}
              onDelete={setRoutineToDelete}
            />
          ))}
        </div>
      ) : routines.length === 0 ? (
        /* Zero routines empty state */
        <div className="rounded-2xl border border-dashed border-border/80 p-8 sm:p-12 text-center space-y-5 bg-card/40">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <Repeat className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Build lasting daily routines
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Routines help automate recurring habits and checklists — from morning rituals to evening reviews. Create your first routine to get started.
            </p>
          </div>
          <Button
            onClick={openCreateRoutine}
            className="rounded-xl font-semibold text-xs h-9 px-5 shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Routine
          </Button>
        </div>
      ) : (
        /* Filter / search empty state */
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center space-y-3 bg-secondary/10">
          <div className="w-10 h-10 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              No matching routines
            </h4>
            <p className="text-xs text-muted-foreground">
              No routines matched your active filter or search query.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="rounded-xl text-xs h-8"
              >
                Clear Search
              </Button>
            )}
            {activeFilter !== "active_paused" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter("active_paused")}
                className="rounded-xl text-xs h-8"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Routine Modal (Create / Edit) */}
      <RoutineModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        routine={editingRoutine}
        goals={goals}
        onSave={saveRoutine}
      />

      {/* Delete Confirmation Modal */}
      <RoutineDeleteModal
        open={!!routineToDelete}
        onOpenChange={(open) => !open && setRoutineToDelete(null)}
        routine={routineToDelete}
        onConfirm={confirmDeleteRoutine}
        isDeleting={isDeleting}
      />
    </div>
  );
}
