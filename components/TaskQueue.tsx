'use client';

import { Task, Agent } from '@/lib/agents';

interface TaskQueueProps {
  tasks: Task[];
  agents: Agent[];
}

const statusColors: Record<string, string> = {
  queued: '#4f9deb',
  running: '#10d9a0',
  completed: '#059669',
  failed: '#ff6b6b',
  escalated: '#f59e0b',
};

export default function TaskQueue({ tasks, agents }: TaskQueueProps) {
  const getAgentName = (type: string) => {
    return agents.find(a => a.type === type)?.name || type;
  };

  return (
    <div style={{ background: 'rgba(15,22,41,0.8)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', margin: 0 }}>📋 Task Queue</h2>

      {tasks.length === 0 ? (
        <p style={{ color: '#6b7db3', fontSize: '14px', textAlign: 'center', padding: '40px 20px' }}>
          No tasks yet. Create one to get started!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
          {tasks.map((task, index) => (
            <div
              key={task.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                padding: '14px',
                border: `1px solid ${statusColors[task.status]}33`,
                borderLeft: `3px solid ${statusColors[task.status]}`,
                transition: 'all 0.2s',
              }}
            >
              {/* Task Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff', margin: '0 0 4px' }}>
                    #{index + 1} {task.title}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7db3', margin: 0 }}>
                    {task.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      background: `${statusColors[task.status]}22`,
                      color: statusColors[task.status],
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {task.status}
                  </span>
                </div>
              </div>

              {/* Task Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#6b7db3' }}>Agent:</span>{' '}
                  <span style={{ color: '#f0f4ff', fontWeight: 600 }}>{getAgentName(task.assignedAgent)}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7db3' }}>Created:</span>{' '}
                  <span style={{ color: '#f0f4ff', fontWeight: 600 }}>
                    {new Date(task.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {task.status === 'running' && (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${statusColors[task.status]}, #4f9deb)`,
                        width: `${task.progress}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b7db3', margin: 0, textAlign: 'right' }}>
                    {Math.round(task.progress)}% complete
                  </p>
                </>
              )}

              {/* Checkpoints */}
              {task.checkpoints.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '11px', color: '#6b7db3', margin: '0 0 6px', fontWeight: 600 }}>
                    Recent Updates:
                  </p>
                  {task.checkpoints.slice(-2).map(cp => (
                    <p key={cp.id} style={{ fontSize: '11px', color: '#c4d0f5', margin: '4px 0', display: 'flex', gap: '8px' }}>
                      <span>
                        {cp.type === 'progress' && '✓'}
                        {cp.type === 'decision' && '?'}
                        {cp.type === 'escalation' && '⚠️'}
                        {cp.type === 'error' && '✕'}
                      </span>
                      {cp.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
