// Coe.UI helpers (assumes bootstrap.bundle.js is already loaded in the app)
(function (w) {
    function ensureBootstrap() {
        if (typeof bootstrap === 'undefined') {
            console.warn('[Coe.UI] Bootstrap is not available. Include bootstrap.bundle.min.js before coe.ui.js');
            return false;
        }
        return true;
    }

    // --- Toasts ---
    function showToast({ title = "", body = "", variant = "primary", autohide = true, delay = 3000 } = {}) {
        if (!ensureBootstrap()) return;
        const host = document.getElementById('coe-toast-host');
        if (!host) return;

        const wrap = document.createElement('div');
        wrap.innerHTML = `
      <div class="toast align-items-center text-bg-${variant}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            ${title ? `<div class="fw-semibold mb-1">${title}</div>` : ""}
            ${body}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>`;
        const toastEl = wrap.firstElementChild;
        host.appendChild(toastEl);

        const toast = new bootstrap.Toast(toastEl, { autohide, delay });
        toast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove(), { once: true });
    }

    // --- Confirm modal (Promise<boolean>) ---
    function confirmModal({ title = "Confirm", body = "Are you sure?", confirmText = "Confirm", confirmClass = "btn-danger", cancelText = "Cancel" } = {}) {
        if (!ensureBootstrap()) return Promise.resolve(false);
        /** @type {HTMLTemplateElement|null} */
        const tpl = (document.getElementById('coe-confirm-template'));
        if (!tpl) {
            console.warn('[Coe.UI] Confirm template not found (coe-confirm-template). Did you render the ConfirmModal view component in your layout?');
            return Promise.resolve(false);
        }
        const node = tpl.content.firstElementChild.cloneNode(true);
        document.body.appendChild(node);

        // hydrate content
        node.querySelector('.modal-title').textContent = title;
        const bodyEl = node.querySelector('.modal-body');
        if (typeof body === 'string') bodyEl.innerHTML = `<p>${body}</p>`;
        const confirmBtn = node.querySelector('[data-role="confirm"]');
        confirmBtn.textContent = confirmText;
        confirmBtn.className = `btn ${confirmClass}`;
        const cancelBtn = node.querySelector('[data-bs-dismiss="modal"]');
        if (cancelBtn) cancelBtn.textContent = cancelText;

        const modal = new bootstrap.Modal(node, { backdrop: 'static', keyboard: false });

        return new Promise(resolve => {
            const cleanup = () => { modal.hide(); node.remove(); };
            confirmBtn.addEventListener('click', () => { resolve(true); cleanup(); }, { once: true });
            node.addEventListener('hidden.bs.modal', () => { resolve(false); node.remove(); }, { once: true });
            modal.show();
        });
    }

    // Expose helpers
    w.CoeUI = { showToast, confirmModal };
    w.showToast = showToast;
    w.confirmModal = confirmModal;
})(window);

// --- Existing data-coe-post handler (kept; just TS fix on error path)
document.addEventListener('click', async function (e) {
    const target = /** @type {HTMLElement} */ (e.target);
    const btn = target && target.closest ? target.closest('button[data-coe-post]') : null;
    if (!btn) return;

    const form = btn.closest('form');
    if (!form) return;

    const title = btn.getAttribute('data-coe-confirm-title');
    const body = btn.getAttribute('data-coe-confirm-body');
    const ccls = btn.getAttribute('data-coe-confirm-class') || 'btn-danger';

    if (title || body) {
        const ok = await (window.confirmModal ? window.confirmModal({
            title: title || 'Are you sure?',
            body: body || '',
            confirmText: (btn.textContent || '').trim() || 'Confirm',
            confirmClass: ccls
        }) : Promise.resolve(true));
        if (!ok) return;
    }

    form.submit();
});

