'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './Toast';
import { X, Lock, Mail, User, Phone, CheckCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, verifyOtp, setPassword } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Form states
  const [username, setUsername] = useState<string>('');
  const [password, setPasswordState] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter both username and password', 'error');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      showToast(`Welcome back, ${username}!`, 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      showToast('Username and Email are required', 'error');
      return;
    }
    setLoading(true);
    try {
      const { sessionId: sessId, debugOtp } = await register({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      });
      setSessionId(sessId);
      if (debugOtp) {
        setOtp(debugOtp);
        showToast(`Verification code: ${debugOtp} (Dev auto-filled)`, 'info');
      } else {
        showToast('Verification code generated and sent to email', 'success');
      }
      setRegStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      showToast('Please enter the OTP code', 'error');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(sessionId, otp.trim());
      setRegStep(3);
      showToast('OTP verified successfully! Now choose a password.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await setPassword(sessionId, newPassword);
      showToast('Account activated! Logging you in...', 'success');
      await login(username, newPassword);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {mode === 'login'
                ? 'Sign in to access your resumes and ATS scanner'
                : 'Join the next generation ATS optimization platform'}
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

        {/* Tab switch */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => { setMode('login'); setRegStep(1); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '7px',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: mode === 'login' ? 'var(--gradient-brand)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setRegStep(1); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '7px',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: mode === 'register' ? 'var(--gradient-brand)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex_developer"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPasswordState(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        )}

        {/* Register Flow */}
        {mode === 'register' && (
          <div>
            {/* Steps indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: regStep >= 1 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700
                }}>1</div>
                <span style={{ fontSize: '0.8rem', color: regStep === 1 ? '#fff' : 'var(--text-dim)' }}>Details</span>
              </div>
              <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: regStep >= 2 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700
                }}>2</div>
                <span style={{ fontSize: '0.8rem', color: regStep === 2 ? '#fff' : 'var(--text-dim)' }}>OTP</span>
              </div>
              <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: regStep >= 3 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700
                }}>3</div>
                <span style={{ fontSize: '0.8rem', color: regStep === 3 ? '#fff' : 'var(--text-dim)' }}>Password</span>
              </div>
            </div>

            {/* Step 1: Info */}
            {regStep === 1 && (
              <form onSubmit={handleRegisterStep1} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john_doe"
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 555-0199"
                    className="form-input"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px', marginTop: '6px' }}>
                  {loading ? 'Sending Code...' : 'Continue to OTP Verification'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Step 2: OTP */}
            {regStep === 2 && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <ShieldCheck size={44} color="#06b6d4" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '0.9rem' }}>
                    A 6-digit one-time passcode was generated for <strong style={{ color: '#fff' }}>{email}</strong>.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="form-input"
                    style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.25em', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px' }}>
                  {loading ? 'Verifying...' : 'Verify Passcode'}
                </button>
              </form>
            )}

            {/* Step 3: Password */}
            {regStep === 3 && (
              <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <KeyRound size={40} color="#10b981" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.9rem' }}>Set a secure password for your new account.</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Password (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="form-input"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-success" style={{ padding: '12px', marginTop: '6px', justifyContent: 'center' }}>
                  {loading ? 'Activating Account...' : 'Complete Registration & Sign In'}
                  <CheckCircle size={16} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
