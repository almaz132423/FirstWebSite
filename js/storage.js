/* =====================================================================
 * storage.js — слой хранения конфигурации.
 *
 * Сейчас данные хранятся в localStorage браузера. Экспорт/импорт JSON
 * нужен, чтобы переносить конфигурацию между браузерами и позже —
 * в постоянное хранилище (например, Google Apps Script как API).
 *
 * Витрина (main.js) и админка (admin.js) читают данные из одного ключа,
 * поэтому изменения, сохранённые в админке, сразу видны на витрине.
 * ===================================================================== */

window.BusinessStorage = (function () {
  'use strict';

  const KEY = 'business-site:config:v1';

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function defaults() {
    return clone(window.APP_CONFIG_DEFAULTS);
  }

  /**
   * Проверка структуры импортируемой конфигурации.
   * Возвращает true, если структура пригодна для работы.
   */
  function validate(cfg) {
    if (!cfg || typeof cfg !== 'object') return false;
    if (!cfg.business || typeof cfg.business !== 'object') return false;
    if (!cfg.contacts || typeof cfg.contacts !== 'object') return false;
    if (!cfg.messengers || typeof cfg.messengers !== 'object') return false;
    if (!Array.isArray(cfg.services)) return false;
    if (!cfg.booking || typeof cfg.booking !== 'object') return false;
    if (!Array.isArray(cfg.booking.fields)) return false;
    return true;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const cfg = JSON.parse(raw);
      return validate(cfg) ? cfg : defaults();
    } catch (err) {
      return defaults();
    }
  }

  function save(cfg) {
    localStorage.setItem(KEY, JSON.stringify(cfg, null, 2));
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  /** Выгрузка конфигурации в файл business-config.json. */
  function exportJson(cfg, filename) {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'business-config.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /** Разбор и проверка импортируемого JSON; бросает Error с понятным текстом. */
  function importJson(text) {
    let cfg;
    try {
      cfg = JSON.parse(text);
    } catch (err) {
      throw new Error('Файл не является корректным JSON: ' + err.message);
    }
    if (!validate(cfg)) {
      throw new Error(
        'Структура конфигурации не подходит: ожидаются разделы business, ' +
        'contacts, messengers, booking.fields и массив services.'
      );
    }
    return cfg;
  }

  return { KEY, defaults, validate, load, save, reset, exportJson, importJson };
})();
