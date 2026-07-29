import React from 'react';
import { FileText, Clock, Pin, Link2, Monitor, Code } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_ITEMS = [
  { id: 1, title: 'Project Spec', icon: FileText, color: 'text-blue-400' },
  { id: 2, title: 'Figma Design', icon: Pin, color: 'text-pink-400' },
  { id: 3, title: 'API Docs', icon: Link2, color: 'text-green-400' },
  { id: 4, title: 'Landing Page', icon: Monitor, color: 'text-purple-400' },
  { id: 5, title: 'Refactor Auth', icon: Code, color: 'text-yellow-400' },
];

export const WorkflowDock = () => {
  return (
    <div className="flex items-center gap-6 h-full w-full px-6 py-4 overflow-x-auto overflow-y-hidden no-scrollbar">
       <div className="flex items-center gap-3 pr-6 border-r border-white/10 shrink-0">
          <div className="w-12 h-12 rounded-[18px] bg-button-primary/20 text-button-primary flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
             <Clock size={22} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-sm font-black uppercase tracking-wider text-white">Workflow</span>
            <span className="text-[10px] text-button-primary font-bold uppercase tracking-widest">Dock</span>
          </div>
       </div>

       <div className="flex items-center gap-4 h-full">
         {MOCK_ITEMS.map((item, idx) => (
           <motion.div
             whileHover={{ scale: 1.1, y: -8 }}
             key={item.id}
             className="flex flex-col items-center justify-center min-w-[70px] gap-2 cursor-pointer group shrink-0"
           >
             <div className="w-[52px] h-[52px] rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300 shadow-lg relative overflow-hidden">
               <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-white/20 to-transparent`} />
               <item.icon size={24} className={`${item.color} drop-shadow-md`} />
             </div>
             <span className="text-[11px] font-semibold whitespace-nowrap text-text-secondary group-hover:text-white transition-colors duration-300">{item.title}</span>
           </motion.div>
         ))}
       </div>
    </div>
  );
};
