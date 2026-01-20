
import React from 'react';
import { AgentRole, AgentStatus } from '../types';
import { 
  CommandLineIcon, 
  MagnifyingGlassIcon, 
  CodeBracketIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  ChatBubbleLeftEllipsisIcon,
  CpuChipIcon,
  CubeTransparentIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

interface AgentCardProps {
  role: AgentRole;
  status: AgentStatus;
  description: string;
}

const statusColors = {
  [AgentStatus.IDLE]: 'bg-slate-700/30 text-slate-400 border-slate-800',
  [AgentStatus.PLANNING]: 'bg-blue-900/40 text-blue-200 border-blue-500/50 animate-pulse',
  [AgentStatus.EXECUTING]: 'bg-amber-900/40 text-amber-200 border-amber-500/50 animate-pulse',
  [AgentStatus.COMPLETED]: 'bg-emerald-900/40 text-emerald-200 border-emerald-500/50',
  [AgentStatus.FAILED]: 'bg-red-900/40 text-red-200 border-red-500/50',
  [AgentStatus.WAITING]: 'bg-slate-800/50 text-slate-500 border-slate-700/50',
};

const RoleIcon = ({ role }: { role: AgentRole }) => {
  switch (role) {
    case AgentRole.ORCHESTRATOR: return <CpuChipIcon className="w-4 h-4" />;
    case AgentRole.PLANNER: return <CubeTransparentIcon className="w-4 h-4" />;
    case AgentRole.RESEARCHER: return <MagnifyingGlassIcon className="w-4 h-4" />;
    case AgentRole.CODER: return <CodeBracketIcon className="w-4 h-4" />;
    case AgentRole.ANALYST: return <ChartBarIcon className="w-4 h-4" />;
    case AgentRole.CRITIC: return <ShieldCheckIcon className="w-4 h-4" />;
    case AgentRole.STATUS_REPORTER: return <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />;
    case AgentRole.AGGREGATOR: return <CommandLineIcon className="w-4 h-4" />;
    case AgentRole.SERVICE_BROKER: return <ArrowsRightLeftIcon className="w-4 h-4" />;
    default: return <CommandLineIcon className="w-4 h-4" />;
  }
};

const AgentCard: React.FC<AgentCardProps> = ({ role, status, description }) => {
  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${statusColors[status]} backdrop-blur-sm`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <RoleIcon role={role} />
          <h3 className="font-bold uppercase tracking-wider text-[10px]">{role}</h3>
        </div>
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/5 uppercase border border-white/10">
          {status}
        </span>
      </div>
      <p className="text-[11px] line-clamp-2 opacity-80 leading-relaxed font-medium">
        {description || 'Standing by for A2A handshake...'}
      </p>
    </div>
  );
};

export default AgentCard;
