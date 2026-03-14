// Agent definitions and execution system

export type AgentType = 'coding' | 'research' | 'operations' | 'growth';
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'escalated';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedAgent: AgentType;
  status: TaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number; // 0-100
  result?: string;
  error?: string;
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  id: string;
  timestamp: Date;
  message: string;
  type: 'progress' | 'decision' | 'escalation' | 'error';
  requiresInput?: boolean;
  inputNeeded?: string;
}

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  capabilities: string[];
  status: 'idle' | 'working' | 'error';
  currentTask?: string;
  memory: AgentMemory[];
  activeSince?: Date;
}

export interface AgentMemory {
  id: string;
  context: string;
  relevantTo: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Agent configurations
export const AGENTS: Record<AgentType, Omit<Agent, 'id' | 'status' | 'memory' | 'currentTask'>> = {
  coding: {
    type: 'coding',
    name: 'Code Agent',
    description: 'Builds features, fixes bugs, writes code',
    capabilities: ['GitHub access', 'Code generation', 'Testing', 'Debugging', 'Refactoring'],
    activeSince: new Date(),
  },
  research: {
    type: 'research',
    name: 'Research Agent',
    description: 'Market research, competitor analysis, trend research',
    capabilities: ['Web search', 'Data analysis', 'Report generation', 'Trend analysis'],
    activeSince: new Date(),
  },
  operations: {
    type: 'operations',
    name: 'Operations Agent',
    description: 'Deployment, monitoring, infrastructure',
    capabilities: ['Deployment', 'Monitoring', 'Infrastructure setup', 'Performance analysis'],
    activeSince: new Date(),
  },
  growth: {
    type: 'growth',
    name: 'Growth Agent',
    description: 'Marketing, user acquisition, growth strategy',
    capabilities: ['Marketing analysis', 'Growth strategy', 'User research', 'Analytics'],
    activeSince: new Date(),
  },
};

// Simulate agent execution
export async function executeTask(task: Task): Promise<Task> {
  const updatedTask = { ...task, status: 'running' as TaskStatus, startedAt: new Date() };
  
  // Simulate progress
  for (let i = 0; i <= 100; i += 20) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    updatedTask.progress = i;
  }

  updatedTask.status = 'completed';
  updatedTask.completedAt = new Date();
  updatedTask.result = `Task "${task.title}" completed successfully`;

  return updatedTask;
}
