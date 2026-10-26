'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { ResumeUploadModal } from '@/components/ResumeUploadModal';
import { NewScanModal } from '@/components/NewScanModal';
import { ScanResultModal } from '@/components/ScanResultModal';
import { ResumeViewerModal } from '@/components/ResumeViewerModal';
import { ScoreGauge } from '@/components/ScoreGauge';
import { Resume, ResumeScan, ResumeCreation } from '@/types';
import {
  Sparkles,
  FileText,
  ShieldCheck,
  Zap,
  UploadCloud,
  CheckCircle,
  Eye,
  ExternalLink,
  Bot,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Printer,
  Download,
  AlignLeft,
  Loader2,
} from 'lucide-react';
import {
  downloadAsMarkdown,
  downloadAsText,
  downloadAsWordDoc,
  printResume,
} from '@/lib/downloadResume';

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'resumes' | 'scans' | 'created'>('resumes');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [scanModalOpen, setScanModalOpen] = useState<boolean>(false);
  const [resultModalOpen, setResultModalOpen] = useState<boolean>(false);
  const [viewerModalOpen, setViewerModalOpen] = useState<boolean>(false);

  // Selected item states for modals
  const [selectedResumeSlug, setSelectedResumeSlug] = useState<string>('');
  const [selectedScan, setSelectedScan] = useState<ResumeScan | null>(null);
  const selectedScanRef = useRef<ResumeScan | null>(null);
  selectedScanRef.current = selectedScan;

  const [viewerConfig, setViewerConfig] = useState<{
    title: string;
    subtitle?: string;
    content: string | null;
    isAiGenerated?: boolean;
  }>({ title: '', content: null });

  // Data states
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [scans, setScans] = useState<ResumeScan[]>([]);
  const [createdResumes, setCreatedResumes] = useState<ResumeCreation[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Load data for authenticated users
  const loadAllData = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent) setLoadingData(true);
    try {
      const [resumesRes, createdRes] = await Promise.all([
        api.getResumes(1),
        api.getCreatedResumes(1),
      ]);
      setResumes(resumesRes.results || []);
      setCreatedResumes(createdRes.results || []);

      // Fetch scans across all user resumes
      if (resumesRes.results && resumesRes.results.length > 0) {
        try {
          const scanPromises = resumesRes.results.slice(0, 10).map((r) =>
            api.getScans(r.slug, 1).catch(() => ({ results: [] as ResumeScan[] }))
          );
          const scanResponses = await Promise.all(scanPromises);
          const allScans = scanResponses.flatMap((res) => res.results || []);
          // Sort scans by created_on descending
          allScans.sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime());
          setScans(allScans);

          if (selectedScanRef.current) {
            const updatedScan = allScans.find((s) => s.slug === selectedScanRef.current?.slug);
            if (updatedScan && updatedScan.ats_score !== selectedScanRef.current.ats_score) {
              setSelectedScan(updatedScan);
            }
          }
        } catch {
          setScans([]);
        }
      } else {
        setScans([]);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      if (!silent) setLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  // Check if any background tasks are still processing
  const hasProcessingResume = resumes.some((r) => !r.resumedata);
  const hasProcessingScan = scans.some((s) => s.ats_score === null);
  const hasProcessingCreation = createdResumes.some((c) => !c.generated_resume);
  const isAnyProcessing = hasProcessingResume || hasProcessingScan || hasProcessingCreation;

  // Auto-polling: poll every 3 seconds if anything is processing, or every 15 seconds as a heartbeat
  useEffect(() => {
    if (!isAuthenticated) return;

    const pollInterval = isAnyProcessing ? 3000 : 15000;
    const interval = setInterval(() => {
      loadAllData(true);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [isAuthenticated, isAnyProcessing, loadAllData]);

  const handleOpenScanForResume = (resumeSlug: string) => {
    setSelectedResumeSlug(resumeSlug);
    setScanModalOpen(true);
  };

  const handleOpenScanResult = (scan: ResumeScan, resSlug?: string) => {
    setSelectedScan(scan);
    setSelectedResumeSlug(resSlug || scan.resume?.slug || resumes[0]?.slug || '');
    setResultModalOpen(true);
  };

  const handleViewResumeText = (resume: Resume) => {
    setViewerConfig({
      title: `Resume Text: ${resume.slug}`,
      subtitle: `Uploaded on ${new Date(resume.created_on).toLocaleString()}`,
      content: resume.resumedata,
      isAiGenerated: false,
    });
    setViewerModalOpen(true);
  };

  const handleViewCreatedResume = (creation: ResumeCreation) => {
    setViewerConfig({
      title: `AI-Optimized ATS Resume (${creation.slug})`,
      subtitle: `Generated on ${new Date(creation.created_on).toLocaleString()}`,
      content: creation.generated_resume,
      isAiGenerated: true,
    });
    setViewerModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setUploadModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        {/* HERO SECTION */}
        <section style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '16px' }}>
          <div
            className="badge badge-indigo"
            style={{ marginBottom: '16px', padding: '6px 16px', fontSize: '0.85rem' }}
          >
            <Sparkles size={14} color="#818cf8" />
            <span>Next-Gen Gemini & Django AI Engine</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              lineHeight: 1.15,
              fontWeight: 800,
              maxWidth: '920px',
              margin: '0 auto 20px',
            }}
          >
            Beat the ATS Filter with{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Precision AI Resumes
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-muted)',
              maxWidth: '680px',
              margin: '0 auto 32px',
              lineHeight: 1.6,
            }}
          >
            Upload your PDF resume, scan against any target job description, pinpoint ATS keyword deficiencies,
            and generate a fully aligned, high-scoring ATS resume in seconds.
          </p>

          {!isAuthenticated && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn-primary"
                style={{ padding: '14px 28px', fontSize: '1rem' }}
              >
                <Zap size={18} />
                <span>Get Started Now — It&apos;s Free</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>

        {/* AUTHENTICATED DASHBOARD */}
        {isAuthenticated && (
          <div>
            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '18px',
                marginBottom: '36px',
              }}
            >
              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>Uploaded Resumes</span>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)' }}>
                    <FileText size={18} color="#818cf8" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>
                  {resumes.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Stored in PostgreSQL & SQLite
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>ATS Job Scans</span>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)' }}>
                    <ShieldCheck size={18} color="#38bdf8" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>
                  {scans.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Async Celery Calculations
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>AI-Engineered Resumes</span>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)' }}>
                    <Sparkles size={18} color="#34d399" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>
                  {createdResumes.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Guaranteed 80+ ATS compatibility
                </div>
              </div>
            </div>

            {/* TAB CONTENT: MY RESUMES */}
            {activeTab === 'resumes' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>My Uploaded Resumes</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      PDF documents processed with PyMuPDF text parsing
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => loadAllData()} className="btn-secondary" title="Refresh">
                      <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setUploadModalOpen(true)} className="btn-primary">
                      <UploadCloud size={16} />
                      <span>Upload New PDF</span>
                    </button>
                  </div>
                </div>

                {resumes.length === 0 ? (
                  <div
                    className="glass-panel"
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      border: '2px dashed var(--border-subtle)',
                    }}
                  >
                    <UploadCloud size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>No resumes uploaded yet</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px' }}>
                      Upload your standard PDF resume to extract its text and calculate your job compatibility score.
                    </p>
                    <button onClick={() => setUploadModalOpen(true)} className="btn-primary">
                      <Plus size={16} />
                      <span>Upload Your First Resume</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    {resumes.map((resume) => {
                      const isReady = !!resume.resumedata;
                      return (
                        <div key={resume.slug} className="glass-panel" style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <FileText size={20} color="#818cf8" />
                              </div>
                              <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Resume #{resume.id}</h3>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                                  {new Date(resume.created_on).toLocaleDateString()} • {resume.slug}
                                </div>
                              </div>
                            </div>

                            <span className={`badge ${isReady ? 'badge-emerald' : 'badge-amber'}`}>
                              {isReady ? (
                                <>
                                  <CheckCircle size={12} />
                                  <span>Text Extracted</span>
                                </>
                              ) : (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  <span>Processing PDF...</span>
                                </>
                              )}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px', minHeight: '36px' }}>
                            {resume.resumedata
                              ? `${resume.resumedata.substring(0, 110)}...`
                              : 'Background Celery worker is currently processing this PDF with PyMuPDF...'}
                          </p>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleViewResumeText(resume)}
                              disabled={!isReady}
                              className="btn-secondary"
                              style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                            >
                              <Eye size={14} />
                              <span>View Text</span>
                            </button>

                            <button
                              onClick={() => handleOpenScanForResume(resume.slug)}
                              disabled={!isReady}
                              className="btn-outline-cyan"
                              style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                            >
                              <ShieldCheck size={14} />
                              <span>Scan JD</span>
                            </button>

                            {resume.resumepdf && (
                              <a
                                href={resume.resumepdf.startsWith('http') ? resume.resumepdf : `http://127.0.0.1:8000${resume.resumepdf}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-secondary"
                                style={{ padding: '8px', borderRadius: '8px' }}
                                title="Open Original PDF"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ATS SCANS */}
            {activeTab === 'scans' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>ATS Compatibility Scans</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Score reports comparing your resume against company job descriptions
                    </p>
                  </div>
                  <button onClick={() => setScanModalOpen(true)} className="btn-primary">
                    <Plus size={16} />
                    <span>Run New Scan</span>
                  </button>
                </div>

                {scans.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <ShieldCheck size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>No scans performed yet</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px' }}>
                      Run your first scan against any target job description to compute your ATS compatibility score.
                    </p>
                    <button onClick={() => setScanModalOpen(true)} className="btn-primary">
                      <Zap size={16} />
                      <span>Start ATS Scan</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                    {scans.map((scan) => {
                      const isPending = scan.ats_score === null;
                      const isHighScore = scan.ats_score !== null && scan.ats_score >= 80;

                      return (
                        <div key={scan.slug} className="glass-panel" style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                {scan.slug}
                              </span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(scan.created_on).toLocaleString()}
                              </div>
                            </div>
                            <span className={`badge ${isPending ? 'badge-indigo' : isHighScore ? 'badge-emerald' : 'badge-rose'}`}>
                              {isPending ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  <span>Calculating Score...</span>
                                </>
                              ) : isHighScore ? (
                                <>
                                  <CheckCircle size={12} />
                                  <span>ATS Compatible</span>
                                </>
                              ) : (
                                <span>Score &lt; 80</span>
                              )}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <ScoreGauge score={scan.ats_score} size={88} showDetails={false} />
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                                Job Target
                              </h4>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxHeight: '42px', overflow: 'hidden' }}>
                                {scan.job_description}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenScanResult(scan)}
                              className="btn-secondary"
                              style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                            >
                              <Eye size={14} />
                              <span>View Analysis</span>
                            </button>

                            {!isPending && !isHighScore && (
                              <button
                                onClick={() => handleOpenScanResult(scan)}
                                className="btn-primary"
                                style={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  padding: '8px 14px',
                                  fontSize: '0.82rem',
                                }}
                              >
                                <Bot size={14} />
                                <span>Optimize (AI)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: AI OPTIMIZED RESUMES */}
            {activeTab === 'created' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>AI-Engineered ATS Resumes</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Reconstructed resumes with injected keywords and industry-standard ATS phrasing
                    </p>
                  </div>
                </div>

                {createdResumes.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <Bot size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                      No AI Resumes Generated Yet
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px' }}>
                      When a job scan receives an ATS score below 80, you can trigger our AI Optimizer to rewrite your resume.
                    </p>
                    <button onClick={() => setActiveTab('scans')} className="btn-primary">
                      <span>Go to ATS Scans</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                    {createdResumes.map((creation) => {
                      const isReady = !!creation.generated_resume;
                      return (
                        <div key={creation.slug} className="glass-panel" style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '10px',
                                  background: 'var(--gradient-brand)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Sparkles size={18} color="#fff" />
                              </div>
                              <div>
                                <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>ATS Resume #{creation.id}</h3>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                                  {new Date(creation.created_on).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <span className={`badge ${isReady ? 'badge-emerald' : 'badge-amber'}`}>
                              {isReady ? (
                                <>
                                  <CheckCircle size={12} />
                                  <span>ATS Optimized</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={12} className="animate-spin" />
                                  <span>AI Generating...</span>
                                </>
                              )}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px', minHeight: '44px' }}>
                            {creation.generated_resume
                              ? `${creation.generated_resume.substring(0, 120)}...`
                              : 'AI Celery worker is currently writing and formatting your optimized resume...'}
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                              onClick={() => handleViewCreatedResume(creation)}
                              disabled={!isReady}
                              className="btn-primary"
                              style={{ width: '100%', padding: '8px 14px', fontSize: '0.82rem' }}
                            >
                              <Eye size={14} />
                              <span>{isReady ? 'Preview & Format' : 'AI Processing...'}</span>
                            </button>

                          {creation.generated_resume && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                              <button
                                onClick={() => {
                                  printResume(creation.generated_resume!, `Resume_${creation.slug}`);
                                  showToast('Opening print dialog. Select "Save as PDF" to download.', 'info');
                                }}
                                className="btn-secondary"
                                style={{ padding: '6px 8px', fontSize: '0.75rem', justifyContent: 'center' }}
                                title="Print / Save as PDF"
                              >
                                <Printer size={13} color="#38bdf8" />
                                <span>PDF</span>
                              </button>

                              <button
                                onClick={() => {
                                  downloadAsWordDoc(creation.generated_resume!, `Resume_${creation.slug}`);
                                  showToast('Downloaded Word document (.doc)', 'success');
                                }}
                                className="btn-secondary"
                                style={{ padding: '6px 8px', fontSize: '0.75rem', justifyContent: 'center' }}
                                title="Download as Word .doc"
                              >
                                <FileText size={13} color="#60a5fa" />
                                <span>Word</span>
                              </button>

                              <button
                                onClick={() => {
                                  downloadAsMarkdown(creation.generated_resume!, `Resume_${creation.slug}`);
                                  showToast('Downloaded Markdown (.md)', 'success');
                                }}
                                className="btn-secondary"
                                style={{ padding: '6px 8px', fontSize: '0.75rem', justifyContent: 'center' }}
                                title="Download as Markdown"
                              >
                                <Download size={13} />
                                <span>MD</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* UNAUTHENTICATED LANDING PREVIEW */}
        {!isAuthenticated && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginTop: '40px',
            }}
          >
            <div className="glass-panel" style={{ padding: '32px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                }}
              >
                <FileText size={24} color="#818cf8" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>1. PDF Text Parser</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Upload any PDF resume. Our backend extracts text asynchronously via PyMuPDF and queues it in Redis.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                }}
              >
                <ShieldCheck size={24} color="#38bdf8" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>2. ATS Score Analyzer</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                AI compares your skills and project achievements against target Job Descriptions to calculate your true match score.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                }}
              >
                <Bot size={24} color="#34d399" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>3. 1-Click AI Rewriter</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                If your score is under 80%, Google Gemini synthesizes an ATS-proof resume packed with required keywords and metrics.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.85rem',
          background: 'rgba(10, 14, 23, 0.95)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span>© 2026 Skribbl Resume AI. Built with Next.js, TypeScript, Django & Celery.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Neon DB PostgreSQL</span>
            <span>•</span>
            <span>Upstash Redis</span>
            <span>•</span>
            <span>Google Gemini</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ResumeUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => {
          loadAllData();
          setActiveTab('resumes');
        }}
      />
      <NewScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        resumes={resumes}
        selectedResumeSlug={selectedResumeSlug}
        onScanCreated={() => {
          loadAllData();
          setActiveTab('scans');
        }}
      />
      <ScanResultModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        scan={selectedScan}
        resumeSlug={selectedResumeSlug}
        onOptimizationStarted={() => {
          loadAllData();
          setActiveTab('created');
        }}
      />
      <ResumeViewerModal
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
        title={viewerConfig.title}
        subtitle={viewerConfig.subtitle}
        content={viewerConfig.content}
        isAiGenerated={viewerConfig.isAiGenerated}
      />
    </div>
  );
}
