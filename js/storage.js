/* =====================================================================
 * storage.js — слой хранения конфигурации.
 *
 * Локальный режим: данные хранятся в localStorage браузера
 * (витрина и админка читают их из одного ключа).
 *
 * Режим Google Таблицы: если в конфигурации задан api.url (URL
 * веб-приложения Apps Script из apps-script/Code.gs), админка может
 * загружать данные из таблицы и сохранять их обратно. Витрина при
 * наличии api.url тоже подтягивает данные из таблицы и кэширует их
 * в localStorage, чтобы сайт работал даже офлайн.
 *
 * Формат обмена с Apps Script:
 *   GET  ?action=read   -> { settings: [{key, value}], services: [...] }
 *   POST { action:'write', settings: [...], services: [...] }
 * Услуга: { id, name, description, price, duration, image, imageAlt }.
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

  function setPath(obj, path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (acc, key) {
      if (acc[key] == null || typeof acc[key] !== 'object') acc[key] = {};
      return acc[key];
    }, obj);
    target[last] = value;
  }

  /**
   * Проверка структуры конфигурации. Возвращает true, если структура
   * пригодна для работы.
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

  /* ------------------------------------------------------------------
   * Модель Google Таблицы: конфигурация <-> { settings, services }
   * ------------------------------------------------------------------ */

  // Какие настройки синхронизируются с таблицей (остальные живут локально).
  const SHEET_SETTING_PATHS = {
    'business.name': 'business.name',
    'contacts.phone': 'contacts.phone',
    'contacts.address': 'contacts.address',
    'contacts.hours': 'contacts.hours',
    'messengers.telegram.url': 'messengers.telegram.chatUrl'
  };

  /** Конфигурация -> модель листа. */
  function toSheetModel(cfg) {
    const settings = Object.keys(SHEET_SETTING_PATHS).map(function (key) {
      const parts = SHEET_SETTING_PATHS[key].split('.');
      let value = cfg;
      parts.forEach(function (p) { value = value == null ? value : value[p]; });
      return { key: key, value: value == null ? '' : String(value) };
    });
    return {
      settings: settings,
      services: (cfg.services || []).map(function (s) {
        return {
          id: String(s.id || ''),
          name: String(s.name || ''),
          description: String(s.description || ''),
          price: String(s.price || ''),
          duration: String(s.duration || ''),
          image: String(s.image || ''),
          imageAlt: String(s.imageAlt || '')
        };
      })
    };
  }

  /** Модель листа -> конфигурация (мутирует и возвращает cfg). */
  function applySheetModel(cfg, model) {
    (model.settings || []).forEach(function (s) {
      const path = SHEET_SETTING_PATHS[String(s.key || '').trim()];
      if (path) setPath(cfg, path, s.value);
    });
    if (Array.isArray(model.services)) {
      cfg.services = model.services;
    }
    return cfg;
  }

  /* ------------------------------------------------------------------
   * HTTP-мост к Apps Script
   * ------------------------------------------------------------------ */

  async function loadRemote(apiUrl) {
    const sep = apiUrl.indexOf('?') === -1 ? '?' : '&';
    const resp = await fetch(apiUrl + sep + 'action=read', { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (data && data.ok === false) throw new Error(data.error || 'Сервер вернул ошибку');
    if (!data || !Array.isArray(data.services)) {
      throw new Error('Ответ Apps Script не содержит массива services');
    }
    return data;
  }

  async function saveRemote(apiUrl, model) {
    const resp = await fetch(apiUrl, {
      method: 'POST',
      // text/plain — простой запрос без предварительного CORS-запроса
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'write',
        settings: model.settings || [],
        services: model.services || []
      })
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (data && data.ok === false) throw new Error(data.error || 'Сервер вернул ошибку');
    return data;
  }

  return {
    KEY,
    defaults,
    validate,
    load,
    save,
    reset,
    toSheetModel,
    applySheetModel,
    loadRemote,
    saveRemote
  };
})();
