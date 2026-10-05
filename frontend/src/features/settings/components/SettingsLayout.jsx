import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Palette, Target, Volume2 } from "lucide-react";
import AppearanceSettings from "./AppearanceSettings";
import FocusSettings from "./FocusSettings";
import NotificationSettings from "./NotificationSettings";

const CATEGORIES = [
  {
    id: "appearance",
    label: "Appearance",
    description: "Themes & atmosphere",
    icon: Palette,
    component: AppearanceSettings,
  },
  {
    id: "focus",
    label: "Focus",
    description: "Timer & session cadence",
    icon: Target,
    component: FocusSettings,
  },
  {
    id: "notifications",
    label: "Audio & Alerts",
    description: "Session cues & chimes",
    icon: Volume2,
    component: NotificationSettings,
  },
];

export const SettingsLayout = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // If no category param, default to appearance
  const activeCategoryId = CATEGORIES.some((c) => c.id === category) ? category : "appearance";
  const activeCategory = CATEGORIES.find((c) => c.id === activeCategoryId) || CATEGORIES[0];
  const ActiveComponent = activeCategory.component;

  const handleSelectCategory = (id) => {
    navigate(`/settings/${id}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 lg:gap-8 min-h-[500px]">
      {/* Category Nav - Desktop Sidebar */}
      <aside className="w-full md:w-56 shrink-0 space-y-1">
        {/* Mobile Horizontal Selector */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-secondary text-foreground border-border font-semibold shadow-2xs"
                    : "bg-card text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Vertical List */}
        <div className="hidden md:flex flex-col space-y-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer select-none border ${
                  isSelected
                    ? "bg-secondary text-foreground border-border/80 font-semibold shadow-2xs"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <p className="leading-none text-xs">{cat.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-normal">
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Settings Content Area */}
      <main className="flex-1 min-w-0">
        <ActiveComponent />
      </main>
    </div>
  );
};

export default SettingsLayout;
