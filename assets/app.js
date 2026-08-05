// Supabase Configuration
    function getConfigValue(name, fallback) {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get(name);
      if (fromQuery) return fromQuery;
      const fromWindow = window?.__SUPABASE_CONFIG__?.[name];
      if (fromWindow) return fromWindow;
      return fallback;
    }

    const SUPABASE_URL = getConfigValue('supabaseUrl', 'https://khepitixnrezlnyablfd.supabase.co');
    const SUPABASE_ANON_KEY = getConfigValue('supabaseAnonKey', 'sb_publishable_ITVKCtxEo826CuvP3WPg6g_BgD99vSB');
    const SUPABASE_AUTH_EMAIL = getConfigValue('supabaseEmail', '');
    const SUPABASE_AUTH_PASSWORD = getConfigValue('supabasePassword', '');
    
    // Initialize Supabase when library is ready
    function getSupabase() {
      if (window.supabaseCreateClient) {
        return window.supabaseCreateClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
      return null;
    }
    
    let supabaseClient = null;
    let supabaseReady = false;
    let supabaseAuthReady = false;
    let authStatusMessage = 'Checking Supabase access…';

    function updateSupabaseStatusNotice() {
      const notice = document.getElementById('supabaseStatusNotice');
      if (!notice) return;
      notice.textContent = authStatusMessage;
      notice.className = supabaseAuthReady ? 'empty' : 'empty';
      notice.style.color = supabaseAuthReady ? '#2563eb' : '#b45309';
    }
    
    // Try to init immediately
    supabaseClient = getSupabase();
    if (!supabaseClient) {
      // If not ready, wait for library to load
      const maxAttempts = 30;
      let attempts = 0;
      const initInterval = setInterval(() => {
        attempts++;
        supabaseClient = getSupabase();
        if (supabaseClient) {
          supabaseReady = true;
          console.log("✓ Supabase initialized successfully");
          clearInterval(initInterval);
        } else if (attempts >= maxAttempts) {
          console.error("✗ Supabase failed to initialize after 30 seconds. Check your internet connection.");
          clearInterval(initInterval);
        }
      }, 100);
    } else {
      supabaseReady = true;
      console.log("✓ Supabase initialized successfully");
    }
    
    // Function to wait for Supabase to be ready
    async function waitForSupabase(maxWaitMs = 35000) {
      const startTime = Date.now();
      while (!supabaseReady && (Date.now() - startTime) < maxWaitMs) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return supabaseReady;
    }

    async function ensureSupabaseSession(email = SUPABASE_AUTH_EMAIL, password = SUPABASE_AUTH_PASSWORD) {
      if (!supabaseClient) {
        authStatusMessage = 'Could not connect. Check your internet connection.';
        updateSupabaseStatusNotice();
        setAuthUiVisible(true, authStatusMessage);
        return false;
      }
      if (supabaseAuthReady) {
        authStatusMessage = 'Signed in successfully.';
        updateSupabaseStatusNotice();
        setAuthUiVisible(false, authStatusMessage);
        return true;
      }

      if (!email || !password || email.includes('example') || password.includes('change-me')) {
        authStatusMessage = 'Enter your VULTR Inventory email and password to connect.';
        updateSupabaseStatusNotice();
        setAuthUiVisible(true, authStatusMessage);
        return false;
      }

      try {
        const { data, error } = await withSupabaseRetry('supabase sign-in', () => supabaseClient.auth.signInWithPassword({
          email,
          password
        }));

        if (error) {
          console.warn('Supabase sign-in failed:', error);
          authStatusMessage = `Login failed: ${error.message || 'unknown error'}.`;
          updateSupabaseStatusNotice();
          setAuthUiVisible(true, authStatusMessage);
          return false;
        }

        supabaseAuthReady = !!data?.session;
        authStatusMessage = supabaseAuthReady ? 'Signed in successfully.' : 'Session is not active.';
        updateSupabaseStatusNotice();
        setAuthUiVisible(!supabaseAuthReady, authStatusMessage);
        return supabaseAuthReady;
      } catch (error) {
        console.warn('Supabase auth setup failed:', error);
        authStatusMessage = 'Login failed. Check your email and password and try again.';
        updateSupabaseStatusNotice();
        setAuthUiVisible(true, authStatusMessage);
        return false;
      }
    }

    async function initializeSupabaseAuth() {
      if (!supabaseClient) {
        setAuthUiVisible(true, 'Service is unavailable right now.');
        return false;
      }

      try {
        const { data: { session }, error } = await withSupabaseRetry('read supabase session', () => supabaseClient.auth.getSession());
        if (error) {
          throw error;
        }

        if (session?.access_token) {
          supabaseAuthReady = true;
          authStatusMessage = 'Signed in successfully.';
          updateSupabaseStatusNotice();
          setAuthUiVisible(false, authStatusMessage);
          return true;
        }
      } catch (error) {
        console.warn('Could not read existing Supabase session:', error);
      }

      if (SUPABASE_AUTH_EMAIL && SUPABASE_AUTH_PASSWORD) {
        return ensureSupabaseSession(SUPABASE_AUTH_EMAIL, SUPABASE_AUTH_PASSWORD);
      }

      setAuthUiVisible(true, 'Enter your VULTR Inventory email and password to continue.');
      return false;
    }
    const partForm = document.getElementById('partForm');
    const inventoryBody = document.getElementById('inventoryBody');
    const reorderSummary = document.getElementById('reorderSummary');
    const searchInput = document.getElementById('searchInput');
    const cancelEditButton = document.getElementById('cancelEdit');
    const submitButton = document.getElementById('submitButton');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const closeImageModalButton = document.getElementById('closeImageModal');
    const openScannerButton = document.getElementById('openScanner');
    const scannerModal = document.getElementById('scannerModal');
    const closeScannerButton = document.getElementById('closeScanner');
    const scannerInput = document.getElementById('scannerInput');
    const scannerVideo = document.getElementById('scannerVideo');
    const cameraStatus = document.getElementById('cameraStatus');
    const cameraScannerSection = document.getElementById('cameraScannerSection');
    const cameraHelp = document.getElementById('cameraHelp');
    const enableCameraButton = document.getElementById('enableCamera');
    const retryCameraButton = document.getElementById('retryCamera');
    const tableScroll = document.querySelector('.table-scroll');
    const tabButtons = document.querySelectorAll('.tab-button');
    const inventoryTabPanel = document.getElementById('inventoryTabPanel');
    const teamTabPanel = document.getElementById('teamTabPanel');
    const docsTabPanel = document.getElementById('docsTabPanel');
    const signOutForm = document.getElementById('signOutForm');
    const fromTeamInput = document.getElementById('fromTeam');
    const toTeamInput = document.getElementById('toTeam');
    const transferToolNameInput = document.getElementById('transferToolName');
    const recipientNameInput = document.getElementById('recipientName');
    const transferQtyInput = document.getElementById('transferQty');
    const dueDateInput = document.getElementById('dueDate');
    const transferNotesInput = document.getElementById('transferNotes');
    const signOutSubmitButton = document.getElementById('signOutSubmitButton');
    const cancelSignOutEditButton = document.getElementById('cancelSignOutEdit');
    const signOutBody = document.getElementById('signOutBody');
    const myTeamFilterInput = document.getElementById('myTeamFilter');
    const myTeamOutgoing = document.getElementById('myTeamOutgoing');
    const outgoingTitle = document.getElementById('outgoingTitle');
    const toggleHistoryButton = document.getElementById('toggleHistoryButton');
    const historyPanel = document.getElementById('historyPanel');
    const previousSignOutBody = document.getElementById('previousSignOutBody');
    const myTeamMeta = document.getElementById('myTeamMeta');
    const docUploadForm = document.getElementById('docUploadForm');
    const docUploadInput = document.getElementById('docUploadInput');
    const docLinkInput = document.getElementById('docLinkInput');
    const docNameInput = document.getElementById('docNameInput');
    const docNotesInput = document.getElementById('docNotesInput');
    const docUploadList = document.getElementById('docUploadList');
    const authPanel = document.getElementById('authPanel');
    const appContent = document.getElementById('appContent');
    const authForm = document.getElementById('supabaseAuthForm');
    const authEmailInput = document.getElementById('supabaseEmailInput');
    const authPasswordInput = document.getElementById('supabasePasswordInput');
    const authStatusText = document.getElementById('authStatusText');

    let parts = [];
    let editingId = null;
    let selectedImageData = null;
    let scannerCodeReader = null;
    let cameraScannerActive = false;
    let cameraResultLocked = false;
    let cameraStream = null;
    let nativeBarcodeDetector = null;
    let nativeScannerFrameId = null;
    let signOutRecords = [];
    let historyPanelOpen = false;
    let editingSignOutId = null;
    let lastModalTriggerElement = null;

    function rememberModalTrigger() {
      lastModalTriggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }

    function restoreModalTriggerFocus() {
      if (lastModalTriggerElement && typeof lastModalTriggerElement.focus === 'function') {
        lastModalTriggerElement.focus();
      }
      lastModalTriggerElement = null;
    }

    function getOpenModal() {
      if (scannerModal && scannerModal.classList.contains('open')) return scannerModal;
      if (imageModal && imageModal.classList.contains('open')) return imageModal;
      return null;
    }

    function getFocusableModalElements(modal) {
      if (!modal) return [];
      return Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(element => !element.disabled && element.tabIndex !== -1 && element.offsetParent !== null);
    }

    function trapFocusInOpenModal(event) {
      if (event.key !== 'Tab') return;
      const openModal = getOpenModal();
      if (!openModal) return;
      const focusable = getFocusableModalElements(openModal);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function setAuthUiVisible(visible, message = '') {
      if (authPanel) {
        authPanel.hidden = !visible;
      }
      if (appContent) {
        appContent.hidden = !(!visible);
      }
      if (authStatusText) {
        authStatusText.textContent = message || 'Sign in to your VULTR Inventory account to sync parts, tools, and documents.';
      }
    }
    let uploadedDocs = [];
    let docsSubscription = null;
    const preferredLinearFormats = ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar'];
    const docsStorageKey = 'vultr_inventory_uploaded_docs';
    const supabaseDocsBucket = 'inventory-docs';
    const docsTableName = 'inventory_documents';
    const zxingLibraryUrl = 'https://unpkg.com/@zxing/library@0.21.3';
    const ignoredSamplePartNames = ['Bearing 6204', 'Hydraulic Seal Kit', 'Motor Relay 24V'];
    const appBootTimestamp = performance.now();

    function logPerf(label, fromTs = appBootTimestamp) {
      const elapsedMs = Math.round(performance.now() - fromTs);
      console.log(`[perf] ${label}: ${elapsedMs}ms`);
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isRetryableSupabaseError(error) {
      if (!error) return false;
      const status = Number(error.status || error.statusCode || 0);
      if (status === 408 || status === 429 || status >= 500) return true;
      const message = String(error.message || error.details || error.hint || '').toLowerCase();
      return /network|timeout|timed out|fetch failed|failed to fetch|temporary|connection|econnreset|etimedout|503|502|500/.test(message);
    }

    async function withSupabaseRetry(operationName, runQuery, options = {}) {
      const attempts = Math.max(1, Number(options.attempts || 3));
      const baseDelayMs = Math.max(100, Number(options.baseDelayMs || 250));

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          const result = await runQuery();
          const queryError = result && typeof result === 'object' ? result.error : null;
          if (!queryError || !isRetryableSupabaseError(queryError) || attempt === attempts) {
            return result;
          }
          console.warn(`[retry] ${operationName} failed (${attempt}/${attempts}). Retrying...`, queryError);
        } catch (error) {
          if (!isRetryableSupabaseError(error) || attempt === attempts) {
            throw error;
          }
          console.warn(`[retry] ${operationName} threw (${attempt}/${attempts}). Retrying...`, error);
        }

        const delay = baseDelayMs * (2 ** (attempt - 1));
        await sleep(delay);
      }

      return runQuery();
    }

    function debounce(fn, waitMs = 180) {
      let timerId = null;
      return function debounced(...args) {
        if (timerId) {
          clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
          timerId = null;
          fn.apply(this, args);
        }, waitMs);
      };
    }

    function loadImageElement(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Could not load image for optimization.'));
        image.src = src;
      });
    }

    function canvasToBlob(canvas, mimeType, quality) {
      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not encode optimized image.'));
          }
        }, mimeType, quality);
      });
    }

    async function optimizeImageFileForStorage(file, options = {}) {
      if (!file || !String(file.type || '').startsWith('image/')) {
        return { optimizedFile: file, dataUrl: await readFileAsDataUrl(file), optimized: false };
      }

      const maxWidth = Number(options.maxWidth || 1600);
      const maxHeight = Number(options.maxHeight || 1600);
      const quality = Number(options.quality || 0.82);

      const sourceUrl = URL.createObjectURL(file);
      try {
        const image = await loadImageElement(sourceUrl);
        const widthRatio = maxWidth / image.width;
        const heightRatio = maxHeight / image.height;
        const scale = Math.min(1, widthRatio, heightRatio);
        const targetWidth = Math.max(1, Math.round(image.width * scale));
        const targetHeight = Math.max(1, Math.round(image.height * scale));
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Could not create image optimization canvas context.');
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight);
        const optimizedBlob = await canvasToBlob(canvas, outputType, quality);
        const optimizedFile = new File([optimizedBlob], file.name, {
          type: outputType,
          lastModified: Date.now()
        });
        const dataUrl = await readFileAsDataUrl(optimizedFile);

        return {
          optimizedFile,
          dataUrl,
          optimized: optimizedFile.size < file.size || scale < 1
        };
      } finally {
        URL.revokeObjectURL(sourceUrl);
      }
    }

    let zxingLoadPromise = null;

    function ensureZxingLoaded() {
      if (window.ZXing) {
        return Promise.resolve(true);
      }
      if (zxingLoadPromise) {
        return zxingLoadPromise;
      }

      zxingLoadPromise = new Promise(resolve => {
        const existing = document.querySelector('script[data-zxing-loader="dynamic"]');
        if (existing) {
          existing.addEventListener('load', () => resolve(!!window.ZXing), { once: true });
          existing.addEventListener('error', () => resolve(false), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = zxingLibraryUrl;
        script.async = true;
        script.dataset.zxingLoader = 'dynamic';
        script.onload = () => {
          console.log('ZXing library loaded on demand.');
          resolve(!!window.ZXing);
        };
        script.onerror = () => {
          console.warn('ZXing library failed to load.');
          resolve(false);
        };
        document.head.appendChild(script);
      }).finally(() => {
        if (!window.ZXing) {
          zxingLoadPromise = null;
        }
      });

      return zxingLoadPromise;
    }

    function isIgnoredSamplePart(part) {
      const name = String(part?.name || '').trim();
      return ignoredSamplePartNames.includes(name);
    }

    function buildSignOutNotes(notes, recipientName) {
      const parts = [];
      if (recipientName) {
        parts.push(`Recipient: ${recipientName}`);
      }
      if (notes) {
        parts.push(notes);
      }
      return parts.join(' | ');
    }

    function extractRecipientNameFromNotes(notes) {
      if (typeof notes !== 'string' || !notes) return '';
      const match = notes.match(/Recipient:\s*(.+?)(?:\s*\|\s*|$)/i);
      return match ? match[1].trim() : '';
    }

    function mapSignOutRow(row) {
      if (!row) return null;
      return {
        id: row.id,
        partId: row.part_id,
        partName: row.part_name,
        quantity: row.quantity,
        fromTeam: row.from_team,
        toTeam: row.to_team,
        signedOutAt: row.signed_out_at,
        dueDate: row.due_date,
        recipientName: row.recipient_name || extractRecipientNameFromNotes(row.notes),
        notes: row.notes,
        status: row.status,
        returnedAt: row.returned_at
      };
    }

    async function loadSignOutRecords() {
      if (!supabaseClient) {
        return [];
      }

      try {
        const { data, error } = await withSupabaseRetry('load sign-out records', () => supabaseClient
          .from('tool_signouts')
          .select('*')
          .order('signed_out_at', { ascending: false }));

        if (error) {
          console.warn('Could not load sign-out records from Supabase:', error);
          return [];
        }

        return (data || []).map(mapSignOutRow).filter(Boolean);
      } catch (error) {
        console.warn('Could not load sign-out records:', error);
        return [];
      }
    }

    async function createSignOutRecord(record) {
      if (!supabaseClient) {
        return null;
      }

      const payload = {
        id: record.id,
        part_id: record.partId || null,
        part_name: record.partName,
        quantity: record.quantity,
        from_team: record.fromTeam,
        to_team: record.toTeam,
        signed_out_at: record.signedOutAt,
        due_date: record.dueDate,
        notes: buildSignOutNotes(record.notes, record.recipientName),
        status: record.status,
        returned_at: record.returnedAt
      };

      const { data, error } = await withSupabaseRetry('create sign-out record', () => supabaseClient
        .from('tool_signouts')
        .insert([payload])
        .select()
        .single());

      if (error) {
        console.warn('Could not create sign-out record:', error);
        return null;
      }

      return mapSignOutRow(data);
    }

    async function markSignOutReturned(recordId, returnedAt) {
      if (!supabaseClient) {
        return false;
      }

      const { data, error } = await withSupabaseRetry('mark sign-out returned', () => supabaseClient
        .from('tool_signouts')
        .update({ status: 'returned', returned_at: returnedAt })
        .eq('id', recordId)
        .select()
        .single());

      if (error) {
        console.warn('Could not mark sign-out returned:', error);
        return false;
      }

      signOutRecords = signOutRecords.map(item => item.id === recordId ? mapSignOutRow(data) : item);
      return true;
    }

    async function markSignOutTransferred(recordId, transferredAt) {
      if (!supabaseClient) {
        return { success: false, error: 'Supabase client unavailable.' };
      }

      const { data, error } = await withSupabaseRetry('mark sign-out transferred', () => supabaseClient
        .from('tool_signouts')
        .update({ status: 'transferred', returned_at: transferredAt })
        .eq('id', recordId)
        .select()
        .single());

      if (error) {
        console.warn('Could not mark sign-out transferred:', error);
        return { success: false, error: error.message || 'Unknown Supabase error.' };
      }

      signOutRecords = signOutRecords.map(item => item.id === recordId ? mapSignOutRow(data) : item);
      return { success: true };
    }

    async function updateSignOutRecord(recordId, updates) {
      if (!supabaseClient) {
        return null;
      }

      const payload = {
        part_name: updates.partName,
        quantity: updates.quantity,
        from_team: updates.fromTeam,
        to_team: updates.toTeam,
        due_date: updates.dueDate,
        notes: buildSignOutNotes(updates.notes, updates.recipientName)
      };

      const { data, error } = await withSupabaseRetry('update sign-out record', () => supabaseClient
        .from('tool_signouts')
        .update(payload)
        .eq('id', recordId)
        .eq('status', 'out')
        .select()
        .single());

      if (error) {
        console.warn('Could not update sign-out record:', error);
        return null;
      }

      const mapped = mapSignOutRow(data);
      signOutRecords = signOutRecords.map(item => item.id === recordId ? mapped : item);
      return mapped;
    }

    function resetSignOutForm() {
      editingSignOutId = null;
      signOutForm.reset();
      transferQtyInput.value = 1;
      if (signOutSubmitButton) {
        signOutSubmitButton.textContent = 'Sign out tool';
      }
      if (cancelSignOutEditButton) {
        cancelSignOutEditButton.style.display = 'none';
      }
    }

    function startSignOutEdit(record) {
      if (!record || record.status === 'returned') {
        return;
      }

      editingSignOutId = record.id;
      transferToolNameInput.value = record.partName || '';
      fromTeamInput.value = record.fromTeam || 'VULTR';
      toTeamInput.value = record.toTeam || '';
      transferQtyInput.value = Number(record.quantity) > 0 ? String(record.quantity) : '1';
      dueDateInput.value = record.dueDate || '';
      recipientNameInput.value = record.recipientName || '';
      transferNotesInput.value = record.notes || '';

      if (signOutSubmitButton) {
        signOutSubmitButton.textContent = 'Update sign-out';
      }
      if (cancelSignOutEditButton) {
        cancelSignOutEditButton.style.display = 'inline-block';
      }

      switchTab('team');
      signOutForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      transferToolNameInput.focus();
    }

    function formatDate(dateString) {
      if (!dateString) return '—';
      const parsed = new Date(dateString);
      if (Number.isNaN(parsed.getTime())) return '—';
      return parsed.toLocaleDateString();
    }

    function formatDateTime(dateString) {
      if (!dateString) return '—';
      const parsed = new Date(dateString);
      if (Number.isNaN(parsed.getTime())) return '—';
      return parsed.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }

    function getSignOutStatusInfo(record) {
      if (record.status === 'returned') {
        return { label: 'Returned', className: 'status-good' };
      }
      if (record.status === 'transferred') {
        return { label: 'Transferred', className: 'status-good' };
      }
      return { label: 'Out', className: 'status-low' };
    }

    function switchTab(tabName) {
      const tabPanels = {
        inventory: inventoryTabPanel,
        team: teamTabPanel,
        docs: docsTabPanel
      };

      Object.entries(tabPanels).forEach(([name, panel]) => {
        if (!panel) return;
        panel.classList.toggle('active', name === tabName);
      });

      tabButtons.forEach(button => {
        const active = button.dataset.tab === tabName;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function summarizeRecordsByTool(records) {
      const totals = new Map();
      records.forEach(record => {
        const key = record.partName || 'Unknown tool';
        const current = totals.get(key) || 0;
        totals.set(key, current + (Number(record.quantity) || 0));
      });
      if (!totals.size) return 'None';
      return Array.from(totals.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, qty]) => `${escapeHtml(name)} (${qty})`)
        .join(', ');
    }

    function renderTeamTab() {
      if (!signOutBody) return;
      const sorted = signOutRecords
        .slice()
        .sort((a, b) => new Date(b.signedOutAt).getTime() - new Date(a.signedOutAt).getTime());
      const activeSignOuts = sorted.filter(record => record.status !== 'returned' && record.status !== 'transferred');

      signOutBody.innerHTML = '';
      if (!activeSignOuts.length) {
        signOutBody.innerHTML = '<tr><td colspan="9" class="empty">No active sign-outs.</td></tr>';
      } else {
        activeSignOuts.forEach(record => {
          const statusInfo = getSignOutStatusInfo(record);
          signOutBody.insertAdjacentHTML('beforeend', `
            <tr>
              <td><strong>${escapeHtml(record.partName)}</strong></td>
              <td>${record.quantity}</td>
              <td>${escapeHtml(record.fromTeam)}</td>
              <td>${escapeHtml(record.toTeam)}</td>
              <td>${escapeHtml(record.recipientName || '—')}</td>
              <td>${formatDateTime(record.signedOutAt)}</td>
              <td>${formatDate(record.dueDate)}</td>
              <td><span class="status ${statusInfo.className}">${statusInfo.label}</span></td>
              <td>
                <div class="actions" style="margin:0; gap: 0.25rem; align-items: center; flex-wrap: nowrap;">
                  <button class="secondary" type="button" data-action="transfer" data-id="${record.id}">Permanent transfer</button>
                  <button class="secondary" type="button" data-action="return" data-id="${record.id}">Mark returned</button>
                  <div class="options-wrapper">
                    <button class="secondary options-toggle" type="button" data-action="options-toggle" aria-label="More actions">⋯</button>
                    <div class="options-menu" role="menu">
                      <button class="secondary" type="button" data-action="edit-signout" data-id="${record.id}">Edit</button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          `);
        });
      }

      const myTeam = (myTeamFilterInput && myTeamFilterInput.value.trim()) || 'VULTR';
      if (outgoingTitle) {
        outgoingTitle.textContent = `Currently lent out by ${myTeam}`;
      }

      const outgoing = signOutRecords.filter(record =>
        record.status !== 'returned' && record.status !== 'transferred' && record.fromTeam.toLowerCase() === myTeam.toLowerCase()
      );

      const previous = signOutRecords
        .filter(record => (record.status === 'returned' || record.status === 'transferred') && record.fromTeam.toLowerCase() === myTeam.toLowerCase())
        .sort((a, b) => new Date(b.returnedAt || b.signedOutAt).getTime() - new Date(a.returnedAt || a.signedOutAt).getTime());

      myTeamOutgoing.textContent = summarizeRecordsByTool(outgoing);

      if (toggleHistoryButton) {
        toggleHistoryButton.textContent = `Previous sign-outs from ${myTeam}: ${previous.length} record(s)`;
        toggleHistoryButton.setAttribute('aria-expanded', historyPanelOpen ? 'true' : 'false');
      }

      if (historyPanel) {
        historyPanel.hidden = !historyPanelOpen;
      }

      if (previousSignOutBody) {
        if (!previous.length) {
          previousSignOutBody.innerHTML = '<tr><td colspan="7" class="empty">No previous sign-outs for this team yet.</td></tr>';
        } else {
          previousSignOutBody.innerHTML = previous.map(record => `
            <tr>
              <td><strong>${escapeHtml(record.partName)}</strong></td>
              <td>${record.quantity}</td>
              <td>${escapeHtml(record.toTeam)}</td>
              <td>${escapeHtml(record.recipientName || '—')}</td>
              <td>${formatDateTime(record.signedOutAt)}</td>
              <td>${record.status === 'transferred' ? 'Transferred' : formatDateTime(record.returnedAt)}</td>
              <td>${escapeHtml(record.notes || '—')}</td>
            </tr>
          `).join('');
        }
      }

      myTeamMeta.textContent = historyPanelOpen
        ? `Showing previous sign-outs for ${myTeam}.`
        : `Click to view previous sign-outs for ${myTeam}.`;
    }

    async function ensureSupabaseSchema() {
      if (!supabaseClient) return false;

      try {
        const createTablesSql = `
          create table if not exists public.inventory_parts (
            id uuid primary key default gen_random_uuid(),
            name text not null,
            barcode text default '',
            quantity int default 0,
            minstock int default 1,
            image text default '',
            created_at timestamptz default now()
          );

          create table if not exists public.tool_signouts (
            id uuid primary key default gen_random_uuid(),
            part_id uuid,
            part_name text not null,
            quantity int default 1,
            from_team text not null,
            to_team text not null,
            signed_out_at timestamptz default now(),
            due_date date,
            recipient_name text default '',
            notes text default '',
            status text default 'out',
            returned_at timestamptz
          );

          create table if not exists public.inventory_documents (
            id uuid primary key default gen_random_uuid(),
            name text not null,
            type text default 'file',
            size bigint default 0,
            note text default '',
            created_at timestamptz default now(),
            data_url text default '',
            public_url text default '',
            link text default '',
            storage_path text default '',
            storage_bucket text default ''
          );

          alter table public.inventory_parts enable row level security;
          alter table public.tool_signouts enable row level security;
          alter table public.inventory_documents enable row level security;
        `;

        const { error } = await supabaseClient.rpc('exec_sql', { sql: createTablesSql });
        if (error) {
          console.warn('Auto schema creation via RPC failed:', error);
          return false;
        }

        return true;
      } catch (error) {
        console.warn('Could not ensure Supabase schema:', error);
        return false;
      }
    }

    async function loadParts() {
      try {
        // Wait for supabaseClient to be available
        let attempts = 0;
        while (!supabaseClient && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!supabaseClient) {
          console.warn('Supabase client not available; inventory will remain empty until the connection is available.');
          return [];
        }
        
        const { data, error } = await withSupabaseRetry('load inventory parts', () => supabaseClient
          .from('inventory_parts')
          .select('*')
          .order('created_at', { ascending: false }));
        
        if (error) {
          const detail = error?.message || 'unknown error';
          const explanation = error?.code === '42P01'
            ? 'The inventory_parts table does not exist yet.'
            : /row-level security|permission denied|42501/i.test(detail)
              ? 'RLS is blocking the read. Allow authenticated users to select rows from inventory_parts.'
              : 'Check your table name and column names.';
          authStatusMessage = `Supabase read failed: ${detail}. ${explanation}`;
          updateSupabaseStatusNotice();
          console.warn('Could not load inventory from Supabase:', error);
          return [];
        }
        
        if (data && data.length > 0) {
          return data
            .filter(part => !isIgnoredSamplePart(part))
            .map(part => ({
              ...part,
              minStock: part.minstock
            }));
        }

        authStatusMessage = 'Signed in successfully, but inventory_parts is empty right now. Add a part to create the first row.';
        updateSupabaseStatusNotice();
        return [];
      } catch (error) {
        const detail = error?.message || 'unknown error';
        authStatusMessage = `Supabase load error: ${detail}`;
        updateSupabaseStatusNotice();
        console.warn('Error loading parts:', error);
        return [];
      }
    }

    async function addPart(formData) {
      if (!supabaseClient) {
        alert("Supabase not initialized. Please refresh the page.");
        return false;
      }
      
      const { data, error } = await withSupabaseRetry('add inventory part', () => supabaseClient
        .from('inventory_parts')
        .insert([formData])
        .select()
        .single());
      
      console.log("INSERT RESULT:", data);
      console.log("INSERT ERROR:", error);
      
      if (error) {
        alert(error.message);
        return false;
      }
      
      data.minStock = data.minstock;
      parts.unshift(data);
      return true;
    }

    async function updatePart(partId, formData) {
      if (!supabaseClient) {
        alert("Supabase not initialized.");
        return false;
      }
      
      const { error } = await withSupabaseRetry('update inventory part', () => supabaseClient
        .from('inventory_parts')
        .update(formData)
        .eq('id', partId));
      
      if (error) {
        alert('Error updating part: ' + error.message);
        return false;
      }
      
      parts = parts.map(part => part.id === partId ? { ...part, ...formData } : part);
      return true;
    }

    async function deletePart(partId) {
      if (!supabaseClient) {
        alert("Supabase not initialized.");
        return false;
      }
      
      const { error } = await withSupabaseRetry('delete inventory part', () => supabaseClient
        .from('inventory_parts')
        .delete()
        .eq('id', partId));
      
      if (error) {
        alert('Error deleting part: ' + error.message);
        return false;
      }
      
      parts = parts.filter(item => item.id !== partId);
      return true;
    }

    async function updateQuantity(partId, quantity) {
      if (!supabaseClient) {
        alert("Supabase not initialized.");
        return false;
      }
      
      const { error } = await withSupabaseRetry('update inventory quantity', () => supabaseClient
        .from('inventory_parts')
        .update({ quantity })
        .eq('id', partId));
      
      if (error) {
        alert('Error updating quantity: ' + error.message);
        return false;
      }
      
      parts = parts.map(part => part.id === partId ? { ...part, quantity } : part);
      return true;
    }

    function getStatus(part) {
      if (part.quantity <= 0) return { label: 'Out of stock', className: 'status-danger' };
      if (part.quantity <= part.minstock) return { label: 'Reorder', className: 'status-danger' };
      if (part.quantity <= part.minstock + 3) return { label: 'Low stock', className: 'status-low' };
      return { label: 'In stock', className: 'status-good' };
    }

    function updateImagePreview(src) {
      if (src) {
        imagePreview.src = src;
        imagePreview.style.display = 'block';
      } else {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
      }
    }

    function adjustQuantity(partId, delta) {
      const part = parts.find(p => p.id === partId);
      if (!part) return;
      const newQuantity = Math.max(0, part.quantity + delta);
      updateQuantity(partId, newQuantity).then(success => {
        if (success) {
          render();
        }
      });
    }

    function adjustQuantityMultiple(partId) {
      const amount = prompt('Enter the quantity change for this item (use a negative number to subtract):', '0');
      if (amount === null) return;
      const delta = parseInt(amount, 10);
      if (isNaN(delta) || delta === 0) {
        return alert('Please enter a non-zero number.');
      }
      adjustQuantity(partId, delta);
    }

    function openImageModal(src, alt) {
      if (!src) return;
      rememberModalTrigger();
      modalImage.src = src;
      modalImage.alt = alt || 'Enlarged item image';
      modalCaption.textContent = alt || '';
      imageModal.classList.add('open');
      imageModal.setAttribute('aria-hidden', 'false');
      if (closeImageModalButton) {
        closeImageModalButton.focus();
      }
    }

    function closeImageModal() {
      imageModal.classList.remove('open');
      imageModal.setAttribute('aria-hidden', 'true');
      modalImage.src = '';
      modalImage.alt = '';
      modalCaption.textContent = '';
      restoreModalTriggerFocus();
    }

    imageInput.addEventListener('change', async function () {
      const file = imageInput.files && imageInput.files[0];
      if (!file) {
        selectedImageData = null;
        updateImagePreview(null);
        return;
      }
      try {
        const optimized = await optimizeImageFileForStorage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82
        });
        selectedImageData = optimized.dataUrl;
        updateImagePreview(selectedImageData);
      } catch (error) {
        console.warn('Could not optimize part image, using original file data URL.', error);
        selectedImageData = await readFileAsDataUrl(file);
        updateImagePreview(selectedImageData);
      }
    });

    closeImageModalButton.addEventListener('click', closeImageModal);
    imageModal.addEventListener('click', function (event) {
      if (event.target.dataset.action === 'close-modal' || event.target === imageModal) {
        closeImageModal();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        const scannerOpen = scannerModal && scannerModal.classList.contains('open');
        const imageOpen = imageModal && imageModal.classList.contains('open');
        if (scannerOpen) {
          closeScanner();
          return;
        }
        if (imageOpen) {
          closeImageModal();
          return;
        }
      }
      trapFocusInOpenModal(event);
    });

    // Scanner modal handlers: mobile camera scan (ZXing) + manual input fallback
    if (openScannerButton) openScannerButton.addEventListener('click', openScanner);
    if (closeScannerButton) closeScannerButton.addEventListener('click', closeScanner);
    if (scannerModal) scannerModal.addEventListener('click', function (e) { if (e.target.dataset.action === 'close-scanner' || e.target === scannerModal) closeScanner(); });
    if (enableCameraButton) enableCameraButton.addEventListener('click', startCameraScanner);
    if (retryCameraButton) retryCameraButton.addEventListener('click', startCameraScanner);

    function setCameraStatus(message) {
      if (cameraStatus) {
        cameraStatus.textContent = message;
      }
    }

    function setCameraHelpExpanded(expanded) {
      if (!cameraHelp) return;
      cameraHelp.open = !!expanded;
    }

    function stopCameraScanner() {
      cameraScannerActive = false;
      cameraResultLocked = false;
      if (nativeScannerFrameId) {
        cancelAnimationFrame(nativeScannerFrameId);
        nativeScannerFrameId = null;
      }
      if (scannerCodeReader) {
        scannerCodeReader.reset();
      }
      if (cameraStream) {
        const tracks = cameraStream.getTracks();
        tracks.forEach(track => track.stop());
        cameraStream = null;
      }
      if (scannerVideo && scannerVideo.srcObject) {
        scannerVideo.srcObject = null;
      }
      if (cameraScannerSection) {
        cameraScannerSection.style.display = 'none';
      }
    }

    function canUseCameraScanner() {
      return !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    function hasDecoderSupport() {
      return !!(window.ZXing || window.BarcodeDetector);
    }

    async function canUseNativeBarcodeDetectorForLinearCodes() {
      if (!window.BarcodeDetector) {
        return false;
      }
      if (typeof BarcodeDetector.getSupportedFormats !== 'function') {
        return true;
      }
      try {
        const supported = await BarcodeDetector.getSupportedFormats();
        return preferredLinearFormats.some(format => supported.includes(format));
      } catch (error) {
        console.warn('Could not read native barcode formats:', error);
        return false;
      }
    }

    function startNativeBarcodeDetectorLoop() {
      if (!window.BarcodeDetector || !scannerVideo) {
        return false;
      }

      if (!nativeBarcodeDetector) {
        nativeBarcodeDetector = new BarcodeDetector();
      }

      const scanFrame = async () => {
        if (!cameraScannerActive || cameraResultLocked) {
          return;
        }
        try {
          const barcodes = await nativeBarcodeDetector.detect(scannerVideo);
          if (barcodes && barcodes.length && barcodes[0].rawValue) {
            cameraResultLocked = true;
            setCameraStatus('Barcode found. Applying...');
            handleScannedCode(barcodes[0].rawValue);
            return;
          }
        } catch (error) {
          console.warn('Native barcode detection failed:', error);
        }
        nativeScannerFrameId = requestAnimationFrame(scanFrame);
      };

      nativeScannerFrameId = requestAnimationFrame(scanFrame);
      return true;
    }

    async function startCameraScanner() {
      if (!canUseCameraScanner()) {
        setCameraStatus('Camera scan unavailable here. Open the site on HTTPS and allow camera access, or use manual input below.');
        setCameraHelpExpanded(true);
        if (cameraScannerSection) {
          cameraScannerSection.style.display = 'block';
        }
        return;
      }

      try {
        stopCameraScanner();
        if (cameraScannerSection) {
          cameraScannerSection.style.display = 'block';
        }
        setCameraStatus('Tap Allow when prompted, then point camera at a barcode...');

        if (enableCameraButton) {
          enableCameraButton.disabled = true;
        }

        // Explicit permission request to force mobile browser camera prompt.
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });

        if (scannerVideo) {
          scannerVideo.srcObject = cameraStream;
          await scannerVideo.play().catch(() => {});
        }

        const nativeLinearSupported = await canUseNativeBarcodeDetectorForLinearCodes();
        if (!nativeLinearSupported && !window.ZXing) {
          setCameraStatus('Loading barcode scanner library...');
          const zxingReady = await ensureZxingLoaded();
          if (!zxingReady) {
            setCameraStatus('Could not load barcode decoder. You can still type or paste the barcode below.');
            setCameraHelpExpanded(true);
            return;
          }
        }

        // Mark scanner active before starting any detection path.
        cameraScannerActive = true;
        cameraResultLocked = false;

        if (!hasDecoderSupport()) {
          setCameraStatus('Camera access granted, but no barcode decoder is available in this browser. You can still type or paste the barcode below.');
          setCameraHelpExpanded(true);
          return;
        }

        if (nativeLinearSupported) {
          const nativeStarted = startNativeBarcodeDetectorLoop();
          if (nativeStarted) {
            setCameraHelpExpanded(false);
            setCameraStatus('Camera ready. Hold barcode inside the frame.');
            return;
          }
        }

        if (!scannerCodeReader) {
          scannerCodeReader = new ZXing.BrowserMultiFormatReader();
        }

        let deviceId = null;
        if (ZXing.BrowserCodeReader && typeof ZXing.BrowserCodeReader.listVideoInputDevices === 'function') {
          const videoDevices = await ZXing.BrowserCodeReader.listVideoInputDevices();
          if (videoDevices && videoDevices.length) {
            const preferred = videoDevices.find(device => /back|rear|environment/i.test(device.label || ''));
            deviceId = preferred ? preferred.deviceId : videoDevices[0].deviceId;
          }
        }

        scannerCodeReader.decodeFromVideoDevice(deviceId, scannerVideo, (result, error) => {
          if (!cameraScannerActive || cameraResultLocked) {
            return;
          }
          if (result) {
            cameraResultLocked = true;
            setCameraStatus('Barcode found. Applying...');
            handleScannedCode(result.getText());
          } else if (error && !(error instanceof ZXing.NotFoundException)) {
            setCameraStatus('Scanning... hold steady over the barcode.');
          }
        });
        setCameraHelpExpanded(false);
        setCameraStatus('Camera ready. Hold barcode inside the frame.');
      } catch (error) {
        console.error('Unable to start camera scanner:', error);
        setCameraHelpExpanded(true);
        const denied = error && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
        if (denied) {
          setCameraStatus('Camera permission is blocked. In browser site settings, set Camera to Allow, then tap Enable camera again.');
        } else {
          setCameraStatus('Could not access camera. Tap Retry camera and allow permission if asked.');
        }
      } finally {
        if (enableCameraButton) {
          enableCameraButton.disabled = false;
        }
      }
    }

    function openScanner() {
      if (!scannerModal) return alert('Scanner not available');
      rememberModalTrigger();
      scannerModal.classList.add('open');
      scannerModal.setAttribute('aria-hidden', 'false');
      setCameraHelpExpanded(false);
      if (scannerInput) {
        scannerInput.value = '';
        scannerInput.focus();
      }
      startCameraScanner();
    }

    function closeScanner() {
      if (!scannerModal) return;
      stopCameraScanner();
      if (scannerInput) { scannerInput.blur(); scannerInput.value = ''; }
      scannerModal.classList.remove('open');
      scannerModal.setAttribute('aria-hidden', 'true');
      restoreModalTriggerFocus();
    }

    function handleScannedCode(raw) {
      const code = String(raw || '').trim();
      if (!code) return;
      document.getElementById('barcode').value = code;
      closeScanner();
      document.getElementById('quantity').focus();
    }

    if (scannerInput) {
      scannerInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          const v = scannerInput.value.trim();
          scannerInput.value = '';
          handleScannedCode(v);
        }
      });
      scannerInput.addEventListener('paste', function () { setTimeout(() => { const v = scannerInput.value.trim(); if (v) { scannerInput.value = ''; handleScannedCode(v); } }, 50); });
    }




    function renderInventoryTab() {
      const search = searchInput.value.trim().toLowerCase();
      const filtered = parts.filter(part => {
        const haystack = `${part.name}`.toLowerCase();
        return haystack.includes(search);
      });

      inventoryBody.innerHTML = '';
      if (!filtered.length) {
        inventoryBody.innerHTML = '<tr><td colspan="7" class="empty">No matching parts found.</td></tr>';
      } else {
        filtered.forEach(part => {
          const status = getStatus(part);
          inventoryBody.insertAdjacentHTML('beforeend', `
            <tr>
              <td>${part.image ? `<img src="${part.image}" alt="${escapeHtml(part.name)}" class="image-thumb" data-action="preview" />` : '—'}</td>
              <td><strong>${escapeHtml(part.name)}</strong></td>
              <td>${escapeHtml(part.barcode || '')}</td>
              <td>${part.quantity}</td>
              <td>${part.minstock}</td>
              <td><span class="status ${status.className}">${status.label}</span></td>
              <td>
                <div class="actions" style="margin:0; gap: 0.25rem; align-items: center; flex-wrap: nowrap;">
                  <button class="secondary" type="button" data-action="decrease" data-id="${part.id}">-</button>
                  <button class="secondary" type="button" data-action="increase" data-id="${part.id}">+</button>
                  <div class="options-wrapper">
                    <button class="secondary options-toggle" type="button" data-action="options-toggle" aria-label="More actions">⋯</button>
                    <div class="options-menu" role="menu">
                      <button class="secondary" type="button" data-action="adjust-multiple" data-id="${part.id}">Add/subtract multiple</button>
                      <button class="secondary" type="button" data-action="edit" data-id="${part.id}">Edit</button>
                      <button class="danger" type="button" data-action="delete" data-id="${part.id}">Delete</button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          `);
        });
      }

      reorderSummary.innerHTML = '';
      if (tableScroll) {
        tableScroll.classList.toggle('no-scroll', filtered.length === 1);
      }

      document.getElementById('totalItems').textContent = parts.length;
      const lowStockCount = parts.filter(part => {
        const status = getStatus(part).label;
        return status === 'Low stock' || status === 'Reorder' || status === 'Out of stock';
      }).length;
      document.getElementById('lowStockCount').textContent = lowStockCount;
      document.getElementById('reorderCount').textContent = lowStockCount;
    }

    function render() {
      renderInventoryTab();
      renderTeamTab();
      renderDocsTab();
    }

    function escapeHtml(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatFileSize(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
      const units = ['B', 'KB', 'MB', 'GB'];
      const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
      const value = bytes / (1024 ** exponent);
      return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
    }

    function getLinkDisplayName(link) {
      if (!link) return 'Shared document link';
      try {
        const url = new URL(link);
        const hostname = url.hostname.replace(/^www\./, '');
        const pathname = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
        const title = url.searchParams.get('title') || '';

        if (title) return title;

        if (hostname.includes('docs.google.com') || hostname.includes('drive.google.com') || hostname.includes('spreadsheets.google.com')) {
          const rawTitle = url.searchParams.get('title') || url.searchParams.get('name') || '';
          if (rawTitle) return rawTitle;

          const action = pathname[pathname.length - 1] || '';
          const hasSpreadsheetPath = pathname.includes('spreadsheets');
          const hasDocumentPath = pathname.includes('document');
          const hasPresentationPath = pathname.includes('presentation');
          const hasFormPath = pathname.includes('forms');

          const pathSegments = pathname.filter(segment => segment && !['edit', 'view', 'copy', 'pubhtml', 'd', 'u', 'e'].includes(segment.toLowerCase()));
          const meaningfulPath = pathSegments[pathSegments.length - 1] || '';
          if (meaningfulPath && !/^[a-z0-9]{10,}$/i.test(meaningfulPath)) {
            const label = meaningfulPath.replace(/[-_]+/g, ' ').trim();
            if (label) return label;
          }

          if (hasSpreadsheetPath) {
            return 'Google Sheet';
          }
          if (hasDocumentPath) {
            return 'Google Doc';
          }
          if (hasPresentationPath) {
            return 'Google Slide';
          }
          if (hasFormPath) {
            return 'Google Form';
          }

          const id = pathname[pathname.length - 1] || '';
          if (id && !/^[0-9]+$/.test(id) && !['edit', 'view', 'copy', 'pubhtml'].includes(id.toLowerCase())) {
            const label = id.replace(/[-_]+/g, ' ').trim();
            return label || hostname;
          }
          return hostname;
        }

        const lastPath = pathname[pathname.length - 1] || '';
        if (lastPath) {
          const genericPathLabels = new Set(['edit', 'view', 'copy', 'download', 'open', 'share', 'shared', 'home', 'index', 'file', 'files', 'link', 'links']);
          const label = lastPath.replace(/[-_]+/g, ' ').replace(/\.(doc|docx|pdf|xls|xlsx|csv|txt|json|xml)$/i, '').trim();
          if (label && !genericPathLabels.has(label.toLowerCase())) {
            return `${hostname}: ${label}`;
          }
        }
        return hostname;
      } catch (error) {
        return link;
      }
    }

    function getDocDisplayName(doc) {
      if (!doc || typeof doc !== 'object') return 'Document';

      const rawName = String(doc.name || '').trim();
      const genericNames = ['edit', 'shared document link', 'document', ''];

      if (rawName && !genericNames.includes(rawName.toLowerCase())) {
        return rawName;
      }

      const candidateLinks = [doc.link, doc.publicUrl, doc.dataUrl].filter(Boolean);
      for (const candidateLink of candidateLinks) {
        const derivedName = getLinkDisplayName(candidateLink);
        const normalizedDerived = String(derivedName || '').trim();
        if (normalizedDerived && !genericNames.includes(normalizedDerived.toLowerCase())) {
          return normalizedDerived;
        }
      }

      return 'Document';
    }

    function normalizeDocRecord(doc) {
      if (!doc || typeof doc !== 'object') return doc;
      const normalized = { ...doc };
      normalized.name = getDocDisplayName(normalized);
      return normalized;
    }

    function loadUploadedDocs() {
      try {
        const saved = localStorage.getItem(docsStorageKey);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        const docs = Array.isArray(parsed) ? parsed : [];
        return docs.map(normalizeDocRecord);
      } catch (error) {
        console.warn('Could not load uploaded documents:', error);
        return [];
      }
    }

    function saveUploadedDocs() {
      localStorage.setItem(docsStorageKey, JSON.stringify(uploadedDocs));
    }

    async function loadDocsFromSupabase() {
      if (!supabaseClient) return [];

      try {
        const { data, error } = await withSupabaseRetry('load documents', () => supabaseClient
          .from(docsTableName)
          .select('*')
          .order('created_at', { ascending: false }));

        if (error) {
          throw error;
        }

        const docs = [];

        for (const item of data || []) {
          const rawName = String(item.name || '').trim();
          const record = {
            id: item.id,
            name: item.name,
            type: item.type || 'file',
            size: item.size || 0,
            note: item.note || '',
            uploadedAt: item.created_at,
            dataUrl: item.data_url || '',
            publicUrl: item.public_url || '',
            link: item.link || '',
            storagePath: item.storage_path || '',
            storageBucket: item.storage_bucket || ''
          };
          const normalizedRecord = normalizeDocRecord(record);

          const correctedName = getDocDisplayName(record);
          if (correctedName && correctedName !== rawName && correctedName !== 'Document') {
            try {
              await withSupabaseRetry('rewrite legacy document name', () => supabaseClient.from(docsTableName).update({ name: correctedName }).eq('id', record.id));
              normalizedRecord.name = correctedName;
            } catch (updateError) {
              console.warn('Could not rewrite legacy document name:', updateError);
            }
          }

          docs.push(normalizedRecord);
        }

        return docs;
      } catch (error) {
        console.warn('Could not load documents from Supabase:', error);
        return [];
      }
    }

    async function saveDocToSupabase(record) {
      if (!supabaseClient) return null;
      if (!supabaseAuthReady) {
        authStatusMessage = 'Document save skipped because Supabase auth is not ready. The document will stay local until RLS/auth is fixed.';
        updateSupabaseStatusNotice();
        return null;
      }

      try {
        const payload = {
          id: record.id,
          name: record.name,
          type: record.type || 'file',
          size: record.size || 0,
          note: record.note || '',
          created_at: record.uploadedAt,
          data_url: record.dataUrl || '',
          public_url: record.publicUrl || '',
          link: record.link || '',
          storage_path: record.storagePath || '',
          storage_bucket: record.storageBucket || ''
        };

        const { data, error } = await withSupabaseRetry('save document record', () => supabaseClient
          .from(docsTableName)
          .insert([payload])
          .select()
          .single());

        if (error) {
          console.error('Supabase document insert failed:', error);
          if (error?.code === '42501' || /row-level security|permission denied/i.test(error?.message || '')) {
            authStatusMessage = 'Document save was blocked by Supabase RLS. Add a policy that allows authenticated users to insert into inventory_documents.';
          } else {
            authStatusMessage = `Document save failed: ${error.message || 'unknown error'}`;
          }
          updateSupabaseStatusNotice();
          throw error;
        }

        return data ? {
          id: data.id,
          name: data.name,
          type: data.type || 'file',
          size: data.size || 0,
          note: data.note || '',
          uploadedAt: data.created_at,
          dataUrl: data.data_url || '',
          publicUrl: data.public_url || '',
          link: data.link || '',
          storagePath: data.storage_path || '',
          storageBucket: data.storage_bucket || ''
        } : null;
      } catch (error) {
        console.warn('Could not save document to Supabase:', error);
        return null;
      }
    }

    async function removeDocFromSupabase(docId) {
      if (!supabaseClient) return;

      try {
        await withSupabaseRetry('delete document record', () => supabaseClient.from(docsTableName).delete().eq('id', docId));
      } catch (error) {
        console.warn('Could not remove document from Supabase:', error);
      }
    }

    function subscribeToDocs() {
      if (!supabaseClient || docsSubscription) return;

      docsSubscription = supabaseClient
        .channel('inventory-docs-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: docsTableName }, () => {
          refreshDocsFromSupabase();
        })
        .subscribe();
    }

    async function refreshDocsFromSupabase() {
      const docs = await loadDocsFromSupabase();
      uploadedDocs = docs;
      saveUploadedDocs();
      renderDocsTab();
    }

    function readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }

    async function uploadDocumentToSupabase(file, note, dataUrl) {
      if (!supabaseClient || !supabaseClient.storage) {
        return null;
      }
      if (!supabaseAuthReady) {
        authStatusMessage = 'File upload skipped because Supabase auth is not ready. The file will stay local until RLS/auth is fixed.';
        updateSupabaseStatusNotice();
        return null;
      }

      const safeName = String(file.name || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${Date.now()}-${safeName}`;

      try {
        const { data, error } = await withSupabaseRetry('upload document to storage', () => supabaseClient.storage
          .from(supabaseDocsBucket)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream'
          }));

        if (error) {
          throw error;
        }

        const uploadedPath = data?.path || storagePath;
        const publicUrlResult = supabaseClient.storage.from(supabaseDocsBucket).getPublicUrl(uploadedPath);

        return {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          note,
          uploadedAt: new Date().toISOString(),
          storagePath: uploadedPath,
          storageBucket: supabaseDocsBucket,
          publicUrl: publicUrlResult?.data?.publicUrl || '',
          dataUrl: dataUrl || ''
        };
      } catch (error) {
        console.warn('Could not upload file to Supabase Storage:', error);
        return null;
      }
    }

    async function removeDocumentFromSupabase(doc) {
      if (!supabaseClient || !supabaseClient.storage || !doc?.storagePath) {
        return;
      }

      try {
        await withSupabaseRetry('remove document from storage', () => supabaseClient.storage.from(supabaseDocsBucket).remove([doc.storagePath]));
      } catch (error) {
        console.warn('Could not remove stored document from Supabase:', error);
      }
    }

    function renderDocsTab() {
      if (!docUploadList) return;
      const sortedDocs = uploadedDocs.slice().sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      if (!sortedDocs.length) {
        docUploadList.innerHTML = '<div class="empty">No files uploaded yet. Add spreadsheets, forms, or other inventory documents here.</div>';
        return;
      }

      docUploadList.innerHTML = sortedDocs.map(doc => {
        const fileHref = doc.publicUrl || doc.dataUrl || doc.link || '';
        const normalizedDoc = normalizeDocRecord(doc);
        const explicitDisplayName = String(doc.displayName || doc.name || '').trim();
        const title = explicitDisplayName || String(normalizedDoc.name || getDocDisplayName(normalizedDoc) || 'Document').trim();
        const note = doc.note ? escapeHtml(doc.note) : '';
        const safeTitle = title && title !== 'Document' ? title : 'Document';
        return `
          <div class="doc-upload-item">
            <div class="doc-upload-title">${escapeHtml(safeTitle)}</div>
            ${note ? `<div class="doc-upload-meta">${note}</div>` : ''}
            <div class="doc-upload-actions">
              ${fileHref ? `<a class="link-action" href="${escapeHtml(fileHref)}" target="_blank" rel="noopener noreferrer" download="${escapeHtml(safeTitle)}">Open</a>` : ''}
              <button class="danger" type="button" data-action="remove-doc" data-id="${doc.id}">Remove</button>
            </div>
          </div>
        `;
      }).join('');
    }

    function resetForm() {
      partForm.reset();
      document.getElementById('quantity').value = 0;
      document.getElementById('minStock').value = 1;
      imageInput.value = '';
      selectedImageData = null;
      updateImagePreview(null);
      editingId = null;
      submitButton.textContent = 'Add part';
    }

    partForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const formData = {
        name: document.getElementById('name').value.trim(),
        barcode: document.getElementById('barcode').value.trim(),
        quantity: Number(document.getElementById('quantity').value),
        minstock: Number(document.getElementById('minStock').value),
        image: selectedImageData
      };

      if (!formData.name) {
        alert('Please enter a part name.');
        return;
      }

      if (editingId) {
        updatePart(editingId, formData).then(success => {
          if (success) {
            render();
            resetForm();
          }
        });
      } else {
        addPart(formData).then(success => {
          if (success) {
            render();
            resetForm();
          }
        });
      }
    });

    cancelEditButton.addEventListener('click', resetForm);
    const debouncedInventoryRender = debounce(renderInventoryTab, 180);
    searchInput.addEventListener('input', debouncedInventoryRender);
    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        switchTab(button.dataset.tab);
      });
    });

    if (myTeamFilterInput) {
      myTeamFilterInput.addEventListener('input', renderTeamTab);
    }

    if (toggleHistoryButton) {
      toggleHistoryButton.addEventListener('click', function () {
        historyPanelOpen = !historyPanelOpen;
        renderTeamTab();
      });
    }

    if (cancelSignOutEditButton) {
      cancelSignOutEditButton.addEventListener('click', resetSignOutForm);
    }

    if (fromTeamInput && myTeamFilterInput) {
      fromTeamInput.addEventListener('input', function () {
        if (!myTeamFilterInput.value.trim()) {
          myTeamFilterInput.value = fromTeamInput.value;
          renderTeamTab();
        }
      });
    }

    if (signOutForm) {
      signOutForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const toolName = transferToolNameInput.value.trim();
        const fromTeam = fromTeamInput.value.trim();
        const toTeam = toTeamInput.value.trim();
        const quantity = Number(transferQtyInput.value);
        const dueDate = dueDateInput.value || null;
        const recipientName = recipientNameInput.value.trim();
        const notes = transferNotesInput.value.trim();

        if (!toolName) {
          alert('Please enter a tool name to sign out.');
          return;
        }
        if (!fromTeam || !toTeam) {
          alert('Please enter both team names.');
          return;
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
          alert('Please enter a valid quantity greater than zero.');
          return;
        }
        if (fromTeam.toLowerCase() === toTeam.toLowerCase()) {
          alert('Choose a different receiving team.');
          return;
        }

        if (editingSignOutId) {
          const updatedRecord = await updateSignOutRecord(editingSignOutId, {
            partName: toolName,
            quantity,
            fromTeam,
            toTeam,
            dueDate,
            recipientName,
            notes
          });

          if (!updatedRecord) {
            alert('Sign-out record could not be updated in Supabase.');
            return;
          }

          if (!myTeamFilterInput.value.trim()) {
            myTeamFilterInput.value = fromTeam;
          }

          resetSignOutForm();
          render();
          return;
        }

        const createdRecord = await createSignOutRecord({
            id: crypto.randomUUID(),
            partId: null,
            partName: toolName,
            quantity,
            fromTeam,
            toTeam,
            signedOutAt: new Date().toISOString(),
            dueDate,
            recipientName,
            notes,
            status: 'out',
            returnedAt: null
          });

        if (!createdRecord) {
          alert('Sign-out record could not be saved to Supabase.');
          return;
        }

        signOutRecords.unshift(createdRecord);

        resetSignOutForm();
        fromTeamInput.value = fromTeam;
        if (!myTeamFilterInput.value.trim()) {
          myTeamFilterInput.value = fromTeam;
        }

        render();
      });
    }

    if (authForm) {
      authForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = authEmailInput?.value.trim() || '';
        const password = authPasswordInput?.value.trim() || '';
        const ok = await ensureSupabaseSession(email, password);
        if (ok) {
          await ensureSupabaseSchema();
          [parts, signOutRecords, uploadedDocs] = await Promise.all([
            loadParts(),
            loadSignOutRecords(),
            loadDocsFromSupabase()
          ]);
          saveUploadedDocs();
          subscribeToDocs();
          if (myTeamFilterInput && !myTeamFilterInput.value.trim()) {
            myTeamFilterInput.value = fromTeamInput?.value.trim() || 'VULTR';
          }
          render();
        }
      });
    }

    if (docUploadForm) {
      docUploadForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const files = Array.from(docUploadInput?.files || []);
        const note = docNotesInput?.value.trim() || '';
        const customName = docNameInput?.value.trim() || '';
        const linkValue = docLinkInput?.value.trim() || '';

        if (!files.length && !linkValue) {
          alert('Please choose a file or paste a link.');
          return;
        }

        for (const file of files) {
          try {
            let fileForUpload = file;
            let dataUrl = '';

            if (String(file.type || '').startsWith('image/')) {
              try {
                const optimized = await optimizeImageFileForStorage(file, {
                  maxWidth: 1920,
                  maxHeight: 1920,
                  quality: 0.8
                });
                fileForUpload = optimized.optimizedFile || file;
                dataUrl = optimized.dataUrl || '';
              } catch (optimizeError) {
                console.warn('Image optimization failed for uploaded document, using original image.', optimizeError);
                dataUrl = await readFileAsDataUrl(file);
              }
            } else {
              dataUrl = await readFileAsDataUrl(file);
            }

            const uploadedRecord = await uploadDocumentToSupabase(fileForUpload, note, dataUrl);
            if (uploadedRecord) {
              uploadedDocs.unshift(uploadedRecord);
            } else {
              uploadedDocs.unshift({
                id: crypto.randomUUID(),
                name: fileForUpload.name,
                type: fileForUpload.type || 'application/octet-stream',
                size: fileForUpload.size,
                note,
                uploadedAt: new Date().toISOString(),
                dataUrl
              });
            }
          } catch (error) {
            console.warn('Could not read uploaded file:', error);
          }
        }

        if (linkValue) {
          const displayName = customName || getLinkDisplayName(linkValue);
          const record = {
            id: crypto.randomUUID(),
            name: displayName,
            type: 'link',
            size: 0,
            note,
            uploadedAt: new Date().toISOString(),
            link: linkValue
          };
          const savedRecord = supabaseClient ? await saveDocToSupabase(record) : null;
          const finalRecord = savedRecord || record;
          finalRecord.name = displayName;
          finalRecord.link = linkValue;
          finalRecord.displayName = displayName;
          uploadedDocs.unshift(finalRecord);
          if (!savedRecord && supabaseClient) {
            console.warn('Link was not saved to Supabase. Check the table RLS policies.');
          }
        }

        saveUploadedDocs();
        docUploadForm.reset();
        if (docNameInput) docNameInput.value = '';
        if (docNotesInput) docNotesInput.value = '';
        if (docLinkInput) docLinkInput.value = '';
        renderDocsTab();
      });
    }

    if (docUploadList) {
      docUploadList.addEventListener('click', async function (event) {
        const button = event.target.closest('button[data-action="remove-doc"]');
        if (!button) return;
        const id = button.dataset.id;
        const docToRemove = uploadedDocs.find(item => item.id === id);
        if (docToRemove) {
          await removeDocumentFromSupabase(docToRemove);
          if (supabaseClient) {
            await removeDocFromSupabase(docToRemove.id);
          }
        }
        uploadedDocs = uploadedDocs.filter(item => item.id !== id);
        saveUploadedDocs();
        renderDocsTab();
      });
    }

    if (signOutBody) {
      signOutBody.addEventListener('click', async function (event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.dataset.action;

        if (action === 'options-toggle') {
          const wrapper = button.closest('.options-wrapper');
          const menu = wrapper && wrapper.querySelector('.options-menu');
          if (!menu) return;
          const shouldOpen = !menu.classList.contains('open');
          closeAllOptionMenus();
          if (shouldOpen) {
            menu.classList.add('open');
          }
          return;
        }

        const recordId = button.dataset.id;
        const record = signOutRecords.find(item => item.id === recordId);
        if (!record) return;

        if (action === 'edit-signout') {
          if (record.status === 'returned') return;
          startSignOutEdit(record);
          return;
        }

        if (action === 'transfer') {
          if (record.status === 'returned' || record.status === 'transferred') {
            return;
          }

          const transferredAt = new Date().toISOString();
          const markedTransferred = await markSignOutTransferred(record.id, transferredAt);
          if (!markedTransferred.success) {
            alert(`Could not update sign-out status in Supabase.\n${markedTransferred.error}`);
            return;
          }

          render();
          return;
        }

        if (action !== 'return' || record.status === 'returned' || record.status === 'transferred') {
          return;
        }

        const returnedAt = new Date().toISOString();

        const markedReturned = await markSignOutReturned(record.id, returnedAt);
        if (!markedReturned) {
          alert('Could not update sign-out status in Supabase.');
          return;
        }

        render();
      });
    }

    function closeAllOptionMenus() {
      document.querySelectorAll('.options-menu.open').forEach(menu => menu.classList.remove('open'));
    }

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.options-wrapper')) {
        closeAllOptionMenus();
      }
    });

    inventoryBody.addEventListener('click', function (event) {
      const previewImage = event.target.closest('img[data-action="preview"]');
      if (previewImage) {
        openImageModal(previewImage.src, previewImage.alt);
        return;
      }

      const button = event.target.closest('button');
      if (!button) return;
      const { action, id } = button.dataset;

      if (action === 'increase') {
        adjustQuantity(id, 1);
        return;
      }

      if (action === 'decrease') {
        adjustQuantity(id, -1);
        return;
      }

      if (action === 'adjust-multiple') {
        adjustQuantityMultiple(id);
        return;
      }

      if (action === 'options-toggle') {
        const wrapper = button.closest('.options-wrapper');
        const menu = wrapper && wrapper.querySelector('.options-menu');
        if (menu) {
          menu.classList.toggle('open');
        }
        return;
      }

      if (action === 'edit') {
        const part = parts.find(item => item.id === id);
        if (!part) return;
        editingId = part.id;
        document.getElementById('partId').value = part.id;
        document.getElementById('name').value = part.name;
        document.getElementById('barcode').value = part.barcode || '';
        document.getElementById('quantity').value = part.quantity;
        document.getElementById('minStock').value = part.minstock;
        selectedImageData = part.image || null;
        updateImagePreview(selectedImageData);
        imageInput.value = '';
        submitButton.textContent = 'Update part';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      if (action === 'delete') {
        const confirmDelete = window.confirm('Delete this part from inventory?');
        if (!confirmDelete) return;
        deletePart(id).then(success => {
          if (success) {
            render();
          }
        });
      }
    });

    // Initialize the app
    (async () => {
      const initStart = performance.now();
      setAuthUiVisible(true, 'Connecting to VULTR Inventory…');
      await waitForSupabase();
      logPerf('Supabase client wait complete', initStart);
      if (authEmailInput && !authEmailInput.value) {
        authEmailInput.value = SUPABASE_AUTH_EMAIL || '';
      }
      if (authPasswordInput && !authPasswordInput.value) {
        authPasswordInput.value = SUPABASE_AUTH_PASSWORD || '';
      }

      const authReady = await initializeSupabaseAuth();
      logPerf('Supabase auth initialization complete', initStart);
      updateSupabaseStatusNotice();

      if (!authReady) {
        parts = [];
        signOutRecords = [];
        uploadedDocs = loadUploadedDocs();
        render();
        return;
      }

      const schemaReady = await ensureSupabaseSchema();
      if (!schemaReady) {
        authStatusMessage = 'Supabase is authenticated.';
        updateSupabaseStatusNotice();
      }

      [parts, signOutRecords, uploadedDocs] = await Promise.all([
        loadParts(),
        loadSignOutRecords(),
        loadDocsFromSupabase()
      ]);
      saveUploadedDocs();
      subscribeToDocs();
      if (myTeamFilterInput && !myTeamFilterInput.value.trim() && fromTeamInput) {
        myTeamFilterInput.value = fromTeamInput.value.trim() || 'VULTR';
      }
      render();
      logPerf('Initial render complete', initStart);
    })();
