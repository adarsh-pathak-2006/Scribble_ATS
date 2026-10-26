'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useToast } from './Toast';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function ResumeUploadModal({ isOpen, onClose, onUploadSuccess }: ResumeUploadModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Only PDF resumes are supported', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB', 'error');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a PDF file first', 'error');
      return;
    }

    setUploading(true);
    try {
      await api.uploadResume(selectedFile);
      showToast('Resume uploaded! Background PDF text extraction started.', 'success');
      setSelectedFile(null);
      onUploadSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Upload New Resume</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Upload your PDF resume to run ATS analysis and generate optimized versions.
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

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '16px',
            padding: '36px 20px',
            textAlign: 'center',
            background: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <UploadCloud size={28} color="#818cf8" />
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
            Click to upload or drag & drop
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            PDF files only (Max file size: 10MB)
          </p>
        </div>

        {/* Selected File Details */}
        {selectedFile && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={22} color="#06b6d4" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              style={{ background: 'transparent', color: 'var(--text-dim)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="btn-primary"
            style={{ minWidth: '130px' }}
          >
            {uploading ? 'Uploading...' : 'Confirm Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