// --- AJAX form submit for Coe.UI forms (unchanged, TS fix in catch)
document.addEventListener('submit', async function (e) {
    const form = e.target instanceof HTMLFormElement ? e.target : null;
    if (!form) return;
    if (form.getAttribute('data-coe-ajax') !== 'true') return;

    e.preventDefault();

    const summary = form.querySelector('[data-coe-val-summary]');
    if (summary) summary.textContent = '';

    try {
        const fd = new FormData(form);
        const method = (form.getAttribute('method') || 'post').toUpperCase();
        const res = await fetch(form.action, {
            method,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            body: method === 'GET' ? null : fd
        });

        const ct = res.headers.get('content-type') || '';
        if (res.ok) {
            if (ct.includes('application/json')) {
                const data = await res.json();
                if (data?.redirect) { window.location.assign(data.redirect); return; }
                if (data?.message) { window.showToast?.({ title: 'Success', body: String(data.message), variant: 'success' }); }
                return;
            }
            window.location.reload();
            return;
        }

        let msg = `Request failed (${res.status})`;
        if (ct.includes('application/json')) {
            const data = await res.json().catch(() => null);
            msg = data?.error || data?.message || msg;
        } else {
            const txt = await res.text();
            if (txt) msg = txt.substring(0, 500);
        }
        window.showToast?.({ title: 'Error', body: msg, variant: 'danger' });
        if (summary) summary.textContent = msg;
    } catch (err) {
        const msg = (err && err.message) ? err.message : 'Network error';
        window.showToast?.({ title: 'Error', body: msg, variant: 'danger' });
        const summary = form.querySelector('[data-coe-val-summary]');
        if (summary) summary.textContent = msg;
    }
});

// --- Row Delete via fetch (no per-row <form>)
(function () {
    function getRequestVerificationToken() {
        const el = document.querySelector('input[name="__RequestVerificationToken"]');
        return el ? el.value : null;
    }
    async function askConfirm(opts) {
        return window.confirmModal ? await window.confirmModal(opts) : window.confirm(opts.title || 'Confirm');
    }

    document.addEventListener('click', async (e) => {
        const t = /** @type {HTMLElement} */(e.target);
        const del = t && t.closest ? t.closest('[data-coe-delete]') : null;
        if (!del) return;

        e.preventDefault();

        const url = del.getAttribute('data-url') || del.getAttribute('href');
        const name = del.getAttribute('data-name') || 'this item';
        const title = del.getAttribute('data-coe-confirm-title') || `Delete ${name}?`;
        const body = del.getAttribute('data-coe-confirm-body') || '';
        const ccls = del.getAttribute('data-coe-confirm-class') || 'btn-danger';
        const method = (del.getAttribute('data-method') || 'POST').toUpperCase();

        const ok = await askConfirm({
            title, body,
            confirmText: (del.textContent || '').trim() || 'Delete',
            confirmClass: ccls
        });
        if (!ok) return;

        const token = getRequestVerificationToken();
        const headers = { 'X-Requested-With': 'XMLHttpRequest' };
        if (token) headers['RequestVerificationToken'] = token;

        try {
            const res = await fetch(url, { method, headers, credentials: 'same-origin' });
            const ct = res.headers.get('content-type') || '';
            if (res.ok) {
                if (ct.includes('application/json')) {
                    const data = await res.json().catch(() => ({}));
                    if (data?.message) window.showToast?.({ title: 'Success', body: String(data.message), variant: 'success' });
                    if (data?.redirect) { window.location.assign(data.redirect); return; }
                }
                window.location.reload();
                return;
            }

            let msg = `Delete failed (${res.status})`;
            if (ct.includes('application/json')) {
                const data = await res.json().catch(() => null);
                msg = data?.error || data?.message || msg;
            } else {
                const txt = await res.text();
                if (txt) msg = txt.slice(0, 500);
            }
            window.showToast?.({ title: 'Error', body: msg, variant: 'danger' });
        } catch (err) {
            const msg = (err && err.message) ? err.message : 'Network error';
            window.showToast?.({ title: 'Error', body: msg, variant: 'danger' });
        }
    });
})();
