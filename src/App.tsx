import React, { useState, useEffect, useRef } from 'react';

const COOLDOWN_MS = 2 * 60 * 1000;
const COOLDOWN_KEY = 'am_last_send';

const COOLDOWN_VERIF_MS = 2 * 60 * 1000;
const COOLDOWN_VERIF_KEY = 'am_last_verif';

export default function App() {
  // Modal state
  const [showWelcome, setShowWelcome] = useState(false);
  const [noShowAgain, setNoShowAgain] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [verifyLink, setVerifyLink] = useState('');

  // Step visibility & progress states
  const [card2Visible, setCard2Visible] = useState(false);
  const [card3Visible, setCard3Visible] = useState(false);
  const [progress1State, setProgress1State] = useState<'active' | 'done'>('active');
  const [progress2State, setProgress2State] = useState<'' | 'active' | 'done'>('');
  const [progress3State, setProgress3State] = useState<'' | 'active done'>('');
  const [line1Active, setLine1Active] = useState(false);
  const [line2Active, setLine2Active] = useState(false);

  // Send button & status
  const [isSending, setIsSending] = useState(false);
  const [sendCooldownSec, setSendCooldownSec] = useState(0);
  const [sendBtnGreen, setSendBtnGreen] = useState(false);
  const [sendBtnLabel, setSendBtnLabel] = useState<React.ReactNode>('KIRIM LINK VERIF');
  const [showSendStatus, setShowSendStatus] = useState(false);
  const [sendStatusSuccess, setSendStatusSuccess] = useState(true);
  const [sendStatusTitle, setSendStatusTitle] = useState('LINK VERIFIKASI SIAP');
  const [sendStatusMsg, setSendStatusMsg] = useState('Silakan lanjut ke langkah 2.');

  // Verify button & status
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifCooldownSec, setVerifCooldownSec] = useState(0);
  const [verifyBtnClass, setVerifyBtnClass] = useState('green');
  const [verifyBtnLabel, setVerifyBtnLabel] = useState<React.ReactNode>('✓ VERIFIKASI EMAIL');
  const [verifyStatusIcon, setVerifyStatusIcon] = useState<React.ReactNode>('!');
  const [verifyStatusTitle, setVerifyStatusTitle] = useState('MENUNGGU LINK VERIFIKASI');
  const [verifyStatusMsg, setVerifyStatusMsg] = useState('Masukkan link sebelum melanjutkan.');
  const [verifyStatusSuccess, setVerifyStatusSuccess] = useState(false);

  // Element refs for DOM focus / scrolling
  const emailInputRef = useRef<HTMLInputElement>(null);
  const verifyLinkRef = useRef<HTMLInputElement>(null);
  const card2Ref = useRef<HTMLElement>(null);
  const card3Ref = useRef<HTMLElement>(null);

  // Helper for cooldown remaining
  const getSendCooldownRemaining = () => {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    const sisa = COOLDOWN_MS - (Date.now() - last);
    return sisa > 0 ? sisa : 0;
  };

  const getVerifCooldownRemaining = () => {
    const last = Number(localStorage.getItem(COOLDOWN_VERIF_KEY) || 0);
    const sisa = COOLDOWN_VERIF_MS - (Date.now() - last);
    return sisa > 0 ? sisa : 0;
  };

  // Welcome popup timer on mount
  useEffect(() => {
    const hidePopup = localStorage.getItem('mitzy_popup_hidden');
    if (hidePopup !== '1') {
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Cooldown timers
  useEffect(() => {
    const updateTimers = () => {
      const sendRem = getSendCooldownRemaining();
      setSendCooldownSec(Math.ceil(sendRem / 1000));

      const verifRem = getVerifCooldownRemaining();
      setVerifCooldownSec(Math.ceil(verifRem / 1000));

      if (sendRem <= 0 && !isSending && !sendBtnGreen) {
        setSendBtnLabel('KIRIM LINK VERIF');
      } else if (sendRem > 0 && !isSending && !sendBtnGreen) {
        const totalSec = Math.ceil(sendRem / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        setSendBtnLabel(
          <>
            <i className="fa-solid fa-hourglass-half" style={{ marginRight: '8px' }}></i> TUNGGU {m}:
            {String(s).padStart(2, '0')}
          </>
        );
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [isSending, sendBtnGreen]);

  // Escape key handler for popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showWelcome) {
        setShowWelcome(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showWelcome]);

  const closeWelcomePopup = () => {
    setShowWelcome(false);
  };

  const toggleNoShow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setNoShowAgain(checked);
    if (checked) {
      localStorage.setItem('mitzy_popup_hidden', '1');
    } else {
      localStorage.removeItem('mitzy_popup_hidden');
    }
  };

  const validEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validVerificationLink = (value: string) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        (url.hostname === 'alight-creative.firebaseapp.com' ||
          url.hostname === 'alightcreative.com' ||
          url.hostname.endsWith('.firebaseapp.com') ||
          url.hostname.includes('mitzy') ||
          url.hostname === 'localhost')
      );
    } catch {
      return false;
    }
  };

  // Step 1: Send button click handler
  const handleSend = async () => {
    if (getSendCooldownRemaining() > 0) return;

    const trimmedEmail = email.trim();
    if (!validEmail(trimmedEmail)) {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
        emailInputRef.current.style.background = '#fff0f0';
        setTimeout(() => {
          if (emailInputRef.current) emailInputRef.current.style.background = 'transparent';
        }, 700);
      }
      return;
    }

    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    setIsSending(true);
    setSendBtnLabel(
      <>
        <i className="fa-solid fa-hourglass-half fa-spin" style={{ marginRight: '8px' }}></i> MENGIRIM...
      </>
    );

    try {
      const response = await fetch(`/api/send?email=${encodeURIComponent(trimmedEmail)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Server error: ' + response.status);
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error('Response server tidak valid.');
      }

      if (!data.success) {
        throw new Error(data.message || 'Gagal mengirim permintaan.');
      }

      setSendBtnLabel('✓ LINK VERIF TERKIRIM');
      setSendBtnGreen(true);
      setShowSendStatus(true);
      setSendStatusSuccess(true);
      setSendStatusTitle('LINK VERIFIKASI SIAP');
      setSendStatusMsg(data.message || 'Silakan lanjut ke langkah 2.');

      setCard2Visible(true);
      setProgress1State('done');
      setProgress2State('active');
      setLine1Active(true);

      setTimeout(() => {
        card2Ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 150);
    } catch (error: any) {
      localStorage.removeItem(COOLDOWN_KEY);
      setSendBtnGreen(false);
      setSendBtnLabel('↻ COBA LAGI');
      setShowSendStatus(true);
      setSendStatusSuccess(false);
      setSendStatusTitle('GAGAL MENGIRIM');
      setSendStatusMsg(error.message || 'Terjadi kesalahan server.');
    } finally {
      setIsSending(false);
    }
  };

  // Step 2: Verify button click handler
  const handleVerify = async () => {
    if (getVerifCooldownRemaining() > 0) return;

    const trimmedEmail = email.trim();
    const trimmedLink = verifyLink.trim();

    if (!validEmail(trimmedEmail)) {
      setVerifyStatusIcon('!');
      setVerifyStatusTitle('EMAIL TIDAK VALID');
      setVerifyStatusMsg('Email tidak valid. Ulangi step 1.');
      setVerifyStatusSuccess(false);
      return;
    }

    if (!validVerificationLink(trimmedLink)) {
      if (verifyLinkRef.current) {
        verifyLinkRef.current.focus();
        verifyLinkRef.current.style.background = '#fff0f0';
        setTimeout(() => {
          if (verifyLinkRef.current) verifyLinkRef.current.style.background = 'transparent';
        }, 700);
      }
      setVerifyStatusIcon('!');
      setVerifyStatusTitle('LINK TIDAK VALID');
      setVerifyStatusMsg('Masukkan link verifikasi Alight Motion yang benar.');
      setVerifyStatusSuccess(false);
      return;
    }

    localStorage.setItem(COOLDOWN_VERIF_KEY, String(Date.now()));
    setIsVerifying(true);
    setVerifyBtnLabel('MEMPROSES...');
    setVerifyStatusIcon(
      <i className="fa-solid fa-hourglass-half fa-spin" style={{ fontSize: '20px', color: '#fff' }}></i>
    );
    setVerifyStatusTitle('MEMPROSES VERIFIKASI');
    setVerifyStatusMsg('Mengirim data ke server.');
    setVerifyStatusSuccess(false);

    try {
      const response = await fetch(
        `/api/verif?email=${encodeURIComponent(trimmedEmail)}&link=${encodeURIComponent(trimmedLink)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Server error: ' + response.status);
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error('Response server tidak valid.');
      }

      if (!data.success) {
        throw new Error(data.message || 'API gagal memproses verifikasi.');
      }

      setVerifyStatusIcon(
        <i className="fa-solid fa-check" style={{ fontSize: '22px', color: '#fff' }}></i>
      );
      setVerifyStatusTitle('VERIFIKASI BERHASIL');
      setVerifyStatusMsg(data.message || 'Akun berhasil diproses.');
      setVerifyStatusSuccess(true);

      setVerifyBtnLabel('✓ BERHASIL');
      setVerifyBtnClass('yellow');

      setProgress2State('done');
      setProgress3State('active done');
      setLine2Active(true);
      setCard3Visible(true);

      setTimeout(() => {
        card3Ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 250);
    } catch (error: any) {
      setVerifyStatusIcon(
        <i className="fa-solid fa-xmark" style={{ fontSize: '22px', color: '#fff' }}></i>
      );
      setVerifyStatusTitle('VERIFIKASI GAGAL');
      setVerifyStatusMsg(error.message || 'Terjadi kesalahan saat menghubungi server.');
      setVerifyStatusSuccess(false);

      localStorage.removeItem(COOLDOWN_VERIF_KEY);
      setVerifyBtnLabel('↻ COBA LAGI');
    } finally {
      setIsVerifying(false);
    }
  };

  const isSendDisabled = isSending || sendCooldownSec > 0 || sendBtnGreen;
  const isVerifyDisabled = isVerifying || verifCooldownSec > 0 || verifyBtnClass === 'yellow';

  return (
    <main className="wrap">
      {/* Welcome Popup Modal */}
      <div
        id="welcome-popup"
        className={`modal-overlay ${showWelcome ? 'show' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeWelcomePopup();
        }}
      >
        <div className="modal-box">
          <button className="modal-close-btn" type="button" onClick={closeWelcomePopup}>
            <i className="fa-solid fa-xmark"></i>
          </button>
          <div className="modal-badge">INFO PENTING</div>
          <h2 className="modal-title">INFORMATION ALERT</h2>
          <p className="modal-desc">
            Join channel official &amp; support kami biar lu gak ketinggalan update dan informasi terbaru!
          </p>
          <div className="popup-btn-group">
            <a
              href="https://whatsapp.com/channel/0029Vb8wkiw89inmMKmI9a0X"
              target="_blank"
              rel="noopener noreferrer"
              className="mc-btn btn-wa"
            >
              <i className="fa-brands fa-whatsapp"></i>
              <span>Join WhatsApp</span>
            </a>
            <a
              href="https://sociabuzz.com/mitzy_/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="mc-btn btn-donate"
            >
              <i className="fa-solid fa-heart"></i>
              <span>Donate</span>
            </a>
            <a
              href="https://youtu.be/ESTLie6gelI?si=opacQYYqBzEiqvJo"
              target="_blank"
              rel="noopener noreferrer"
              className="mc-btn btn-premium"
            >
              <i className="fa-solid fa-crown"></i>
              <span>Tutorial Premium</span>
            </a>
          </div>
          <button className="mc-btn btn-close" type="button" onClick={closeWelcomePopup}>
            <i className="fa-solid fa-check"></i>
            <span>Sudah Join / Tutup</span>
          </button>
          <label className="checkbox-container">
            <input
              type="checkbox"
              id="no-show-again"
              checked={noShowAgain}
              onChange={toggleNoShow}
            />
            <span>Jangan tampilkan lagi</span>
          </label>
        </div>
      </div>

      {/* Topbar */}
      <div className="topbar">
        <div className="brand-mini">AM PREMIUM</div>
        <div className="online">
          <span className="dot"></span> STATUS SERVER ONLINE
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">FREE VERIFICATION SERVICE</div>
        <h1>VERIFIKASI REAL TIME UNTUK ALIGHT MOTION</h1>
        <p>Proses Cepat, Aman, Premium Dalam Beberapa Detik</p>
      </section>

      {/* Steps Progress Indicator */}
      <div className="steps" aria-label="Progress">
        <div className={`step ${progress1State}`} id="progress1">
          1
        </div>
        <div
          className="line"
          id="line1"
          style={{ background: line1Active ? 'var(--primary)' : 'var(--ink)' }}
        ></div>
        <div className={`step ${progress2State}`} id="progress2">
          2
        </div>
        <div
          className="line"
          id="line2"
          style={{ background: line2Active ? 'var(--primary)' : 'var(--ink)' }}
        ></div>
        <div className={`step ${progress3State}`} id="progress3">
          3
        </div>
      </div>

      {/* Step 1 Card: Input Email */}
      <section className="card" id="card1">
        <div className="step-head">
          <div className="step-number">1</div>
          <div>
            <h2 className="step-title">Input Email</h2>
            <p className="step-desc">Masukkan email yang akan digunakan untuk proses verifikasi.</p>
          </div>
        </div>
        <label htmlFor="email">Email Alight Motion</label>
        <div className="input-wrap">
          <span className="input-icon">
            <i className="fa-regular fa-envelope" style={{ color: '#000', fontSize: '18px' }}></i>
          </span>
          <input
            ref={emailInputRef}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Masukkan email Anda..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
        </div>
        <button
          className={`btn ${sendBtnGreen ? 'green' : ''}`}
          id="sendBtn"
          type="button"
          disabled={isSendDisabled}
          onClick={handleSend}
        >
          {sendBtnLabel}
        </button>
        <div className={`status-box ${showSendStatus ? 'show' : ''}`} id="sendStatus">
          <div className="status-row">
            <div
              className="status-icon"
              style={{ background: sendStatusSuccess ? 'var(--green)' : 'var(--red)' }}
            >
              {sendStatusSuccess ? '✓' : '✗'}
            </div>
            <div className="status-text">
              <strong>{sendStatusTitle}</strong>
              <span>{sendStatusMsg}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2 Card: Verifikasi Premium */}
      <section
        ref={card2Ref}
        className={`card ${card2Visible ? '' : 'hidden'}`}
        id="card2"
      >
        <div className="step-head">
          <div className="step-number">2</div>
          <div>
            <h2 className="step-title">Verifikasi Premium</h2>
            <p className="step-desc">Masukkan link verifikasi email Alight Motion yang Anda terima.</p>
          </div>
        </div>
        <label htmlFor="verifyLink">Link Verifikasi Email</label>
        <div className="input-wrap">
          <span className="input-icon">
            <i className="fa-solid fa-link" style={{ color: '#000', fontSize: '18px' }}></i>
          </span>
          <input
            ref={verifyLinkRef}
            id="verifyLink"
            type="url"
            autoComplete="off"
            placeholder="https://alight-creative.firebaseapp.com/..."
            value={verifyLink}
            onChange={(e) => setVerifyLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVerify();
            }}
          />
        </div>
        <div className="status-box show" id="verifyStatus">
          <div className="status-row">
            <div
              className="status-icon"
              style={{ background: verifyStatusSuccess ? 'var(--green)' : 'var(--primary)' }}
            >
              {verifyStatusIcon}
            </div>
            <div className="status-text">
              <strong>{verifyStatusTitle}</strong>
              <span>{verifyStatusMsg}</span>
            </div>
          </div>
        </div>
        <button
          className={`btn ${verifyBtnClass}`}
          id="verifyBtn"
          type="button"
          disabled={isVerifyDisabled}
          onClick={handleVerify}
        >
          {verifyBtnLabel}
        </button>
      </section>

      {/* Step 3 Card: Status Akun */}
      <section
        ref={card3Ref}
        className={`card ${card3Visible ? '' : 'hidden'}`}
        id="card3"
      >
        <div className="step-head">
          <div className="step-number">3</div>
          <div>
            <h2 className="step-title">Status Akun</h2>
            <p className="step-desc">Status proses verifikasi akun Anda.</p>
          </div>
        </div>
        <div className="success-card show">
          <div className="success-title">
            <div className="success-check">✓</div>
            <h3>Verifikasi Berhasil</h3>
          </div>
          <p>
            SELAMAT! AKUN ANDA TELAH BERHASIL DI-VERIFIKASI PREMIUM!
            Silakan login ke aplikasi Alight Motion menggunakan email yang sudah diverifikasi.
            Nikmati semua fitur premium tanpa batasan.
          </p>
          <div className="account-status">PREMIUM AKTIF ✓</div>
        </div>
      </section>

      {/* Footer */}
      <div className="footer">
        <div>© POWERED BY MITZY</div>
        <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 700, color: '#707782', letterSpacing: '0.5px' }}>
          Scrape by Andri Not Dev
        </div>
      </div>
    </main>
  );
}
