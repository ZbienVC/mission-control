'use client';

import { Agent, Task } from '@/lib/agents';

interface VisualizationPanelProps {
  agents: Agent[];
  tasks: Task[];
}

export default function VisualizationPanel({ agents, tasks }: VisualizationPanelProps) {
  const workingAgents = agents.filter(a => a.status === 'working').length;
  const activeTasks = tasks.filter(t => t.status === 'running').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Stats Grid */}
      <div style={{ background: 'rgba(15,22,41,0.8)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', margin: 0 }}>📊 Mission Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Active Agents */}
          <div style={{ background: 'linear-gradient(135deg, rgba(16,217,160,0.1), transparent)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(16,217,160,0.2)', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#6b7db3', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Agents
            </p>
            <p style={{ fontSize: '36px', fontWeight: 900, color: '#10d9a0', margin: 0 }}>
              {workingAgents}/{agents.length}
            </p>
          </div>

          {/* Running Tasks */}
          <div style={{ background: 'linear-gradient(135deg, rgba(79,157,235,0.1), transparent)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(79,157,235,0.2)', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#6b7db3', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase' }}>
              Tasks Running
            </p>
            <p style={{ fontSize: '36px', fontWeight: 900, color: '#4f9deb', margin: 0 }}>
              {activeTasks}
            </p>
          </div>

          {/* Completed Tasks */}
          <div style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.1), transparent)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(5,150,105,0.2)', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#6b7db3', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase' }}>
              Completed
            </p>
            <p style={{ fontSize: '36px', fontWeight: 900, color: '#059669', margin: 0 }}>
              {completedTasks}
            </p>
          </div>

          {/* Total Tasks */}
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), transparent)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#6b7db3', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Tasks
            </p>
            <p style={{ fontSize: '36px', fontWeight: 900, color: '#f59e0b', margin: 0 }}>
              {tasks.length}
            </p>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div style={{ background: 'rgba(15,22,41,0.8)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', margin: 0 }}>🤖 Agent Network</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {agents.map(agent => {
            const agentTasks = tasks.filter(t => t.assignedAgent === agent.type);
            const avgProgress = agentTasks.length > 0 ? Math.round(agentTasks.reduce((sum, t) => sum + t.progress, 0) / agentTasks.length) : 0;

            return (
              <div
                key={agent.id}
                style={{
                  background: agent.status === 'working' ? 'rgba(16,217,160,0.05)' : 'rgba(255,255,255,0.02)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: agent.status === 'working' ? '1px solid rgba(16,217,160,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center',
                  transition: 'all 0.3s',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: agent.status === 'working' ? 'rgba(16,217,160,0.1)' : 'rgba(255,255,255,0.05)',
                    border: agent.status === 'working' ? '2px solid #10d9a0' : '2px solid #6b7db3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    fontSize: '16px',
                  }}
                >
                  {agent.type === 'coding' && '💻'}
                  {agent.type === 'research' && '🔬'}
                  {agent.type === 'operations' && '⚙️'}
                  {agent.type === 'growth' && '📈'}
                </div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4ff', margin: '0 0 4px' }}>
                  {agent.name}
                </p>
                <p style={{ fontSize: '11px', color: agent.status === 'working' ? '#10d9a0' : '#6b7db3', margin: '0 0 8px', fontWeight: 600, textTransform: 'capitalize' }}>
                  {agent.status}
                </p>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #10d9a0, #4f9deb)',
                      width: `${avgProgress}%`,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <p style={{ fontSize: '10px', color: '#6b7db3', margin: 0 }}>
                  {agentTasks.length} task{agentTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Feed */}
      <div style={{ gridColumn: '1 / -1', background: 'rgba(15,22,41,0.8)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', margin: 0 }}>📈 Activity Feed</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
          {tasks.length === 0 ? (
            <p style={{ color: '#6b7db3', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No activity yet
            </p>
          ) : (
            tasks
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    borderLeft: '2px solid rgba(16,217,160,0.2)',
                  }}
                >
                  <div style={{ fontSize: '16px', marginTop: '2px' }}>
                    {task.status === 'completed' && '✓'}
                    {task.status === 'running' && '⚡'}
                    {task.status === 'queued' && '📋'}
                    {task.status === 'failed' && '✕'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4ff', margin: '0 0 2px' }}>
                      {task.title}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6b7db3', margin: 0 }}>
                      {new Date(task.createdAt).toLocaleString()} — {task.assignedAgent}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
