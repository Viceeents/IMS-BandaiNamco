(() => {
  const initializeSplash = () => {
    const splash = document.getElementById('startup-splash');
    if (!splash) return;
    const loginPage = document.querySelector('.login-page');
    loginPage?.setAttribute('inert', '');
    let dismissed = false;
    let autoTimer;
    const revealCard = () => document.querySelector('.login-card')?.classList.add('reveal-card');
    const removeSplash = () => {
      splash.remove();
      loginPage?.removeAttribute('inert');
    };

    const finishSplash = (immediate = false) => {
      if (dismissed) return;
      dismissed = true;
      try { sessionStorage.setItem('splashPlayed', 'true'); } catch { /* Storage can be disabled in private contexts. */ }
      splash.removeEventListener('click', skipSplash);
      window.removeEventListener('keydown', skipOnKey);
      if (immediate) {
        splash.classList.add('fade-out');
        revealCard();
        window.setTimeout(removeSplash, 500);
        return;
      }
      splash.classList.add('to-dark');
      window.setTimeout(() => {
        if (!splash.isConnected) return;
        splash.classList.add('fade-out');
        revealCard();
      }, 850);
      window.setTimeout(removeSplash, 1750);
    };

    const skipSplash = () => {
      window.clearTimeout(autoTimer);
      finishSplash(true);
    };
    const skipOnKey = (event) => {
      if (!['Enter', ' ', 'Escape'].includes(event.key) || dismissed) return;
      event.preventDefault();
      skipSplash();
    };

    splash.addEventListener('click', skipSplash);
    window.addEventListener('keydown', skipOnKey);
    splash.focus();
    autoTimer = window.setTimeout(() => finishSplash(false), 2300);
  };

  const showBanner = (message = 'STOCK UPDATED') => {
    const banner = document.querySelector('.toast-banner');
    if (!banner) return;
    const title = banner.querySelector('strong');
    if (title) title.textContent = message;
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
    window.setTimeout(() => banner.classList.remove('show'), 2200);
  };

  const inventoryPage = () => {
    const rows = [...document.querySelectorAll('[data-item-row]')];
    const search = document.querySelector('#item-search');
    const tabs = [...document.querySelectorAll('[data-category]')];
    const emptyState = document.querySelector('#empty-list');
    const inspection = document.querySelector('#inspection');
    let activeCategory = 'all';
    let selectedRow = rows.find((row) => row.classList.contains('selected')) || rows[0];

    const renderItem = (row) => {
      if (!row) return;
      selectedRow = row;
      rows.forEach((item) => {
        const selected = item === row;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      const values = {
        'inspect-icon': row.dataset.icon,
        'inspect-name': row.dataset.name,
        'inspect-type': row.dataset.type,
        'inspect-sku': row.dataset.sku,
        'inspect-qty': row.dataset.qty,
        'inspect-price': `$${Number(row.dataset.price).toFixed(2)}`,
        'inspect-description': row.dataset.description,
        'inspect-supplier': row.dataset.supplier,
        'inspect-reorder': `${row.dataset.reorder} units`,
      };
      Object.entries(values).forEach(([id, value]) => {
        const target = document.getElementById(id);
        if (target) target.textContent = value ?? '';
      });
      const status = document.getElementById('inspect-status');
      if (status) {
        const quantity = Number(row.dataset.qty);
        const reorder = Number(row.dataset.reorder);
        status.textContent = quantity === 0 ? 'Out' : quantity <= reorder ? 'Low' : 'Ready';
        status.style.color = quantity <= reorder ? 'var(--crimson-light)' : 'var(--gold-bright)';
      }
      if (inspection) {
        inspection.classList.remove('page-enter');
        void inspection.offsetWidth;
        inspection.classList.add('page-enter');
      }
      const quickInput = document.querySelector('#quick-stock');
      if (quickInput) quickInput.value = row.dataset.qty;
    };

    const filterRows = () => {
      const term = (search?.value || '').trim().toLowerCase();
      let shown = 0;
      rows.forEach((row) => {
        const categoryMatches = activeCategory === 'all' || row.dataset.category === activeCategory;
        const searchMatches = `${row.dataset.name} ${row.dataset.sku} ${row.dataset.type}`.toLowerCase().includes(term);
        const visible = categoryMatches && searchMatches;
        row.hidden = !visible;
        if (visible) shown += 1;
      });
      if (emptyState) emptyState.style.display = shown ? 'none' : 'block';
      if (shown && selectedRow?.hidden) renderItem(rows.find((row) => !row.hidden));
    };

    rows.forEach((row) => row.addEventListener('click', () => renderItem(row)));
    search?.addEventListener('input', filterRows);
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      activeCategory = tab.dataset.category;
      tabs.forEach((item) => item.classList.toggle('active', item === tab));
      filterRows();
    }));

    document.querySelector('[data-toggle-quick-edit]')?.addEventListener('click', () => {
      const form = document.querySelector('[data-quick-edit]');
      if (!form) return;
      form.hidden = !form.hidden;
      if (!form.hidden) document.querySelector('#quick-stock')?.focus();
    });

    document.querySelector('[data-quick-edit]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!selectedRow) return;
      const quantity = Math.max(0, Number(document.querySelector('#quick-stock')?.value || 0));
      selectedRow.dataset.qty = String(quantity);
      const stockLabel = selectedRow.querySelector('.item-row-stock');
      const low = quantity <= Number(selectedRow.dataset.reorder);
      if (stockLabel) {
        stockLabel.textContent = quantity === 0 ? 'Out' : low ? `${quantity} left` : `${quantity} in stores`;
        stockLabel.classList.toggle('low', low);
      }
      renderItem(selectedRow);
      showBanner('STOCK UPDATED');
    });

    filterRows();
    renderItem(selectedRow);
  };

  const smithingTable = () => {
    const form = document.querySelector('[data-item-form]');
    if (!form) return;
    const updatePreview = (field) => {
      const name = field.dataset.preview;
      const output = document.querySelector(`[data-preview-output="${name}"]`);
      if (!output) return;
      let value = field.value;
      if (name === 'category') value = field.selectedOptions[0]?.textContent || 'Unmarked';
      if (name === 'quantity') value = `${Number(value || 0)} units`;
      if (name === 'reorder') value = `${Number(value || 0)} units`;
      if (name === 'price') value = `$${Number(value || 0).toFixed(2)}`;
      output.textContent = value || (name === 'name' ? 'Unnamed article' : 'Unmarked');
    };

    form.querySelectorAll('[data-preview]').forEach((field) => {
      field.addEventListener('input', () => updatePreview(field));
      field.addEventListener('change', () => updatePreview(field));
    });

    form.querySelectorAll('[data-quantity-step]').forEach((button) => button.addEventListener('click', () => {
      const input = document.querySelector('#quantity');
      if (!input) return;
      input.value = String(Math.max(0, Number(input.value || 0) + Number(button.dataset.quantityStep)));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }));

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      showBanner('STOCK UPDATED');
    });
  };

  const historyPage = () => {
    const rows = [...document.querySelectorAll('[data-history-row]')];
    const search = document.querySelector('[data-history-search]');
    search?.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();
      rows.forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(term); });
    });

    document.querySelector('[data-export-csv]')?.addEventListener('click', () => {
      const records = rows.map((row) => row.dataset.csv.split(','));
      const lines = [['Date', 'Article', 'SKU', 'Movement', 'Quantity', 'Reference', 'Recorded by'], ...records];
      const csv = lines.map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tarnished-ledger-stock-history.csv';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  };

  document.querySelector('[data-login-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.href = '../index.html';
  });

  if (document.body.dataset.page === 'login') {
    initializeSplash();
  }
  if (document.body.dataset.page === 'inventory') inventoryPage();
  if (document.body.dataset.page === 'item-form' || document.body.dataset.page === 'add-item') smithingTable();
  if (document.body.dataset.page === 'history') historyPage();
})();
