'use client';

import React, { useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import './swagger-dark.css';
import RemovedOperationsPanel from './RemovedOperationsPanel';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      color: '#9aa0a8',
      fontSize: '15px',
      fontFamily: 'sans-serif',
    }}>
      Loading TemprFit Interactive API Explorer...
    </div>
  ),
});

export default function SwaggerExplorer({ canonicalSpec, changesReport }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Change mapping: "METHOD /path" -> change detail
  const changeMap = useMemo(() => {
    const map = new Map();
    if (changesReport && changesReport.operations) {
      for (const op of changesReport.operations) {
        map.set(op.id, op);
      }
    }
    return map;
  }, [changesReport]);

  // Extract all unique tags across the spec
  const allTags = useMemo(() => {
    const tags = new Set();
    if (canonicalSpec?.tags) {
      for (const t of canonicalSpec.tags) {
        tags.add(t.name);
      }
    }
    if (canonicalSpec?.paths) {
      for (const pathItem of Object.values(canonicalSpec.paths)) {
        for (const op of Object.values(pathItem)) {
          if (op && Array.isArray(op.tags)) {
            for (const t of op.tags) tags.add(t);
          }
        }
      }
    }
    return Array.from(tags).sort();
  }, [canonicalSpec]);

  // Total operation count in canonical spec
  const totalOperationsCount = useMemo(() => {
    let count = 0;
    if (canonicalSpec?.paths) {
      for (const pathItem of Object.values(canonicalSpec.paths)) {
        for (const m of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']) {
          if (pathItem[m]) count++;
        }
      }
    }
    return count;
  }, [canonicalSpec]);

  // Composable filter evaluation: AND logic
  const filteredSpec = useMemo(() => {
    if (!canonicalSpec || !canonicalSpec.paths) return canonicalSpec;

    const query = searchQuery.trim().toLowerCase();
    const filteredPaths = {};

    for (const [apiPath, pathItem] of Object.entries(canonicalSpec.paths)) {
      const matchingMethods = {};

      for (const [method, op] of Object.entries(pathItem)) {
        if (!op || typeof op !== 'object') continue;
        const upperMethod = method.toUpperCase();
        const opId = `${upperMethod} ${apiPath}`;
        const changeInfo = changeMap.get(opId);

        // 1. Method filter
        if (methodFilter !== 'ALL' && upperMethod !== methodFilter) {
          continue;
        }

        // 2. Tag filter
        if (tagFilter !== 'ALL') {
          const opTags = Array.isArray(op.tags) ? op.tags : [];
          if (!opTags.includes(tagFilter)) continue;
        }

        // 3. Status filter
        if (statusFilter !== 'ALL') {
          const status = changeInfo ? changeInfo.primaryStatus : 'UNKNOWN';
          if (status !== statusFilter) continue;
        }

        // 4. Full-text search (method, path, summary, description, tags)
        if (query.length > 0) {
          const summary = (op.summary || '').toLowerCase();
          const description = (op.description || '').toLowerCase();
          const pathLower = apiPath.toLowerCase();
          const tagsLower = Array.isArray(op.tags) ? op.tags.join(' ').toLowerCase() : '';
          const match =
            upperMethod.toLowerCase().includes(query) ||
            pathLower.includes(query) ||
            summary.includes(query) ||
            description.includes(query) ||
            tagsLower.includes(query);

          if (!match) continue;
        }

        matchingMethods[method] = op;
      }

      if (Object.keys(matchingMethods).length > 0) {
        filteredPaths[apiPath] = matchingMethods;
      }
    }

    return {
      ...canonicalSpec,
      paths: filteredPaths,
    };
  }, [canonicalSpec, searchQuery, methodFilter, tagFilter, statusFilter, changeMap]);

  // Count matching operations in filtered spec
  const filteredCount = useMemo(() => {
    let count = 0;
    if (filteredSpec?.paths) {
      for (const pathItem of Object.values(filteredSpec.paths)) {
        for (const m of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']) {
          if (pathItem[m]) count++;
        }
      }
    }
    return count;
  }, [filteredSpec]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setMethodFilter('ALL');
    setTagFilter('ALL');
    setStatusFilter('ALL');
  };

  const isFiltered =
    searchQuery.trim().length > 0 ||
    methodFilter !== 'ALL' ||
    tagFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  return (
    <div className="temprfit-swagger-wrapper">
      {/* Header Banner */}
      <div style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0e1013',
        padding: '20px 28px',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: '#0b0c0e',
                fontSize: '20px',
              }}>
                T
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#ffffff' }}>
                    TemprFit API Explorer
                  </h1>
                  <span style={{
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}>
                    v1.0.0
                  </span>
                  <span style={{
                    backgroundColor: '#064e3b',
                    color: '#34d399',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}>
                    LOCAL
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9aa0a8' }}>
                  Interactive OpenAPI 3.0.3 specification & deterministic change tracking for Next.js v1 backend
                </p>
              </div>
            </div>

            {/* Baseline Badge */}
            {changesReport && (
              <div style={{
                backgroundColor: '#131417',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div>
                  <span style={{ color: '#9aa0a8' }}>Baseline: </span>
                  <strong style={{ color: changesReport.baselineAvailable ? '#34d399' : '#f87171' }}>
                    {changesReport.baselineAvailable ? changesReport.baselineId : 'UNAVAILABLE'}
                  </strong>
                </div>
                {changesReport.baselineCommit && (
                  <span style={{ color: '#64748b', fontFamily: 'monospace' }}>
                    ({changesReport.baselineCommit.slice(0, 7)})
                  </span>
                )}
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px', display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#38bdf8' }}>{changesReport.summary.unchanged} Unchanged</span>
                  {changesReport.summary.new > 0 && <span style={{ color: '#34d399' }}>+{changesReport.summary.new} New</span>}
                  {changesReport.summary.changed > 0 && <span style={{ color: '#fbbf24' }}>~{changesReport.summary.changed} Changed</span>}
                  {changesReport.summary.removed > 0 && <span style={{ color: '#f87171' }}>-{changesReport.summary.removed} Removed</span>}
                </div>
              </div>
            )}
          </div>

          {/* Search & Composable Filter Toolbar */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
          }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 280px', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search endpoints by method, path, tag, or summary (e.g. GET, exercises, auth/login)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  backgroundColor: '#131417',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Method Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#9aa0a8', fontWeight: 600 }}>Method:</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#131417',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              >
                <option value="ALL">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            {/* Tag Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#9aa0a8', fontWeight: 600 }}>Domain:</label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#131417',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              >
                <option value="ALL">All Domains ({allTags.length})</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* Change Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#9aa0a8', fontWeight: 600 }}>Change Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#131417',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="UNCHANGED">Unchanged</option>
                <option value="NEW">New</option>
                <option value="CHANGED">Changed</option>
                <option value="REMOVED">Removed</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>

            {/* Reset Button */}
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: '#9aa0a8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Reset
              </button>
            )}

            {/* Result Counter */}
            <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#9aa0a8' }}>
              Showing <strong style={{ color: '#ffffff' }}>{filteredCount}</strong> of {totalOperationsCount} operations
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 28px' }}>
        {/* Removed Operations Panel (Visible when viewing All or Removed) */}
        {(statusFilter === 'ALL' || statusFilter === 'REMOVED') && changesReport?.removedOperations?.length > 0 && (
          <RemovedOperationsPanel removedOperations={changesReport.removedOperations} />
        )}

        {/* Empty Search Result State */}
        {filteredCount === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: '#131417',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            margin: '20px 0',
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '18px' }}>
              No operations match your filters
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#9aa0a8', fontSize: '14px' }}>
              Try adjusting your keyword query, clearing filters, or resetting the view.
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                padding: '8px 20px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Interactive Swagger UI Component with Preserved Redux Key */}
        {filteredCount > 0 && (
          <SwaggerUI
            spec={filteredSpec}
            docExpansion="list"
            defaultModelsExpandDepth={-1}
            displayRequestDuration={true}
            filter={false} // Built-in filter disabled in favor of our composable full-text filter toolbar
          />
        )}
      </div>
    </div>
  );
}
