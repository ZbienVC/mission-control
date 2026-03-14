'use client';

import { useState, useEffect } from 'react';
import { Task, Agent, AGENTS, AgentType, executeTask } from '../lib/agents';
import TaskCreationForm from '../components/TaskCreationForm';
import AgentDashboard from '../components/AgentDashboard';
import TaskQueue from '../components/TaskQueue';
import VisualizationPanel from '../components/VisualizationPanel';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>(
    Object.entries(AGENTS).map(([key, agentConfig]) => ({
      ...agentConfig,
      id: key,
      status: 'idle' as const,
      memory: [],
    }))
  );
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'visualization'>('dashboard');

  // Handle new task creation
  const handleCreateTask = async (title: string, description: string, agentType: AgentType) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      assignedAgent: agentType,
      status: 'queued',
      createdAt: new Date(),
      progress: 0,
      checkpoints: [
        {
          id: '0',
          timestamp: new Date(),
          message: 'Task created and queued',
          type: 'progress',
        },
      ],
    };

    setTasks([newTask, ...tasks]);

    // Simulate agent pickup
    setTimeout(() => {
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === newTask.id ? { ...t, status: 'running' as const, startedAt: new Date() } : t))
      );

      // Update agent status
      setAgents(prevAgents =>
        prevAgents.map(a => (a.type === agentType ? { ...a, status: 'working' as const, currentTask: newTask.id } : a))
      );
    }, 500);
  };

  // Simulate task progression
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.status === 'running' && task.progress < 100) {
            const newProgress = Math.min(task.progress + Math.random() * 15, 100);
            return { ...task, progress: newProgress };
          }
          if (task.status === 'running' && task.progress >= 100) {
            return {
              ...task,
              status: 'completed' as const,
              completedAt: new Date(),
              result: `Task completed successfully`,
            };
          }
          return task;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update agent status based on tasks
  useEffect(() => {
    setAgents(prevAgents =>
      prevAgents.map(agent => {
        const activeTask = tasks.find(t => t.assignedAgent === agent.type && t.status === 'running');
        return {
          ...agent,
          status: activeTask ? 'working' : 'idle',
          currentTask: activeTask?.id,
        };
      })
    );
  }, [tasks]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e27', color: '#f0f4ff' }}>
      {/* Header */}
      <header style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,22,41,0.8)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #10d9a0, #4f9deb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎛️ Mission Control
        </h1>
        <p style={{ color: '#6b7db3', fontSize: '14px', margin: '8px 0 0' }}>
          Agent orchestration platform — {agents.filter(a => a.status === 'working').length} agents active, {tasks.filter(t => t.status === 'running').length} tasks in progress
        </p>
      </header>

      {/* Navigation */}
      <nav style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,22,41,0.5)' }}>
        {(['dashboard', 'queue', 'visualization'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab ? 'rgba(16,217,160,0.1)' : 'transparent',
              color: activeTab === tab ? '#10d9a0' : '#6b7db3',
              border: activeTab === tab ? '1px solid rgba(16,217,160,0.3)' : 'none',
              borderBottom: activeTab === tab ? '2px solid #10d9a0' : '1px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'dashboard' && '📊 Dashboard'}
            {tab === 'queue' && '📋 Task Queue'}
            {tab === 'visualization' && '🎨 Visualization'}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <TaskCreationForm onCreateTask={handleCreateTask} />
            <AgentDashboard agents={agents} tasks={tasks} />
          </div>
        )}

        {activeTab === 'queue' && <TaskQueue tasks={tasks} agents={agents} />}

        {activeTab === 'visualization' && <VisualizationPanel agents={agents} tasks={tasks} />}
      </main>
    </div>
  );
}
