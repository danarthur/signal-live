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
    className="liquid-panel p-4 transition-all flex flex-col justify-between min-h-[100px] overflow-hidden"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] uppercase tracking-widest text-ink-muted font-mono">{label}</span>
      <span className="text-ink-muted">{icon}</span>
    </div>
    <div className="text-2xl font-light text-ink tracking-tight leading-none">{value}</div>
    <div className="text-xs text-ink-muted font-medium mt-1">{detail}</div>
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