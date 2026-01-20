
import React, { useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: string;
  source: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const TerminalOutput: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black/80 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto border border-slate-700 shadow-inner" ref={scrollRef}>
      {logs.length === 0 && <p className="text-slate-500 italic">System idle. Waiting for request...</p>}
      {logs.map((log, i) => (
        <div key={i} className="mb-1 flex gap-2">
          <span className="text-slate-500">[{log.timestamp}]</span>
          <span className="text-blue-400 font-bold">[{log.source}]</span>
          <span className={
            log.type === 'error' ? 'text-red-400' : 
            log.type === 'success' ? 'text-emerald-400' : 
            log.type === 'warning' ? 'text-amber-400' : 
            'text-slate-300'
          }>
            {log.message}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TerminalOutput;
