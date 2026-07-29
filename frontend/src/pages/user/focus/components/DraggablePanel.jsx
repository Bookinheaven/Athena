import React, { memo } from "react";
import { motion } from "framer-motion";

export const DraggablePanel = memo(({
  id,
  isMobile,
  isLayoutMode,
  dragControls,
  initialPosition,
  mobilePosition = { y: "100%" },
  className,
  onClose,
  children,
  showClose = true
}) => {
  // If not mobile and not in layout mode, it shouldn't be draggable.
  const isDraggable = isLayoutMode && !isMobile;

  return (
    <motion.div
      drag={isDraggable}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={isMobile ? mobilePosition : initialPosition}
      animate={{ y: 0, opacity: 1, scale: 1, x: initialPosition?.x || 0 }}
      exit={isMobile ? mobilePosition : { opacity: 0, scale: 0.9, x: initialPosition?.x || 0 }}
      className={`absolute z-50 flex flex-col bg-card-background/60 border ${isLayoutMode ? 'border-button-primary/50 border-dashed shadow-[0_0_20px_rgba(124,58,237,0.3)]' : 'border-white/10 dark:border-white/5'} md:rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-3xl ${className}`}
    >
      {isDraggable && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className={`h-12 md:h-7 w-full flex justify-center items-center bg-background-secondary/40 shrink-0 border-b border-border-secondary relative cursor-grab active:cursor-grabbing hover:bg-background-secondary/60 transition-colors`}
        >
          <div className="w-12 h-1 rounded-full bg-button-primary/60" />
        </div>
      )}
      {isMobile && showClose && !isDraggable && (
        <div className="absolute top-2 right-2 z-50">
          <button
            onClick={onClose}
            className="text-xs font-black uppercase text-button-primary bg-background-secondary/80 px-2 py-1 rounded-md backdrop-blur-md"
          >
            Close
          </button>
        </div>
      )}
      <div className="flex-1 overflow-hidden relative cursor-auto rounded-b-[40px]">
        {children}
      </div>
    </motion.div>
  );
});

DraggablePanel.displayName = "DraggablePanel";
