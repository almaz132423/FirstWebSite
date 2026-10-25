/* =====================================================================
 * common.js — общие утилиты для витрины и админ-панели.
 * Работает без сборщика и без зависимостей (обычный <script>).
 * ===================================================================== */

window.AppUI = (function () {
  'use strict';

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  /** Экранирование HTML — обязательно для всех данных из конфигурации. */
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (ch) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[ch];
    });
  }

  /** Небольшое всплывающее уведомление. */
  function toast(message, type) {
    type = type || 'ok';
    let host = $('.toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    const item = document.createElement('div');
    item.className = 'toast toast--' + type;
    item.textContent = message;
    host.appendChild(item);
    setTimeout(function () {
      item.classList.add('toast--hide');
      item.addEventListener('transitionend', function () { item.remove(); });
      // Страховка, если transition не отработал.
      setTimeout(function () { item.remove(); }, 400);
    }, 2600);
  }

  /** Копирование текста с запасным вариантом для старых браузеров. */
  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      /* переходим к запасному варианту */
    }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch (err) {
      return false;
    }
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  /** Генерация id услуги без внешних зависимостей. */
  function newId(prefix) {
    prefix = prefix || 'service';
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return prefix + '-' + window.crypto.randomUUID();
    }
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  return { $, $$, escapeHtml, toast, copyText, prefersReducedMotion, newId };
})();
