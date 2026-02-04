import React from 'react';
import { Activity, Zap, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const StatusCard = ({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  detail: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white/40 border border-white/40 rounded-2xl p-4 backdrop-blur-md shadow-sm transition-all hover:bg-white/60 hover:shadow-md flex flex-col justify-between min-h-[100px] overflow-hidden"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] uppercase tracking-widest text-[#8B8276] font-mono">{label}</span>
      <span className="text-[#8B8276]">{icon}</span>
    </div>
    <div className="text-2xl font-light text-[#2C2824] tracking-tight leading-none">{value}</div>
    <div className="text-xs text-[#5C554B] font-medium mt-1">{detail}</div>
  </motion.div>
);

export const AIStatus = () => {
  return (
    <div className="flex flex-col gap-4">
      <StatusCard
        label="System"
        value="Operational"
        icon={<Activity size={16} />}
        detail="Core Status"
      />
      <StatusCard
        label="Latency"
        value="24ms"
        icon={<Zap size={16} />}
        detail="Average Response"
      />
      <StatusCard
        label="Memory"
        value="Healthy"
        icon={<Cpu size={16} />}
        detail="Stability"
      />
    </div>
  );
};

export default AIStatus;