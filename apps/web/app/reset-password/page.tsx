'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

function ResetPasswordContent() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const deepLink = token ? `trackfunds://reset-password?token=${encodeURIComponent(token)}` : null

  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (deepLink) {
      window.location.href = deepLink
    }
  }, [deepLink])

  function copyToken() {
    if (!token) return
    void navigator.clipboard.writeText(token).then(() => {
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!token) {
    return (
      <div className="rp-card">
        <p className="eyebrow">TrackFunds</p>
        <h1 className="rp-title">Invalid link</h1>
        <p className="rp-body">This reset link is missing a token. Please request a new one from the app.</p>
      </div>
    )
  }

  return (
    <div className="rp-card">
      <p className="eyebrow">Password reset</p>
      <h1 className="rp-title">Opening TrackFunds…</h1>
      <p className="rp-body">
        The app should open automatically. If it doesn&apos;t, tap the button below or copy the token and paste it manually.
      </p>

      <a href={deepLink!} className="rp-btn">
        Open in TrackFunds app
      </a>

      <div className="rp-divider">
        <span>or paste the token manually</span>
      </div>

      <div className="rp-token-block">
        <code className="rp-token">{token}</code>
        <button className="rp-copy-btn" onClick={copyToken} type="button">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <p className="rp-hint">
        Open TrackFunds → Forgot password → Reset password → paste the token above.
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <style>{`
        .rp-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }
        .rp-card {
          width: min(480px, 100%);
          background: var(--surface-strong);
          border: 1px solid var(--line);
          border-radius: 1.75rem;
          padding: 2.5rem 2rem;
          box-shadow: var(--shadow);
          backdrop-filter: blur(18px);
        }
        .rp-title {
          margin: 0.25rem 0 0.75rem;
          font-family: var(--font-display), sans-serif;
          font-size: 2rem;
          letter-spacing: -0.04em;
          line-height: 1.1;
          color: var(--text);
        }
        .rp-body {
          margin: 0 0 1.75rem;
          color: var(--muted);
          font-size: 0.975rem;
          line-height: 1.65;
        }
        .rp-btn {
          display: block;
          width: 100%;
          padding: 0.85rem 1.5rem;
          background: var(--accent);
          color: #fff;
          font-size: 0.975rem;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          border-radius: 0.75rem;
          transition: background 0.15s;
        }
        .rp-btn:hover { background: var(--accent-strong); }
        .rp-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
          color: var(--muted);
          font-size: 0.8rem;
        }
        .rp-divider::before,
        .rp-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--line);
        }
        .rp-token-block {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg);
          border: 1px dashed var(--accent);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
        }
        .rp-token {
          flex: 1;
          font-size: 0.82rem;
          word-break: break-all;
          color: var(--text);
          font-family: monospace;
        }
        .rp-copy-btn {
          flex-shrink: 0;
          padding: 0.35rem 0.85rem;
          background: var(--accent);
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .rp-copy-btn:hover { background: var(--accent-strong); }
        .rp-hint {
          margin: 1.25rem 0 0;
          font-size: 0.8rem;
          color: var(--muted);
          line-height: 1.6;
        }
      `}</style>
      <div className="rp-shell">
        <Suspense>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </>
  )
}
