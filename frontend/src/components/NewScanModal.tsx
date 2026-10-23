'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from './Toast';
import { Resume } from '@/types';
import { X, Sparkles, FileText, Briefcase, Zap } from 'lucide-react';

interface NewScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: Resume[];
  selectedResumeSlug?: string;
  onScanCreated: () => void;
}

const SAMPLE_JDS = [
  {
    title: 'Full Stack Engineer (React/Django)',
    content: `We are seeking a senior Full Stack Engineer with strong experience in Python, Django REST Framework, React, Next.js, and TypeScript.
Key Requirements:
- 3+ years experience building scalable web APIs with Django and Celery.
- Proficiency in modern frontend technologies including React, Next.js, and state management.
- Experience with PostgreSQL, Redis caching, and async job queues.
- Strong knowledge of RESTful APIs, JWT authentication, and Docker.
- Passion for clean code, automated testing, and CI/CD pipelines.`,
  },
  {
    title: 'AI / ML Software Engineer',
    content: `Looking for an AI Software Engineer to integrate Large Language Models (LLMs) and build intelligent backend services.
Requirements:
- Strong programming skills in Python and PyTorch / TensorFlow.
- Experience integrating Gemini, OpenAI, or Anthropic APIs into production web systems.
- Familiarity with vector databases, embeddings, and prompt engineering.
- Solid background in cloud architecture (AWS/GCP), Celery workers, and Redis.`,
  },
];

export function NewScanModal({
  isOpen,
  onClose,
  resumes,
  selectedResumeSlug,
  onScanCreated,
}: NewScanModalProps) {
  const { showToast } = useToast();

  const [resumeSlug, setResumeSlug] = useState<string>(selectedResumeSlug || resumes[0]?.slug || '');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeSlug) {
      showToast('Please select a resume to scan', 'error');
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 50) {
      showToast('Job description should be at least 50 characters long', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createScan(resumeSlug, jobDescription);
      showToast(res.message || 'ATS score calculation initiated in background!', 'success');
      onScanCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start scan';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '32px', maxWidth: '720px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} color="#818cf8" />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>New ATS Match Scan</h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Compare your resume against a target job description to compute your ATS match score and discover missing keywords.
            </p>
          </div>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Resume Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Select Resume to Scan
            </label>
            <select
              value={resumeSlug}
              onChange={(e) => setResumeSlug(e.target.value)}
              className="form-input"
              style={{ cursor: 'pointer' }}
            >
              {resumes.map((r, idx) => (
                <option key={r.slug} value={r.slug} style={{ background: '#0f172a' }}>
                  Resume #{idx + 1} ({r.slug}) - {new Date(r.created_on).toLocaleDateString()}
                  {r.resumedata ? ' ✓ Ready' : ' (Extracting text...)'}
                </option>
              ))}
            </select>
          </div>

          {/* Sample JD suggestions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Target Job Description (JD) *
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                {jobDescription.length} chars
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
                Quick Fill:
              </span>
              {SAMPLE_JDS.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setJobDescription(sample.content)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.76rem', borderRadius: '6px' }}
                >
                  <Briefcase size={12} />
                  <span>{sample.title}</span>
                </button>
              ))}
            </div>

            <textarea
              required
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the complete job description, requirements, and responsibilities here..."
              className="form-textarea"
              style={{ resize: 'vertical', lineHeight: '1.5', fontFamily: 'inherit' }}
            />
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !resumeSlug}
              className="btn-primary"
              style={{ minWidth: '150px' }}
            >
              <Zap size={16} />
              <span>{submitting ? 'Initiating Scan...' : 'Calculate ATS Score'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
