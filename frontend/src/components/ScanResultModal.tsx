'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from './Toast';
import { ScoreGauge } from './ScoreGauge';
import { ResumeScan } from '@/types';
import confetti from 'canvas-confetti';
import { X, Sparkles, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, FileText, Bot } from 'lucide-react';

interface ScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  scan: ResumeScan | null;
  resumeSlug?: string;
  onOptimizationStarted: () => void;
}

export function ScanResultModal({
  isOpen,
  onClose,
  scan: initialScan,
  resumeSlug,
  onOptimizationStarted,
}: ScanResultModalProps) {
  const { showToast } = useToast();
  const [scan, setScan] = useState<ResumeScan | null>(initialScan);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    setScan(initialScan);
    if (initialScan && initialScan.ats_score !== null && initialScan.ats_score >= 80) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [initialScan]);

  // Auto-poll when ATS score is still being calculated in background
  useEffect(() => {
    if (!isOpen || !scan || scan.ats_score !== null || !resumeSlug) return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getScanDetail(resumeSlug, scan.slug);
        if (updated.ats_score !== null) {
          setScan(updated);
          showToast(`ATS Score is ${updated.ats_score}/100!`, 'success');
          if (updated.ats_score >= 80) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        }
      } catch {
        // Silently retry on next tick
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, scan, resumeSlug, showToast]);

  if (!isOpen || !scan) return null;

  const handleRefresh = async () => {
    if (!resumeSlug) return;
    setRefreshing(true);
    try {
      const updated = await api.getScanDetail(resumeSlug, scan.slug);
      setScan(updated);
      if (updated.ats_score !== null) {
        showToast(`ATS Score is ${updated.ats_score}/100!`, 'success');
        if (updated.ats_score >= 80) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } else {
        showToast('Still calculating... please check back in a few seconds', 'info');
      }
    } catch {
      showToast('Could not refresh scan score', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTriggerOptimization = async () => {
    setOptimizing(true);
    try {
      const res = await api.triggerAtsResumeOptimization(scan.slug);
      showToast(res.message || 'AI resume optimization task started!', 'success');
      onOptimizationStarted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Optimization failed';
      showToast(msg, 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const isPending = scan.ats_score === null;
  const isHighScore = scan.ats_score !== null && scan.ats_score >= 80;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '32px', maxWidth: '680px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>ATS Scan Assessment</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Scan ID: <code style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{scan.slug}</code> •{' '}
              {new Date(scan.created_on).toLocaleString()}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh score"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px',
                color: 'var(--text-muted)',
              }}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px',
                color: 'var(--text-muted)',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Score Gauge Section */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <ScoreGauge score={scan.ats_score} size={140} />

          {/* Status Message */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            {isPending ? (
              <p style={{ fontSize: '0.9rem', color: '#38bdf8' }}>
                Your resume text and job description are currently being evaluated by the ATS AI agent. Click refresh in a moment.
              </p>
            ) : isHighScore ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <CheckCircle size={18} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  Excellent compatibility! Your resume hits ATS keyword thresholds (80+).
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  color: '#fb7185',
                  background: 'rgba(244, 63, 94, 0.08)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                  <AlertTriangle size={18} />
                  <span>Resume Score Below 80 Threshold</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#fca5a5' }}>
                  The candidate resume is missing key terminologies or phrasing emphasized in the job description.
                  You can use the 1-Click AI Optimizer to reconstruct your resume with guaranteed ATS alignment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Job Description Preview */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Target Job Description Evaluated:
          </h4>
          <div
            style={{
              maxHeight: '120px',
              overflowY: 'auto',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5,
            }}
          >
            {scan.job_description}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>

          {!isPending && !isHighScore && (
            <button
              onClick={handleTriggerOptimization}
              disabled={optimizing}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Bot size={16} />
              <span>{optimizing ? 'Starting AI Optimizer...' : '1-Click Optimize Resume (AI)'}</span>
              <ArrowRight size={14} />
            </button>
          )}

          {isPending && (
            <button onClick={handleRefresh} disabled={refreshing} className="btn-outline-cyan">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>Check Calculation Result</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
