'use client';

import React, { useState } from 'react';
import { useToast } from './Toast';
import {
  downloadAsMarkdown,
  downloadAsText,
  downloadAsWordDoc,
  printResume,
  markdownToBasicHtml
} from '@/lib/downloadResume';
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  FileCode,
  FileText,
  Sparkles,
  AlignLeft,
  LayoutTemplate
} from 'lucide-react';

interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  content: string | null;
  isAiGenerated?: boolean;
}

export function ResumeViewerModal({
  isOpen,
  onClose,
  title,
  subtitle,
  content,
  isAiGenerated = false,
}: ResumeViewerModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    showToast('Resume content copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    if (!content) return;
    printResume(content, title);
    showToast('Opening print dialog. Select "Save as PDF" to download your ATS resume.', 'info');
  };

  const handleDownloadDoc = () => {
    if (!content) return;
    downloadAsWordDoc(content, title);
    showToast('Downloaded Word-compatible resume (.doc)', 'success');
  };

  const handleDownloadMd = () => {
    if (!content) return;
    downloadAsMarkdown(content, title);
    showToast('Downloaded resume as Markdown (.md)', 'success');
  };

  const handleDownloadTxt = () => {
    if (!content) return;
    downloadAsText(content, title);
    showToast('Downloaded plain text ATS resume (.txt)', 'success');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '28px', maxWidth: '860px', width: '95%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isAiGenerated ? 'var(--gradient-brand)' : 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isAiGenerated ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
                }}
              >
                {isAiGenerated ? <Sparkles size={18} color="#fff" /> : <FileText size={18} color="#06b6d4" />}
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{title}</h2>
                {subtitle && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
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

        {/* Toolbar: View Toggle & Download Options */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('preview')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: viewMode === 'preview' ? 'var(--gradient-brand)' : 'transparent',
                color: viewMode === 'preview' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LayoutTemplate size={13} />
              <span>ATS Preview</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: viewMode === 'raw' ? 'var(--gradient-brand)' : 'transparent',
                color: viewMode === 'raw' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileCode size={13} />
              <span>Raw Markdown</span>
            </button>
          </div>

          {/* Download Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePrintPdf}
              className="btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                boxShadow: '0 2px 10px rgba(6, 182, 212, 0.3)',
              }}
              title="Save or Print as PDF in standard ATS format"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadDoc}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Download Word Document"
            >
              <FileText size={14} color="#60a5fa" />
              <span>Word (.doc)</span>
            </button>

            <button
              onClick={handleDownloadMd}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Download Markdown"
            >
              <Download size={14} />
              <span>Markdown (.md)</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Download Plain Text"
            >
              <AlignLeft size={14} />
              <span>Plain Text</span>
            </button>

            <button
              onClick={handleCopy}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Copy to Clipboard"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        {viewMode === 'preview' ? (
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '12px',
              padding: '32px 36px',
              maxHeight: '58vh',
              overflowY: 'auto',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.92rem',
              lineHeight: 1.55,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {content ? (
              <div
                dangerouslySetInnerHTML={{ __html: markdownToBasicHtml(content) }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              />
            ) : (
              <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                No content available or resume is still being generated.
              </p>
            )}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(10, 14, 23, 0.95)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '20px',
              maxHeight: '58vh',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
            }}
          >
            {content || 'No text extracted yet or content is still being processed.'}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            💡 Tip: Click <strong>&quot;Print / Save PDF&quot;</strong> and choose <strong>&quot;Save as PDF&quot;</strong> in your browser to get a print-ready ATS resume.
          </span>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 18px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
