'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, FileText, UploadCloud, LogOut, User, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'resumes' | 'scans' | 'created';
  setActiveTab: (tab: 'resumes' | 'scans' | 'created') => void;
  onOpenUpload: () => void;
  onOpenAuth: () => void;
}

export function Navbar({ activeTab, setActiveTab, onOpenUpload, onOpenAuth }: NavbarProps) {
  const { isAuthenticated, profile, logout } = useAuth();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('resumes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            }}
          >
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #ffffff, #c7d2fe)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Skribbl<span style={{ color: '#818cf8', WebkitTextFillColor: '#818cf8' }}>Resume</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              AI ATS SCANNER & REWRITER
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        {isAuthenticated && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setActiveTab('resumes')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: activeTab === 'resumes' ? 'var(--gradient-brand)' : 'transparent',
                color: activeTab === 'resumes' ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'resumes' ? '0 2px 10px rgba(99, 102, 241, 0.3)' : 'none',
              }}
            >
              <FileText size={15} />
              <span>Resumes</span>
            </button>

            <button
              onClick={() => setActiveTab('scans')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: activeTab === 'scans' ? 'var(--gradient-brand)' : 'transparent',
                color: activeTab === 'scans' ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'scans' ? '0 2px 10px rgba(99, 102, 241, 0.3)' : 'none',
              }}
            >
              <ShieldCheck size={15} />
              <span>ATS Scans</span>
            </button>

            <button
              onClick={() => setActiveTab('created')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: activeTab === 'created' ? 'var(--gradient-brand)' : 'transparent',
                color: activeTab === 'created' ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'created' ? '0 2px 10px rgba(99, 102, 241, 0.3)' : 'none',
              }}
            >
              <Sparkles size={15} />
              <span>AI Optimized</span>
            </button>
          </nav>
        )}

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated ? (
            <>
              <button onClick={onOpenUpload} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
                <UploadCloud size={16} />
                <span>Upload PDF</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  padding: '5px 12px',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--gradient-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {profile?.nickname ? profile.nickname[0].toUpperCase() : <User size={13} />}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {profile?.nickname || profile?.user.username || 'User'}
                </span>

                <button
                  onClick={logout}
                  title="Logout"
                  style={{
                    background: 'transparent',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '6px',
                    marginLeft: '4px',
                  }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.88rem' }}>
              <User size={15} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
