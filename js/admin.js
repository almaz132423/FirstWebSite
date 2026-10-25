/* =====================================================================
 * admin.js — логика локальной админ-панели (admin.html).
 *
 * Редактирует ту же конфигурацию, что и витрина:
 *   - настройки компании (settings в Google Таблице);
 *   - услуги: id, name, description, price, duration, image, imageAlt.
 * Сохранение — в localStorage, экспорт/импорт — JSON-файл.
 * ===================================================================== */

(function () {
  'use strict';

  var $ = AppUI.$;
  var $$ = AppUI.$$;
  var escapeHtml = AppUI.escapeHtml;
  var toast = AppUI.toast;
  var newId = AppUI.newId;

  var cfg = BusinessStorage.load();
  var dirty = false;

  /* ------------------------------------------------------------------
   * 1. Работа с вложенными путями вида "business.name"
   * ------------------------------------------------------------------ */

  function getByPath(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  }

  function setByPath(obj, path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (acc, key) {
      if (acc[key] == null || typeof acc[key] !== 'object') acc[key] = {};
      return acc[key];
    }, obj);
    target[last] = value;
  }

  /* ------------------------------------------------------------------
   * 2. Настройки
   * ------------------------------------------------------------------ */

  function renderSettings() {
    $$('[data-setting]').forEach(function (el) {
      var path = el.getAttribute('data-setting');

      // Особая обработка списка преимуществ (textarea, по одному на строку)
      if (path === 'business.features.list') {
        el.value = (getByPath(cfg, 'business.features') || []).join('\n');
        return;
      }

      var value = getByPath(cfg, path);
      if (el.type === 'checkbox') {
        el.checked = Boolean(value);
      } else {
        el.value = value == null ? '' : String(value);
      }
    });
  }

  function bindSettings() {
    $$('[data-setting]').forEach(function (el) {
      var path = el.getAttribute('data-setting');
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () {
        if (path === 'business.features.list') {
          cfg.business.features = el.value
            .split('\n')
            .map(function (line) { return line.trim(); })
            .filter(Boolean);
        } else if (el.type === 'checkbox') {
          setByPath(cfg, path, el.checked);
        } else {
          setByPath(cfg, path, el.value);
        }
        markDirty();
      });
    });
  }

  /* ------------------------------------------------------------------
   * 3. Услуги
   * ------------------------------------------------------------------ */

  function renderServices() {
    var tbody = $('#services-tbody');
    var empty = $('#services-empty');
    var services = cfg.services || [];

    empty.hidden = services.length > 0;
    tbody.innerHTML = services
      .map(function (s, index) {
        var thumb = s.image
          ? '<img class="thumb" src="' + escapeHtml(s.image) + '" alt="' + escapeHtml(s.imageAlt || s.name) + '" />'
          : '<span class="thumb thumb--empty">нет</span>';
        return (
          '<tr>' +
            '<td><span class="service-cell__name">' + escapeHtml(s.name) + '</span>' +
                '<span class="service-cell__id">' + escapeHtml(s.id) + '</span></td>' +
            '<td class="service-cell__muted">' + escapeHtml(s.description || '—') + '</td>' +
            '<td>' + escapeHtml(s.price || '—') + '</td>' +
            '<td>' + escapeHtml(s.duration || '—') + '</td>' +
            '<td>' + thumb + '</td>' +
            '<td><div class="row-actions" style="justify-content:flex-end">' +
              '<button class="btn btn--ghost btn--sm" type="button" data-edit="' + index + '">Изменить</button>' +
              '<button class="btn btn--danger btn--sm" type="button" data-delete="' + index + '">Удалить</button>' +
            '</div></td>' +
          '</tr>'
        );
      })
      .join('');

    $$('[data-edit]', tbody).forEach(function (btn) {
      btn.addEventListener('click', function () {
        openServiceModal(Number(btn.getAttribute('data-edit')));
      });
    });
    $$('[data-delete]', tbody).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var index = Number(btn.getAttribute('data-delete'));
        var service = cfg.services[index];
        if (service && window.confirm('Удалить услугу «' + service.name + '»?')) {
          cfg.services.splice(index, 1);
          renderServices();
          markDirty();
          toast('Услуга удалена (не забудьте сохранить)');
        }
      });
    });
  }

  /* ------------------- Модальное окно услуги ------------------- */

  var serviceOverlay = $('#service-overlay');
  var editingIndex = null;

  function openServiceModal(index) {
    editingIndex = index == null ? null : index;
    $('#service-modal-title').textContent = editingIndex == null ? 'Новая услуга' : 'Изменение услуги';

    var s = editingIndex == null ? {} : cfg.services[editingIndex] || {};
    $('#svc-id').value = editingIndex == null ? newId('service') : s.id;
    $('#svc-name').value = s.name || '';
    $('#svc-desc').value = s.description || '';
    $('#svc-price').value = s.price || '';
    $('#svc-duration').value = s.duration || '';
    $('#svc-image').value = s.image || '';
    $('#svc-image-alt').value = s.imageAlt || '';
    $('[data-field-wrap], #service-form .field').forEach(function (f) {
      f.classList.remove('is-invalid');
    });

    serviceOverlay.hidden = false;
    requestAnimationFrame(function () { serviceOverlay.classList.add('is-open'); });
    $('#svc-name').focus();
  }

  function closeServiceModal() {
    serviceOverlay.classList.remove('is-open');
    setTimeout(function () { serviceOverlay.hidden = true; }, 200);
  }

  function saveService() {
    var nameInput = $('#svc-name');
    var name = nameInput.value.trim();
    var wrap = nameInput.closest('.field');

    if (!name) {
      wrap.classList.add('is-invalid');
      $('.error-msg', wrap).textContent = 'Укажите название услуги.';
      nameInput.focus();
      return;
    }
    wrap.classList.remove('is-invalid');

    var service = {
      id: $('#svc-id').value || newId('service'),
      name: name,
      description: $('#svc-desc').value.trim(),
      price: $('#svc-price').value.trim(),
      duration: $('#svc-duration').value.trim(),
      image: $('#svc-image').value.trim(),
      imageAlt: $('#svc-image-alt').value.trim()
    };

    if (editingIndex == null) {
      cfg.services.push(service);
    } else {
      cfg.services[editingIndex] = service;
    }

    renderServices();
    closeServiceModal();
    markDirty();
    toast(editingIndex == null ? 'Услуга добавлена' : 'Услуга изменена');
  }

  /* ------------------------------------------------------------------
   * 4. Сохранение, экспорт, импорт, сброс
   * ------------------------------------------------------------------ */

  function markDirty() {
    dirty = true;
    var btn = $('#btn-save');
    if (btn) btn.textContent = 'Сохранить ●';
  }

  function doSave() {
    BusinessStorage.save(cfg);
    dirty = false;
    $('#btn-save').textContent = 'Сохранить';
    $('#admin-subtitle').textContent = 'сохранено в этом браузере · ' +
      new Date().toLocaleString('ru-RU');
    toast('Конфигурация сохранена в localStorage');
  }

  function doExport() {
    var name = String((cfg.business && cfg.business.name) || 'business')
      .replace(/[^\wа-яё-]+/gi, '-')
      .toLowerCase();
    BusinessStorage.exportJson(cfg, name + '-config.json');
    toast('Файл JSON выгружен');
  }

  function doImport(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = BusinessStorage.importJson(String(reader.result));
        cfg = imported;
        renderSettings();
        renderServices();
        markDirty();
        toast('Конфигурация импортирована — проверьте данные и нажмите «Сохранить»');
      } catch (err) {
        toast(err.message || 'Не удалось импортировать файл', 'error');
      }
    };
    reader.onerror = function () {
      toast('Не удалось прочитать файл', 'error');
    };
    reader.readAsText(file);
  }

  function doReset() {
    if (!window.confirm('Сбросить все данные к значениям по умолчанию?')) return;
    cfg = BusinessStorage.defaults();
    BusinessStorage.save(cfg);
    renderSettings();
    renderServices();
    dirty = false;
    $('#btn-save').textContent = 'Сохранить';
    toast('Данные сброшены к значениям по умолчанию');
  }

  /* ------------------------------------------------------------------
   * 5. События и старт
   * ------------------------------------------------------------------ */

  function wireEvents() {
    $('#btn-save').addEventListener('click', doSave);
    $('#btn-export').addEventListener('click', doExport);
    $('#btn-reset').addEventListener('click', doReset);

    $('#btn-import').addEventListener('click', function () {
      $('#import-file').click();
    });
    $('#import-file').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) doImport(file);
      e.target.value = '';
    });

    $('#btn-add-service').addEventListener('click', function () {
      openServiceModal(null);
    });
    $('#svc-save').addEventListener('click', saveService);
    $$('[data-close]', serviceOverlay).forEach(function (btn) {
      btn.addEventListener('click', closeServiceModal);
    });
    serviceOverlay.addEventListener('click', function (e) {
      if (e.target === serviceOverlay) closeServiceModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !serviceOverlay.hidden) closeServiceModal();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        doSave();
      }
    });

    window.addEventListener('beforeunload', function (e) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  function init() {
    renderSettings();
    renderServices();
    bindSettings();
    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
