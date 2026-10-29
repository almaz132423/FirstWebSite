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

  /**
   * Чтение изображения с устройства и сжатие через canvas.
   * Нужно, чтобы фото с телефона (5–10 МБ) не переполнило localStorage.
   *   options.maxSize  — максимальная сторона в px (по умолчанию 1400)
   *   options.png      — true: сохранить прозрачность (для логотипа), иначе JPEG
   * Возвращает Promise<string> с data:-URL.
   */
  function readImageFile(file, options) {
    options = options || {};
    var maxSize = options.maxSize || 1400;
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) {
        reject(new Error('Выберите файл изображения (JPG, PNG, WebP, SVG)'));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Не удалось прочитать файл')); };
      reader.onload = function () {
        // SVG векторный — сжимать не нужно, но ограничим размер
        if (file.type === 'image/svg+xml') {
          if (reader.result.length > 200000) {
            reject(new Error('SVG слишком большой (больше ~150 КБ)'));
          } else {
            resolve(reader.result);
          }
          return;
        }
        var img = new Image();
        img.onerror = function () { reject(new Error('Не удалось открыть изображение')); };
        img.onload = function () {
          var ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * ratio));
          var h = Math.max(1, Math.round(img.height * ratio));
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          if (!options.png) {
            ctx.fillStyle = '#ffffff'; // под JPEG нет прозрачности
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(options.png
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  return { $, $$, escapeHtml, toast, copyText, prefersReducedMotion, newId, readImageFile };
})();
