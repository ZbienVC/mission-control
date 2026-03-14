'use client';

import { Agent, Task } from '@/lib/agents';

interface AgentDashboardProps {
  agents: Agent[];
  tasks: Task[];
}

export default function AgentDashboard({ agents, tasks }: AgentDashboardProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
      {agents.map(agent => {
        const currentTask = agent.currentTask ? tasks.find(t => t.id === agent.currentTask) : null;
        const completedCount = tasks.filter(t => t.assignedAgent === agent.type && t.status === 'completed').length;

        return (
          <div
            key={agent.id}
            style={{
              background: 'rgba(15,22,41,0.8)',
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${agent.status === 'working' ? 'rgba(16,217,160,0.3)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: agent.status === 'working' ? '0 0 20px rgba(16,217,160,0.1)' : 'none',
              transition: 'all 0.3s',
            }}
          >
            {/* Agent Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: '#f0f4ff' }}>
                  {agent.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#6b7db3', margin: 0 }}>
                  {agent.description}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: agent.status === 'working' ? '#10d9a0' : agent.status === 'error' ? '#ff6b6b' : '#6b7db3',
                    marginBottom: '8px',
                    animation: agent.status === 'working' ? 'pulse 2s infinite' : 'none',
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6b7db3', margin: 0, fontWeight: 600, textTransform: 'capitalize' }}>
                  {agent.status}
                </p>
              </div>
            </div>

            {/* Current Task */}
            {currentTask && (
              <div style={{ background: 'rgba(16,217,160,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(16,217,160,0.1)' }}>
                <p style={{ fontSize: '12px', color: '#6b7db3', margin: '0 0 6px', fontWeight: 600 }}>
                  📋 Current Task
                </p>
                <p style={{ fontSize: '13px', color: '#f0f4ff', margin: '0 0 8px', fontWeight: 600 }}>
                  {currentTask.title}
                </p>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #10d9a0, #4f9deb)',
                      width: `${currentTask.progress}%`,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: '#6b7db3', margin: '6px 0 0', textAlign: 'right' }}>
                  {Math.round(currentTask.progress)}%
                </p>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#6b7db3', margin: 0, fontWeight: 600 }}>TASKS COMPLETED</p>
                <p style={{ fontSize: '18px', fontWeight: 900, color: '#10d9a0', margin: '4px 0 0' }}>
                  {completedCount}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#6b7db3', margin: 0, fontWeight: 600 }}>CAPABILITIES</p>
                <p style={{ fontSize: '13px', color: '#f0f4ff', margin: '4px 0 0' }}>
                  {agent.capabilities.length}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
