/* ==========================================================================
   PICTOR SERVICES STATIC REPORT & PDF GENERATOR HELPER (100% Client-Side)
   ========================================================================== */

// Escape special LaTeX characters for report templating
export function escapeLaTeX(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// Inject Modal Styles Dynamically
const styleElement = document.createElement('style');
styleElement.textContent = `
  .latex-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(26, 21, 32, 0.75);
    backdrop-filter: blur(8px);
    z-index: 99999;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Inter', -apple-system, sans-serif;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .latex-modal-overlay.active {
    opacity: 1;
    pointer-events: auto;
  }
  .latex-modal-card {
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid rgba(81, 44, 130, 0.15);
    box-shadow: 0 25px 50px -12px rgba(26, 21, 32, 0.25);
    width: 92%;
    max-width: 540px;
    padding: 32px;
    text-align: center;
    position: relative;
    transform: translateY(20px);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .latex-modal-overlay.active .latex-modal-card {
    transform: translateY(0);
  }
  .latex-modal-close {
    position: absolute;
    top: 18px;
    right: 18px;
    background: #f4f0fa;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #512c82;
    transition: background 0.2s, transform 0.2s;
  }
  .latex-modal-close:hover {
    background: #e9e1f5;
    transform: scale(1.05);
  }
  .latex-modal-header-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(81, 44, 130, 0.1) 0%, rgba(184, 138, 47, 0.15) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #512c82;
  }
  .latex-modal-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1.45rem;
    font-weight: 700;
    color: #1a1520;
    margin: 0 0 8px 0;
  }
  .latex-modal-desc {
    font-size: 0.92rem;
    color: #635b6c;
    line-height: 1.55;
    margin: 0 0 24px 0;
  }
  .latex-modal-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }
  .latex-modal-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 20px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    text-decoration: none;
  }
  .latex-modal-btn-primary {
    background: linear-gradient(135deg, #512c82 0%, #3a1d63 100%);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(81, 44, 130, 0.3);
  }
  .latex-modal-btn-primary:hover {
    box-shadow: 0 6px 20px rgba(81, 44, 130, 0.4);
    transform: translateY(-1px);
  }
  .latex-modal-btn-secondary {
    background: #f8f6fc;
    color: #512c82;
    border: 1px solid rgba(81, 44, 130, 0.2);
  }
  .latex-modal-btn-secondary:hover {
    background: #eee8f8;
  }
  .latex-code-box {
    text-align: left;
    background: #1a1520;
    color: #e5def0;
    border-radius: 10px;
    padding: 12px 16px;
    font-family: monospace;
    font-size: 0.78rem;
    max-height: 140px;
    overflow-y: auto;
    border: 1px solid rgba(81, 44, 130, 0.3);
  }
`;
document.head.appendChild(styleElement);

// Client-side report dialog
export function compileLaTeX(latexCode, documentTitle) {
  const title = documentTitle || 'Migration_Assessment_Report';
  const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');

  let modalOverlay = document.getElementById('static-report-modal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'static-report-modal';
    modalOverlay.className = 'latex-modal-overlay';
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div class="latex-modal-card">
      <button class="latex-modal-close" id="btn-close-report-modal" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 18px; height: 18px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div class="latex-modal-header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 28px; height: 28px;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      </div>

      <h3 class="latex-modal-title">Assessment Report Ready</h3>
      <p class="latex-modal-desc">
        Your tailored Australian migration and points assessment summary has been generated. You can print or save it as a PDF directly in your browser or download the full document.
      </p>

      <div class="latex-modal-actions">
        <button class="latex-modal-btn latex-modal-btn-primary" id="btn-print-report-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print / Save as PDF
        </button>

        <button class="latex-modal-btn latex-modal-btn-secondary" id="btn-download-tex-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download Document Source (.tex)
        </button>

        <button class="latex-modal-btn latex-modal-btn-secondary" id="btn-copy-code-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span id="copy-btn-text">Copy Source Code</span>
        </button>
      </div>

      <div class="latex-code-box" title="LaTeX Source Preview">
        <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">${escapeHtml(latexCode.substring(0, 350))}...</pre>
      </div>
    </div>
  `;

  // Helper escape
  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Bind close
  const closeBtn = document.getElementById('btn-close-report-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
  });

  // Print button
  const printBtn = document.getElementById('btn-print-report-action');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
      setTimeout(() => {
        window.print();
      }, 200);
    });
  }

  // Download .tex
  const downloadBtn = document.getElementById('btn-download-tex-action');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([latexCode], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle}.tex`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Copy code
  const copyBtn = document.getElementById('btn-copy-code-action');
  const copyText = document.getElementById('copy-btn-text');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(latexCode).then(() => {
        if (copyText) copyText.textContent = 'Copied to Clipboard!';
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Copy Source Code';
        }, 2000);
      });
    });
  }

  // Trigger modal display
  setTimeout(() => {
    modalOverlay.classList.add('active');
  }, 10);
}

// Expose on window for direct HTML/script integration
window.LatexPDFHelper = {
  escapeLaTeX,
  compileLaTeX
};
