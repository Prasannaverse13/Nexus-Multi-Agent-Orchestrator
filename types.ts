
export enum AgentStatus {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  WAITING = 'WAITING'
}

export enum AgentRole {
  ORCHESTRATOR = 'Orchestrator',
  PLANNER = 'Planner',
  RESEARCHER = 'Researcher',
  CODER = 'Coder',
  ANALYST = 'Analyst',
  CRITIC = 'Critic',
  STATUS_REPORTER = 'Status Reporter',
  AGGREGATOR = 'Aggregator',
  SERVICE_BROKER = 'Service Broker',
  VISUAL_SUBSYSTEM = 'Visual Subsystem'
}

export interface TaskStep {
  id: string;
  agent: AgentRole;
  description: string;
  status: AgentStatus;
  output?: string;
  dependencies?: string[];
}

export interface MultiAgentState {
  requestId: string;
  originalRequest: string;
  currentPhase: 'INTAKE' | 'PLANNING' | 'EXECUTION' | 'AGGREGATION' | 'DONE';
  steps: TaskStep[];
  isAmbiguous: boolean;
  clarifyingQuestions: string[];
  finalResult?: any;
}
