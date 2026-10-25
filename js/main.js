/* =====================================================================
 * main.js — логика витрины (index.html).
 *
 * Читает конфигурацию бизнеса (storage.js), рендерит страницу и
 * управляет формой записи: динамические поля, валидация, генерация
 * сообщения и передача его в мессенджеры.
 * ===================================================================== */

(function () {
  'use strict';

  var $ = AppUI.$;
  var $$ = AppUI.$$;
  var escapeHtml = AppUI.escapeHtml;
  var toast = AppUI.toast;
  var copyText = AppUI.copyText;
  var reducedMotion = AppUI.prefersReducedMotion();

  var cfg = BusinessStorage.load();

  /* ------------------------------------------------------------------
   * 1. Дизайн-токены из конфигурации и SEO
   * ------------------------------------------------------------------ */

  function applyDesign() {
    var colors = (cfg.design && cfg.design.colors) || {};
    var root = document.documentElement;
    var map = {
      '--c-primary': colors.primary,
      '--c-primary-dark': colors.primaryDark,
      '--c-accent': colors.accent,
      '--c-bg': colors.bg,
      '--c-surface': colors.surface,
      '--c-ink': colors.ink,
      '--c-muted': colors.muted,
      '--c-line': colors.line
    };
    Object.keys(map).forEach(function (name) {
      if (map[name]) root.style.setProperty(name, map[name]);
    });
  }

  function applySeo() {
    var seo = cfg.seo || {};
    if (seo.title) document.title = seo.title;
    $$('[data-seo="title"]').forEach(function (el) {
      if (seo.title) el.setAttribute('content', seo.title);
    });
    $$('[data-seo="description"]').forEach(function (el) {
      if (seo.description) el.setAttribute('content', seo.description);
    });
  }

  /* ------------------------------------------------------------------
   * 2. Рендер статичных блоков
   * ------------------------------------------------------------------ */

  function setText(selector, value) {
    var el = $(selector);
    if (el && value) el.textContent = value;
  }

  function renderStatic() {
    var b = cfg.business || {};
    var c = cfg.contacts || {};

    setText('#brand-name', b.name);
    setText('#hero-text', b.tagline);
    setText('#hero-card-title', b.name);
    setText('#hero-badge', (cfg.design && cfg.design.heroBadge) || '');
    setText('#hero-hours', c.hours);
    setText('#trust-hours', c.hours);
    setText('#about-text', b.description);

    // Телефон: ссылка по формату tel:+70000000000, текст по phoneDisplay
    var phoneHref = 'tel:' + String(c.phone || '').replace(/[^\d+]/g, '');
    var phoneText = c.phoneDisplay || c.phone || '';
    ['#header-phone', '#contact-phone', '#footer-phone'].forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      el.textContent = phoneText;
      if (el.tagName === 'A') el.setAttribute('href', phoneHref);
    });

    setText('#contact-address', c.address);
    setText('#contact-hours', c.hours);
    setText('#footer-address', c.address);
    setText('#footer-hours', c.hours);
    setText('#footer-brand', b.name);
    setText('#footer-copy', '© ' + new Date().getFullYear() + ' ' + (b.name || ''));

    // Маршрут — показываем только если адрес задан в конфигурации
    var mapLink = $('#contact-map');
    if (mapLink && c.mapUrl) {
      mapLink.hidden = false;
      mapLink.setAttribute('href', c.mapUrl);
    }

    // Преимущества
    var features = $('#about-features');
    if (features && Array.isArray(b.features)) {
      features.innerHTML = b.features
        .map(function (f) {
          return (
            '<li><span class="check" aria-hidden="true">✓</span>' +
            '<span class="text">' + escapeHtml(f) + '</span></li>'
          );
        })
        .join('');
    }
  }

  /* ------------------------------------------------------------------
   * 3. Рендер карточек услуг
   * ------------------------------------------------------------------ */

  function serviceMedia(service) {
    if (service.image) {
      return (
        '<img src="' + escapeHtml(service.image) + '" ' +
        'alt="' + escapeHtml(service.imageAlt || service.name) + '" loading="lazy" />'
      );
    }
    return (
      '<span class="placeholder" aria-hidden="true">' +
      '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
      '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/>' +
      '<path d="M3 17l5-4 4 3 5-5 4 4"/></svg></span>'
    );
  }

  function renderServices() {
    var grid = $('#services-grid');
    if (!grid) return;
    var services = cfg.services || [];

    if (!services.length) {
      grid.innerHTML =
        '<p class="empty-state" style="grid-column:1/-1">Услуги скоро появятся. Добавьте их в админ-панели.</p>';
      return;
    }

    grid.innerHTML = services
      .map(function (s, index) {
        var meta =
          '<span class="badge badge--price">' + escapeHtml(s.price || 'Уточняйте') + '</span>';
        var duration = s.duration
          ? '<span class="service-card__duration">⏱ ' + escapeHtml(s.duration) + '</span>'
          : '<span></span>';
        return (
          '<article class="service-card" data-service-card="' + index + '">' +
            '<div class="service-card__media">' + serviceMedia(s) + '</div>' +
            '<div class="service-card__meta">' +
              '<h3>' + escapeHtml(s.name) + '</h3>' + meta +
            '</div>' +
            '<p class="service-card__desc">' + escapeHtml(s.description || '') + '</p>' +
            '<div class="service-card__footer">' +
              duration +
              '<button class="btn btn--primary btn--sm" type="button" data-booking ' +
                'data-service="' + escapeHtml(s.id) + '">Записаться</button>' +
            '</div>' +
          '</article>'
        );
      })
      .join('');

    // Появление карточек при прокрутке (пропускаем, если анимации отключены)
    if (window.IntersectionObserver && !reducedMotion && window.anime) {
      var cards = $$('#services-grid .service-card');
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            anime({
              targets: entry.target,
              opacity: [0, 1],
              translateY: [24, 0],
              duration: 480,
              easing: 'easeOutCubic'
            });
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12 }
      );
      cards.forEach(function (card) {
        card.style.opacity = '0';
        observer.observe(card);
      });
    }
  }

  /* ------------------------------------------------------------------
   * 4. Модальное окно и форма записи
   * ------------------------------------------------------------------ */

  var overlay = $('#booking-overlay');
  var form = $('#booking-form');
  var fieldsHost = $('#booking-fields');
  var preview = $('#booking-preview');
  var lastFocused = null;

  var MONTHS_RU = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];

  function formatDateRu(value) {
    // «2026-10-23» -> «23 октября 2026 года»
    var parts = String(value).split('-');
    if (parts.length !== 3) return value;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return value;
    return d.getDate() + ' ' + MONTHS_RU[d.getMonth()] + ' ' + d.getFullYear() + ' года';
  }

  function fieldValueDisplay(field) {
    var input = $('[name="' + field.id + '"]', fieldsHost);
    if (!input) return '';
    var value = input.value.trim();
    if (!value) return '';
    if (field.type === 'select' && field.source === 'services') {
      var service = (cfg.services || []).find(function (s) { return s.id === value; });
      return service ? service.name : value;
    }
    if (field.type === 'date') return formatDateRu(value);
    return value;
  }

  /** Сборка текста сообщения: приветствие + заполненные поля + закрытие. */
  function buildMessageText() {
    var message = cfg.booking.message || {};
    var lines = [];
    var greeting = message.greeting;
    if (greeting) lines.push(greeting);

    (cfg.booking.fields || []).forEach(function (field) {
      var value = fieldValueDisplay(field);
      if (!value) return; // пустые необязательные поля не попадают в текст
      lines.push(field.label + ': ' + value);
    });

    if (message.closing) lines.push(message.closing);
    return lines.join('\n');
  }

  function validateField(field) {
    var wrap = $('[data-field-wrap="' + field.id + '"]', fieldsHost);
    var input = $('[name="' + field.id + '"]', fieldsHost);
    if (!wrap || !input) return true;
    var value = input.value.trim();
    var ok = true;
    var message = '';

    if (field.required && !value) {
      ok = false;
      message = 'Заполните это поле.';
    } else if (field.type === 'date' && value) {
      var d = new Date(value + 'T00:00:00');
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!isNaN(d.getTime()) && d < today) {
        ok = false;
        message = 'Дата не может быть в прошлом.';
      }
    }

    wrap.classList.toggle('is-invalid', !ok);
    var msgEl = $('.error-msg', wrap);
    if (msgEl) msgEl.textContent = message;
    return ok;
  }

  function validateAll() {
    var ok = true;
    (cfg.booking.fields || []).forEach(function (field) {
      if (!validateField(field)) ok = false;
    });
    return ok;
  }

  function buildField(field, preselectService) {
    var reqMark = field.required ? ' <span class="req" aria-hidden="true">*</span>' : '';
    var value = field.type === 'select' && preselectService ? preselectService : '';

    var control;
    if (field.type === 'textarea') {
      control =
        '<textarea name="' + escapeHtml(field.id) + '" placeholder="' + escapeHtml(field.placeholder || '') +
        '">' + escapeHtml(value) + '</textarea>';
    } else if (field.type === 'select') {
      var options = [];
      if (field.source === 'services') {
        options = (cfg.services || []).map(function (s) {
          var label = s.name + (s.price ? ' — ' + s.price : '');
          return (
            '<option value="' + escapeHtml(s.id) + '"' + (s.id === value ? ' selected' : '') + '>' +
            escapeHtml(label) + '</option>'
          );
        });
      }
      control =
        '<select name="' + escapeHtml(field.id) + '">' +
        '<option value="">— выберите —</option>' + options.join('') + '</select>';
    } else {
      var extra = '';
      if (field.type === 'date') {
        var today = new Date();
        var iso = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0');
        extra = ' min="' + iso + '"';
      }
      control =
        '<input type="' + escapeHtml(field.type || 'text') + '" name="' + escapeHtml(field.id) + '"' +
        ' placeholder="' + escapeHtml(field.placeholder || '') + '"' + extra +
        (value ? ' value="' + escapeHtml(value) + '"' : '') + '>';
    }

    return (
      '<div class="field" data-field-wrap="' + escapeHtml(field.id) + '">' +
        '<label for="field-' + escapeHtml(field.id) + '">' +
          escapeHtml(field.label) + reqMark +
        '</label>' +
        control.replace('<textarea', '<textarea id="field-' + escapeHtml(field.id) + '"')
               .replace('<select', '<select id="field-' + escapeHtml(field.id) + '"')
               .replace('<input', '<input id="field-' + escapeHtml(field.id) + '"') +
        '<p class="error-msg"></p>' +
      '</div>'
    );
  }

  function updatePreview() {
    preview.textContent = buildMessageText();
  }

  function openBooking(preselectService) {
    var booking = cfg.booking || {};
    $('#booking-title').textContent = booking.modalTitle || 'Оставить заявку';
    $('#booking-intro').textContent = booking.intro || '';
    fieldsHost.innerHTML = (booking.fields || [])
      .map(function (f) { return buildField(f, preselectService); })
      .join('');
    form.reset();
    updatePreview();
    $('#booking-note').hidden = true;

    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    var first = $('input, select, textarea', fieldsHost);
    if (first) first.focus();
  }

  function closeBooking() {
    overlay.classList.remove('is-open');
    setTimeout(function () { overlay.hidden = true; }, 200);
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  /* ------------------- Передача в мессенджеры ------------------- */

  function whatsappHref(text) {
    var m = cfg.messengers.whatsapp || {};
    var digits = String(m.phone || '').replace(/\D/g, '');
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text);
  }

  function telegramHref(text) {
    // Официальный механизм Telegram для передачи подготовленного текста.
    return 'https://t.me/share/url?url=&text=' + encodeURIComponent(text);
  }

  function maxHref(text) {
    var m = cfg.messengers.max || {};
    var tpl = m.linkTemplate || '';
    if (!tpl) return '';
    return tpl.replace(/\{text\}/g, encodeURIComponent(text));
  }

  function openMessenger(url, name) {
    if (!url) {
      toast('Ссылка ' + name + ' не настроена. Скопируйте текст сообщения.', 'error');
      return;
    }
    window.open(url, '_blank', 'noopener');
    $('#booking-note').hidden = false;
  }

  /* ------------------------------------------------------------------
   * 5. Анимации (Anime.js) — только если библиотека загрузилась
   * ------------------------------------------------------------------ */

  function runHeroAnimation() {
    if (!window.anime || reducedMotion) return;
    anime({
      targets: '.hero__content > *',
      translateY: [26, 0],
      opacity: [0, 1],
      delay: anime.stagger(90),
      duration: 640,
      easing: 'easeOutCubic'
    });
    anime({
      targets: '.hero__visual',
      translateY: [36, 0],
      opacity: [0, 1],
      duration: 720,
      delay: 220,
      easing: 'easeOutCubic'
    });
  }

  /* ------------------------------------------------------------------
   * 6. Данные из Google Таблицы (если настроен api.url)
   * ------------------------------------------------------------------ */

  function refreshMessengerButtons() {
    var wa = cfg.messengers.whatsapp || {};
    var tg = cfg.messengers.telegram || {};
    var mx = cfg.messengers.max || {};
    $('#send-whatsapp').hidden = !(wa.enabled && String(wa.phone || '').replace(/\D/g, ''));
    $('#send-telegram').hidden = !(tg.enabled !== false);
    $('#send-max').hidden = !(mx.enabled && mx.linkTemplate);
  }

  function loadFromSheet() {
    var url = (cfg.api && cfg.api.url || '').trim();
    if (!url) return;
    BusinessStorage.loadRemote(url)
      .then(function (model) {
        cfg = BusinessStorage.applySheetModel(cfg, model);
        BusinessStorage.save(cfg); // кэш, чтобы сайт работал без сети
        renderStatic();
        renderServices();
        refreshMessengerButtons();
      })
      .catch(function () {
        // Таблица недоступна — работаем на кэше из localStorage.
      });
  }

  /* ------------------------------------------------------------------
   * 7. События
   * ------------------------------------------------------------------ */

  function wireEvents() {
    // Открытие формы: кнопки «Записаться» (на карточке — с выбором услуги)
    $$('[data-booking]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openBooking(btn.getAttribute('data-service') || '');
      });
    });

    $$('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', closeBooking);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeBooking();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) closeBooking();
    });

    // Живая валидация и предпросмотр
    fieldsHost.addEventListener('input', function (e) {
      var wrap = e.target.closest('[data-field-wrap]');
      if (wrap) validateField({ id: wrap.getAttribute('data-field-wrap'), required: false });
      updatePreview();
    });
    fieldsHost.addEventListener('change', function (e) {
      var wrap = e.target.closest('[data-field-wrap]');
      if (wrap) {
        var field = (cfg.booking.fields || []).find(function (f) {
          return f.id === wrap.getAttribute('data-field-wrap');
        });
        if (field) validateField(field);
      }
      updatePreview();
    });

    // Мессенджеры
    $('#send-whatsapp').addEventListener('click', function () {
      if (!validateAll()) return;
      openMessenger(whatsappHref(buildMessageText()), 'WhatsApp');
    });
    $('#send-telegram').addEventListener('click', function () {
      if (!validateAll()) return;
      openMessenger(telegramHref(buildMessageText()), 'Telegram');
    });
    $('#send-max').addEventListener('click', function () {
      if (!validateAll()) return;
      openMessenger(maxHref(buildMessageText()), 'MAX');
    });
    $('#send-copy').addEventListener('click', function () {
      if (!validateAll()) return;
      copyText(buildMessageText()).then(function (ok) {
        toast(ok ? 'Сообщение скопировано' : 'Не удалось скопировать — выделите текст вручную', ok ? 'ok' : 'error');
      });
    });

    // Видимость кнопок мессенджеров по конфигурации
    refreshMessengerButtons();

    // Мобильное меню
    var burger = $('.burger');
    var nav = $('#site-nav');
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('#site-nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------
   * 8. Старт
   * ------------------------------------------------------------------ */

  function init() {
    applyDesign();
    applySeo();
    renderStatic();
    renderServices();
    wireEvents();
    runHeroAnimation();
    loadFromSheet();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
