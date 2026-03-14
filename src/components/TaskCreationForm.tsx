'use client';

import { useState } from 'react';
import { AgentType } from '@/lib/agents';

interface TaskCreationFormProps {
  onCreateTask: (title: string, description: string, agentType: AgentType) => void;
}

export default function TaskCreationForm({ onCreateTask }: TaskCreationFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agentType, setAgentType] = useState<AgentType>('coding');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateTask(title, description, agentType);
      setTitle('');
      setDescription('');
    }
  };

  return (
    <div style={{ background: 'rgba(15,22,41,0.8)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', margin: 0 }}>➕ Create Task</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Title Input */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#6b7db3', marginBottom: '6px', fontWeight: 600 }}>
            Task Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Build email authentication"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f0f4ff',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Description Input */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#6b7db3', marginBottom: '6px', fontWeight: 600 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed task description..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f0f4ff',
              fontSize: '14px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Agent Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#6b7db3', marginBottom: '6px', fontWeight: 600 }}>
            Assign to Agent
          </label>
          <select
            value={agentType}
            onChange={(e) => setAgentType(e.target.value as AgentType)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f0f4ff',
              fontSize: '14px',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          >
            <option value="coding">💻 Code Agent</option>
            <option value="research">🔬 Research Agent</option>
            <option value="operations">⚙️ Operations Agent</option>
            <option value="growth">📈 Growth Agent</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #10d9a0, #059669)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,217,160,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🚀 Queue Task
        </button>
      </form>
    </div>
  );
}
