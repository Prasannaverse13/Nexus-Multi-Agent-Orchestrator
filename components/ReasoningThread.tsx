
import React from 'react';
import { 
  CommandLineIcon, 
  ShieldCheckIcon,
  CodeBracketIcon,
  ChartBarIcon,
  CpuChipIcon,
  ArrowsRightLeftIcon,
  CubeTransparentIcon,
  FingerPrintIcon,
  BoltIcon,
  CircleStackIcon,
  ShareIcon,
  BeakerIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

interface ThreadMessage {
  from: string;
  to: string;
  content: string;
  timestamp: string;
  type: 'thought' | 'action' | 'verification' | 'system';
}

const getAgentMetadata = (role: string) => {
  const r = role.toUpperCase();
  if (r.includes('ORCHESTRATOR')) return { 
    icon: <CpuChipIcon className="w-6 h-6" />, 
    color: 'bg-blue-600', 
    glow: 'shadow-[0_0_20px_rgba(37,99,235,0.4)]',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/40'
  };
  if (r.includes('VALIDATOR') || r.includes('CRITIC') || r.includes('SHIELD')) return { 
    icon: <ShieldCheckIcon className="w-6 h-6" />, 
    color: 'bg-rose-600', 
    glow: 'shadow-[0_0_20px_rgba(225,29,72,0.4)]',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/40'
  };
  if (r.includes('ANALYST')) return { 
    icon: <ChartBarIcon className="w-6 h-6" />, 
    color: 'bg-purple-600', 
    glow: 'shadow-[0_0_20px_rgba(147,51,234,0.4)]',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/40'
  };
  if (r.includes('CODER')) return { 
    icon: <CodeBracketIcon className="w-6 h-6" />, 
    color: 'bg-indigo-600', 
    glow: 'shadow-[0_0_20px_rgba(79,70,229,0.4)]',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/40'
  };
  if (r.includes('RESEARCHER')) return { 
    icon: <MagnifyingGlassIcon className="w-6 h-6" />, 
    color: 'bg-cyan-600', 
    glow: 'shadow-[0_0_20px_rgba(8,145,178,0.4)]',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40'
  };
  if (r.includes('PLANNER')) return { 
    icon: <CubeTransparentIcon className="w-6 h-6" />, 
    color: 'bg-orange-600', 
    glow: 'shadow-[0_0_20px_rgba(234,88,12,0.4)]',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/40'
  };
  if (r.includes('STATUS_REPORTER')) return { 
    icon: <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />, 
    color: 'bg-emerald-600', 
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40'
  };
  if (r.includes('SYSTEM') || r.includes('CORE')) return { 
    icon: <FingerPrintIcon className="w-6 h-6" />, 
    color: 'bg-slate-700', 
    glow: 'shadow-[0_0_20px_rgba(51,65,85,0.4)]',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/40'
  };
  return { 
    icon: <BoltIcon className="w-6 h-6" />, 
    color: 'bg-slate-500', 
    glow: 'shadow-[0_0_20px_rgba(100,116,139,0.4)]',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/40'
  };
};

const ReasoningThread: React.FC<{ messages: ThreadMessage[] }> = ({ messages }) => {
  return (
    <div className="flex flex-col gap-12 relative pl-8 w-full pb-12 overflow-visible">
      <div className="absolute left-[47px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-500/40 via-blue-500/5 to-transparent rounded-full" />
      
      {messages.map((msg, i) => {
        const metadata = getAgentMetadata(msg.from);
        const isDelegation = msg.type === 'action';
        const isVerification = msg.type === 'verification';
        
        return (
          <div key={i} className="relative flex gap-8 group animate-in slide-in-from-left-4 duration-500 ease-out">
            <div className="relative flex flex-col items-center shrink-0">
              <div className={`z-20 w-14 h-14 rounded-2xl ${metadata.color} ${metadata.glow} flex items-center justify-center text-white border-2 border-white/10 shadow-lg transition-transform group-hover:scale-105`}>
                {metadata.icon}
              </div>
              {isVerification && (
                <div className="absolute -right-1 -top-1 z-30 bg-emerald-500 rounded-full p-1 border-2 border-[var(--bg-main)]">
                  <ShareIcon className="w-3 h-3 text-white" />
                </div>
              )}
              {isDelegation && (
                <div className="absolute -right-1 -bottom-1 z-30 bg-blue-500 rounded-full p-1 border-2 border-[var(--bg-main)]">
                  <BeakerIcon className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 px-1">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${metadata.textColor}`}>
                  {msg.from}
                </span>
                <ArrowsRightLeftIcon className="w-3 h-3 text-[var(--text-secondary)] opacity-30" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-40">
                  {msg.to}
                </span>
                <span className="ml-auto text-[9px] font-mono text-[var(--text-secondary)] opacity-20 tabular-nums">
                  {msg.timestamp}
                </span>
              </div>

              <div className={`relative p-5 rounded-[1.5rem] border-2 transition-all duration-300 ${
                isVerification ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 
                isDelegation ? 'bg-amber-500/[0.03] border-amber-500/20' :
                'bg-[var(--bg-card)] border-[var(--border-color)]'
              }`}>
                <p className="text-base leading-relaxed text-[var(--text-primary)] font-medium">
                  {msg.content}
                </p>
                
                <div className="mt-4 flex items-center gap-3">
                  <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                    isVerification ? 'border-emerald-500/30 text-emerald-500' :
                    isDelegation ? 'border-amber-500/30 text-amber-500' :
                    'border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}>
                    {msg.type.toUpperCase()}_LOG
                  </div>
                  {msg.content.toLowerCase().includes('verified') && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500/60 uppercase tracking-tighter">
                      <CircleStackIcon className="w-3.5 h-3.5" />
                      Shared_Memory
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReasoningThread;
