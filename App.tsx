
import React, { useState, useRef, useEffect } from 'react';
import { AgentRole, AgentStatus, MultiAgentState, TaskStep } from './types';
import { agentService } from './services/geminiService';
import ReasoningThread from './components/ReasoningThread';
import { 
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CommandLineIcon,
  DocumentIcon,
  XMarkIcon,
  TableCellsIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  CircleStackIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const ChartView: React.FC<{ data: { labels: string[], values: number[], title?: string } }> = ({ data }) => {
  if (!data || !data.labels || !data.values || data.labels.length === 0 || data.values.length === 0) {
    return (
      <div className="mt-6 p-10 border border-dashed border-[var(--border-color)] rounded-2xl flex flex-col items-center justify-center text-[var(--text-secondary)]">
        <ChartBarIcon className="w-8 h-8 opacity-20 mb-2" />
        <span className="text-xs uppercase font-bold tracking-tighter opacity-40">No Visualization Data In Memory</span>
      </div>
    );
  }
  const maxVal = Math.max(...data.values, 1);
  return (
    <div className="mt-12 p-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{data.title || 'Data Insights'}</h4>
          </div>
        </div>
      </div>
      <div className="flex items-end gap-6 h-72 w-full px-4 border-b border-[var(--border-color)] pb-6">
        {data.values.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
            <div className="w-full bg-gradient-to-t from-blue-700 to-blue-400 rounded-t-xl transition-all duration-700 hover:from-blue-500" style={{ height: `${(val / maxVal) * 100}%`, minHeight: '12px' }} />
            <span className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-tighter truncate w-full block text-center mt-4 opacity-50">{data.labels[i] || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [thread, setThread] = useState<any[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{name: string, data: string, type: string}[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<MultiAgentState>({
    requestId: Math.random().toString(36).substring(7),
    originalRequest: '',
    currentPhase: 'INTAKE',
    steps: [],
    isAmbiguous: false,
    clarifyingQuestions: []
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const pushToThread = (from: string, to: string, content: string, type: 'thought' | 'action' | 'verification' | 'system' = 'thought') => {
    setThread(prev => [...prev, { from, to, content, type, timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) }]);
  };

  const runAdkEngine = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isProcessing) return;
    
    setIsProcessing(true);
    setThread([]);
    setLiveTranscript('');
    setState(s => ({ ...s, isAmbiguous: false, steps: [], currentPhase: 'INTAKE', finalResult: undefined }));
    pushToThread('SYSTEM', 'A2A_CORE', `Establishing secure A2A neural link...`, 'system');
    
    let liveSession: any = null;
    try {
      liveSession = await agentService.connectLiveOrchestrator((text) => setLiveTranscript(text));
    } catch (e) {}

    try {
      const sourceBlock = attachedFiles.map(f => `FILE[${f.name}]: ${atob(f.data).substring(0, 20000)}`).join('\n---\n');
      const augmentedInput = `${input}\n\n[INJECTED_CONTEXT]:\n${sourceBlock}`;

      const intake = await agentService.adkIntake(augmentedInput);
      pushToThread('SYSTEM', 'ORCHESTRATOR', intake.dialogue, 'system');
      
      if (intake.needs_clarification) {
        setState(s => ({ ...s, isAmbiguous: true, clarifyingQuestions: intake.questions }));
        setIsProcessing(false);
        return;
      }

      pushToThread('PLANNER', 'ORCHESTRATOR', `Synthesizing strategy...`, 'thought');
      const plan = await agentService.adkPlan(augmentedInput);
      pushToThread('PLANNER', 'ORCHESTRATOR', plan.planner_dialogue, 'thought');
      
      const steps: TaskStep[] = plan.execution_graph.map((t: any) => ({
        id: t.id, agent: t.tool as AgentRole, description: t.prompt, status: AgentStatus.WAITING, dependencies: t.dependencies
      }));

      setState(s => ({ ...s, steps, currentPhase: 'EXECUTION' }));
      let sharedContext = augmentedInput;
      let chartDataFromAgents: any = null;
      
      for (const step of steps) {
        setState(s => ({ ...s, steps: s.steps.map(st => st.id === step.id ? { ...st, status: AgentStatus.EXECUTING } : st) }));
        pushToThread('ORCHESTRATOR', step.agent, `DELEGATING: ${step.description}`, 'action');
        
        const result = await agentService.adkExecuteTool(step, sharedContext);
        pushToThread(step.agent, 'ORCHESTRATOR', result.handshake_message, 'thought');
        
        if (result.chart_data && result.chart_data.values && result.chart_data.values.length > 0) {
          chartDataFromAgents = result.chart_data;
          pushToThread(step.agent, 'VISUAL_SUBSYSTEM', `Generating visualization layer...`, 'thought');
        }

        const verification = await agentService.adkVerify(step, result, sourceBlock);
        pushToThread('CRITIC', step.agent, verification.critic_dialogue, 'verification');
        
        if (!verification.is_valid) {
          throw new Error(`Integrity fault: ${verification.issues.join('; ')}`);
        }

        sharedContext += `\n\n[Agent ${step.agent}]:\n${result.output}\n[DATA]: ${JSON.stringify(result.chart_data || {})}`;
        setState(s => ({ ...s, steps: s.steps.map(st => st.id === step.id ? { ...st, status: AgentStatus.COMPLETED, output: result.output } : st) }));
      }

      setState(s => ({ ...s, currentPhase: 'AGGREGATION' }));
      const finalResult = await agentService.adkAggregate(input, sharedContext);
      if (!finalResult.chart_data && chartDataFromAgents) finalResult.chart_data = chartDataFromAgents;
      
      setState(s => ({ ...s, currentPhase: 'DONE', finalResult }));
    } catch (err: any) {
      pushToThread('SYSTEM', 'USER', `HALTED: ${err.message}`, 'system');
    } finally {
      setIsProcessing(false);
      setTimeout(() => { if (liveSession) liveSession.close(); }, 1000);
    }
  };

  return (
    <div className="main-frame">
      <button onClick={toggleTheme} className="theme-btn" aria-label="Toggle theme">
        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
      </button>

      <div className="w-full flex justify-center pt-4 mb-8">
          <div className="px-6 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center gap-6 shadow-xl backdrop-blur-3xl">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
            <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">Nexus A2A Swarm OS</span>
          </div>
      </div>

      <div className={`w-full max-w-3xl flex flex-col items-center transition-all duration-700 ${thread.length > 0 ? 'mt-4' : 'mt-[10vh]'}`}>
          {!state.finalResult && !isProcessing && thread.length === 0 && (
            <div className="flex flex-col items-center mb-12">
               <div className="flex items-center gap-6 mb-6">
                <ArrowsRightLeftIcon className="w-12 h-12 text-blue-500" />
                <span className="text-5xl font-light tracking-tighter text-[var(--text-primary)]">nexus<span className="font-black text-blue-500">.visual</span></span>
              </div>
              <h1 className="text-5xl font-normal text-center text-[var(--text-primary)] opacity-95 leading-[1.1] tracking-tight">Multi-Agent Synthesis Swarm</h1>
            </div>
          )}

          <div className="perplex-input-container p-8">
            <textarea
              className="w-full bg-transparent text-2xl text-[var(--text-primary)] placeholder-[var(--input-placeholder)] outline-none resize-none h-32 font-medium"
              placeholder="Deploy analysis swarm (e.g., 'Analyze quarterly sales')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), runAdkEngine())}
            />
            <div className="flex items-center justify-between mt-4 pt-6 border-t border-[var(--border-color)]">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] border border-blue-500/30 px-6 py-2.5 rounded-full hover:bg-blue-500/5 transition-all">
                <PlusIcon className="w-4 h-4" /> Data Source
              </button>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                Array.from(files).forEach(file => {
                  const r = new FileReader();
                  r.onload = (ev) => setAttachedFiles(p => [...p, { name: file.name, type: file.type, data: (ev.target?.result as string).split(',')[1] }]);
                  r.readAsDataURL(file);
                });
              }} accept=".csv,.txt" />
              <button onClick={runAdkEngine} disabled={isProcessing} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isProcessing ? 'bg-slate-700' : 'bg-blue-500 shadow-xl hover:scale-105 active:scale-95'}`}>
                <ArrowRightIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {(thread.length > 0 || isProcessing) && (
            <div className="mt-16 space-y-12 pb-20 w-full">
              <div className="w-full flex items-center gap-6 py-8 border-b border-[var(--border-color)]">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <CommandLineIcon className="w-8 h-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Agent-to-Agent Stream</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium tracking-wide flex items-center gap-3 mt-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    {liveTranscript || 'Synchronizing agents...'}
                  </p>
                </div>
              </div>
              
              <ReasoningThread messages={thread} />
              
              {state.finalResult && (
                <div className="w-full space-y-12 pt-16 border-t border-[var(--border-color)]">
                  <div className="bg-[var(--bg-card)] p-12 rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                    
                    <div className="mb-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CircleStackIcon className="w-6 h-6 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)]">Aggregated System Output</span>
                      </div>
                      <div className="px-4 py-1.5 rounded-full border border-blue-500/30 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        Confidence: {(state.finalResult.confidence * 100).toFixed(0)}%
                      </div>
                    </div>

                    <p className="text-[var(--text-primary)] text-2xl leading-[1.4] font-light mb-12 tracking-tight">
                      {state.finalResult.final_answer}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                      <div className="p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                            <ArchiveBoxIcon className="w-4 h-4" /> Artifacts
                         </h5>
                         <div className="flex flex-wrap gap-2">
                           {state.finalResult.artifacts.map((art: string, idx: number) => (
                             <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-400">
                               {art}
                             </span>
                           ))}
                         </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4">Metadata Payload</h5>
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono">
                               <span className="opacity-40">STATUS:</span>
                               <span className="text-emerald-500">{state.finalResult.status}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono">
                               <span className="opacity-40">SUMMARY:</span>
                               <span className="text-blue-400 text-right max-w-[150px] truncate">{state.finalResult.summary}</span>
                            </div>
                         </div>
                      </div>
                    </div>

                    {state.finalResult.chart_data && <ChartView data={state.finalResult.chart_data} />}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default App;
