'use client';

import React from 'react';

export default function RemovedOperationsPanel({ removedOperations = [] }) {
  if (!removedOperations || removedOperations.length === 0) {
    return null;
  }

  return (
    <div style={{
      marginBottom: '24px',
      padding: '16px 20px',
      backgroundColor: '#161314',
      border: '1px solid #7f1d1d',
      borderRadius: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{
          backgroundColor: '#ef4444',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '4px',
          textTransform: 'uppercase',
        }}>
          Removed in Current Build
        </span>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: 600 }}>
          Removed Operations ({removedOperations.length}) — Non-Executable
        </h4>
      </div>
      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#9aa0a8' }}>
        The following operations existed in the baseline manifest but are no longer present in the active codebase. They cannot be executed.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {removedOperations.map((op) => (
          <div
            key={op.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: '#1f1315',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '12px',
                fontWeight: 700,
                color: '#ef4444',
                textDecoration: 'line-through',
              }}>
                {op.method}
              </span>
              <span style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '13px',
                color: '#e2e8f0',
                textDecoration: 'line-through',
              }}>
                {op.path}
              </span>
              {op.summary && (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  — {op.summary}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#f87171', fontStyle: 'italic' }}>
              {op.diffSummary || 'Removed from API'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
