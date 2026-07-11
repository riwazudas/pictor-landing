/* ==========================================================================
   PICTOR SERVICES LATEX PDF GENERATOR & COMPILER HELPER
   ========================================================================== */

const LOGO_BASE64 = "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......"

// Escape special LaTeX characters
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
  /* LaTeX Progress Modal */
  .latex-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(26, 21, 32, 0.7);
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
    background: #faf8fd;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 20px 50px rgba(26, 21, 32, 0.15);
    width: 90%;
    max-width: 480px;
    padding: 36px;
    text-align: center;
    position: relative;
    transform: translateY(30px);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .latex-modal-overlay.active .latex-modal-card {
    transform: translateY(0);
  }
  .latex-spinner {
    width: 56px;
    height: 56px;
    border: 4px solid rgba(58, 28, 98, 0.1);
    border-left-color: #3a1c62;
    border-radius: 50%;
    animation: latex-spin 1s linear infinite;
    margin: 0 auto 24px;
  }
  @keyframes latex-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .latex-modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1520;
    margin-bottom: 12px;
    letter-spacing: -0.01em;
  }
  .latex-modal-desc {
    font-size: 0.9rem;
    color: #58505e;
    margin-bottom: 28px;
    line-height: 1.5;
  }
  .latex-btn-group {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .latex-modal-btn {
    padding: 10px 20px;
    border-radius: 50px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .latex-modal-btn-primary {
    background: #3a1c62;
    color: #faf8fd;
    box-shadow: 0 4px 10px rgba(58, 28, 98, 0.2);
  }
  .latex-modal-btn-primary:hover {
    background: #4c2472;
    transform: translateY(-1px);
  }
  .latex-modal-btn-secondary {
    background: transparent;
    color: #251e2b;
    border-color: rgba(37, 30, 43, 0.15);
  }
  .latex-modal-btn-secondary:hover {
    background: rgba(37, 30, 43, 0.04);
    border-color: #251e2b;
  }
`;
document.head.appendChild(styleElement);

// Create modal dynamically and return controller
function createProgressModal(latexCode, documentTitle) {
  // Check if modal already exists
  let modalOverlay = document.getElementById('latex-progress-modal');
  if (modalOverlay) {
    modalOverlay.remove();
  }

  modalOverlay = document.createElement('div');
  modalOverlay.id = 'latex-progress-modal';
  modalOverlay.className = 'latex-modal-overlay';

  modalOverlay.innerHTML = `
    <div class="latex-modal-card">
      <div class="latex-spinner" id="latex-modal-spinner"></div>
      <div class="latex-modal-title" id="latex-modal-title">Generating PDF Report</div>
      <div class="latex-modal-desc" id="latex-modal-desc">
        Your document is being compiled using a secure, free online LaTeX compiler. 
        It will open in a new tab shortly as a premium PDF.
      </div>
      <div class="latex-btn-group">
        <button type="button" class="latex-modal-btn latex-modal-btn-secondary" id="latex-btn-copy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px;">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy LaTeX Code
        </button>
        <button type="button" class="latex-modal-btn latex-modal-btn-secondary" id="latex-btn-download">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download .tex
        </button>
        <button type="button" class="latex-modal-btn latex-modal-btn-primary" id="latex-btn-close" style="display: none;">
          Done
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Bind Buttons
  const copyBtn = modalOverlay.querySelector('#latex-btn-copy');
  const downloadBtn = modalOverlay.querySelector('#latex-btn-download');
  const closeBtn = modalOverlay.querySelector('#latex-btn-close');

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(latexCode).then(() => {
      const origText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        copyBtn.innerHTML = origText;
      }, 2000);
    });
  });

  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([latexCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_report.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  closeBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
  });

  // Show
  setTimeout(() => {
    modalOverlay.classList.add('active');
  }, 10);

  return {
    showFinished: (pdfUrl) => {
      document.getElementById('latex-modal-spinner').style.display = 'none';
      document.getElementById('latex-modal-title').textContent = 'PDF Generated Successfully';
      document.getElementById('latex-modal-desc').innerHTML = `
        The PDF report has been generated and downloaded successfully. If the download did not start automatically, please click the button below to download it:
        <br/><br/>
        <div style="margin: 15px 0;">
          <a href="${pdfUrl}" download="${documentTitle || 'document'}.pdf" class="latex-modal-btn latex-modal-btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; min-width: 160px; padding: 12px 24px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; margin-right: 8px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download PDF Report
          </a>
        </div>
      `;
      closeBtn.style.display = 'inline-flex';
    },
    showError: (errText) => {
      document.getElementById('latex-modal-spinner').style.display = 'none';
      document.getElementById('latex-modal-title').textContent = 'Compilation Error';
      
      const esc = (txt) => {
        if (!txt) return '';
        return String(txt)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      document.getElementById('latex-modal-desc').innerHTML = `
        The compiler service returned an error. Below are the details/logs:
        <pre style="text-align: left; background: #1a1520; color: #f7a3a3; padding: 12px; border-radius: 8px; max-height: 180px; overflow-y: auto; font-size: 0.8rem; font-family: monospace; margin: 12px 0; border: 1px solid #ff000033;">${esc(errText)}</pre>
        <em>You can also download the formatted LaTeX source code or copy it below to compile in any local editor or online compiler (e.g. Overleaf).</em>
      `;
      closeBtn.style.display = 'inline-flex';
    },
    close: () => {
      modalOverlay.classList.remove('active');
    }
  };
}

// Compile LaTeX via POST to local backend proxy which compiles via latexonline.cc
export function compileLaTeX(latexCode, documentTitle) {
  const modal = createProgressModal(latexCode, documentTitle);

  fetch('/api/compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      latex: latexCode,
      documentTitle: documentTitle
    })
  })
  .then(async (response) => {
    if (response.ok) {
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      
      // Trigger immediate download in-place without opening a new tab
      const a = document.createElement('a');
      a.href = url;
      a.download = (documentTitle || 'document') + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Update modal with download link
      modal.showFinished(url);
    } else {
      const errText = await response.text();
      console.error('LaTeX compilation proxy returned error:', errText);
      modal.showError(errText);
    }
  })
  .catch((error) => {
    console.error('LaTeX compilation request failed:', error);
    modal.showError(error.message || String(error));
  });
}

// Expose on window for direct HTML/script integration
window.LatexPDFHelper = {
  escapeLaTeX,
  compileLaTeX
};
