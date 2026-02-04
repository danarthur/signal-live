import React from 'react';
import { motion } from 'framer-motion';
import { 
  CloudRain, 
  Battery, 
  Wifi, 
  Cpu, 
  Calendar as CalendarIcon, 
  Clock,
  ArrowUpRight 
} from 'lucide-react';

interface MorningBriefingProps {
  state?: 'overview' | 'chat'; // Made optional as parent handles layout
}

export const WeatherCard = () => (
  <GlassCard className="flex-1 min-h-[100px]">
    <div className="flex justify-between items-start mb-2">
      <span className="font-mono text-[10px] text-[#8B8276] uppercase tracking-widest">Atmosphere</span>
      <CloudRain size={16} className="text-[#8B8276]" />
    </div>
    <div className="flex items-end justify-between">
      <div>
        <div className="text-3xl font-light text-[#2C2824]">62°</div>
        <div className="text-xs text-[#5C554B] mt-1 font-medium">Heavy Rain</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] text-[#8B8276] font-mono">H:65° L:58°</span>
      </div>
    </div>
  </GlassCard>
);

export const TimeCard = () => (
  <GlassCard className="flex-1 min-h-[100px]">
    <div className="flex justify-between items-start mb-1">
      <span className="font-mono text-[10px] text-[#8B8276] uppercase tracking-widest">Local</span>
      <Clock size={16} className="text-[#8B8276]" />
    </div>
    <div className="mt-auto">
      <div className="text-3xl font-light text-[#2C2824] tracking-tight">09:41</div>
      <div className="text-xs text-[#5C554B] font-medium mt-1">Thursday, Jan 24</div>
    </div>
  </GlassCard>
);

const SystemStatsCard = () => (
  <GlassCard className="py-4 space-y-4">
    <div className="flex items-center justify-between mb-2">
      <span className="font-mono text-[10px] text-[#8B8276] uppercase tracking-widest">System</span>
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
    </div>

    <div className="space-y-3">
      <StatRow label="CPU Load" value="12%" icon={<Cpu size={14} />} />
      <StatRow label="Memory" value="3.2GB" icon={<Wifi size={14} />} />
      <StatRow label="Battery" value="98%" icon={<Battery size={14} />} />
    </div>
  </GlassCard>
);

// Named export to match your page.tsx import
export const MorningBriefing: React.FC<MorningBriefingProps> = () => {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <WeatherCard />
      <TimeCard />
      <SystemStatsCard />
    </div>
  );
};

// --- Subcomponents ---

// Updated GlassCard for Light Mode (Cream/Walnut Theme)
const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`bg-white/40 border border-white/40 rounded-2xl p-4 backdrop-blur-md shadow-sm transition-all hover:bg-white/60 hover:shadow-md ${className}`}
  >
    {children}
  </motion.div>
);

const StatRow = ({ label, value, icon }: { label: string, value: string, icon: any }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-2 text-[#8B8276] group-hover:text-[#5C554B] transition-colors">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <span className="font-mono text-xs text-[#4A453E] font-semibold bg-white/50 px-1.5 py-0.5 rounded-md">{value}</span>
  </div>
);
