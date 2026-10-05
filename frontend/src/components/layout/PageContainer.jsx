import React from "react";
import { cn } from "@/lib/utils";

export const PageContainer = React.forwardRef(
  ({ className, children, maxWidth = "7xl", ...props }, ref) => {
    const maxWidthClasses = {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      "2xl": "max-w-screen-2xl",
      "7xl": "max-w-7xl",
      full: "max-w-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 flex-1 flex flex-col min-h-0",
          maxWidthClasses[maxWidth] || maxWidthClasses["7xl"],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageContainer.displayName = "PageContainer";

export const PageHeader = React.forwardRef(
  ({ className, title, description, children, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 mb-4 border-b border-border/40 shrink-0",
          className
        )}
        {...props}
      >
        <div className="space-y-0.5">
          {title && (
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {children}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

export const PageContent = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 min-h-0 flex flex-col space-y-5", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageContent.displayName = "PageContent";
