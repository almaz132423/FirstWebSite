/**
 * Code.gs — backend админ-панели: связь сайта с Google Таблицей.
 *
 * Публикуется как веб-приложение (Deploy → New deployment → Web app,
 * Execute as: Me, Who has access: Anyone). Полученный URL /exec нужно
 * вставить в админке в поле «API» (api.url) и сохранить.
 *
 * Протокол обмена с сайтом (js/storage.js):
 *   GET  ?action=read
 *     -> { settings: [{key, value}, ...], services: [...] }
 *   POST body: {"action":"write","settings":[...],"services":[...]}
 *     -> { ok: true, written: N }
 *
 * Структура листа (колонки):
 *   type | key | value | id | name | description | price | duration | image | imageAlt
 *
 * ВАЖНО: «Сохранить в таблицу» перезаписывает строки данных листа
 * (со 2-й строки и ниже). Перед первым использованием сделайте копию
 * таблицы и замените SHEET_ID ниже.
 */

const SHEET_ID = '11X-a1AUTlxjV5ZgwIR5PXFiyhsXRgELHqZUlDaSzQc4'; // <-- замените при необходимости
const SHEET_GID = 384647661;

// Колонки (A=1 ... J=10)
const COL = {
  TYPE: 0, KEY: 1, VALUE: 2, ID: 3, NAME: 4, DESC: 5,
  PRICE: 6, DURATION: 7, IMAGE: 8, IMAGE_ALT: 9
};

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheets().find(function (sh) {
    return sh.getSheetId() === SHEET_GID;
  });
  if (!sheet) throw new Error('Лист с gid ' + SHEET_GID + ' не найден в таблице');
  return sheet;
}

function str_(v) {
  return v == null ? '' : String(v);
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Чтение: настройки + услуги. */
function doGet(e) {
  try {
    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    const values = lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, 10).getValues()
      : [];

    const settings = [];
    const services = [];

    values.forEach(function (row) {
      const type = str_(row[COL.TYPE]).trim().toLowerCase();
      if (type === 'settings' && row[COL.KEY]) {
        settings.push({ key: str_(row[COL.KEY]), value: str_(row[COL.VALUE]) });
      }
      if (type === 'service' && row[COL.ID]) {
        services.push({
          id: str_(row[COL.ID]),
          name: str_(row[COL.NAME]),
          description: str_(row[COL.DESC]),
          price: str_(row[COL.PRICE]),
          duration: str_(row[COL.DURATION]),
          image: str_(row[COL.IMAGE]),
          imageAlt: str_(row[COL.IMAGE_ALT])
        });
      }
    });

    return jsonOut_({ ok: true, settings: settings, services: services });
  } catch (err) {
    return jsonOut_({ ok: false, error: str_(err) });
  }
}

/** Запись: настройки + услуги (строки данных листа перезаписываются). */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!Array.isArray(data.services)) throw new Error('Нет массива services');

    const rows = [];

    (data.settings || []).forEach(function (s) {
      rows.push([
        'settings', str_(s.key), str_(s.value), '', '', '', '', '', '', ''
      ]);
    });

    (data.services || []).forEach(function (s) {
      rows.push([
        'service', '', '', str_(s.id), str_(s.name), str_(s.description),
        str_(s.price), str_(s.duration), str_(s.image), str_(s.imageAlt)
      ]);
    });

    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 10).clearContent();
    }
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, 10).setValues(rows);
    }

    return jsonOut_({ ok: true, written: rows.length });
  } catch (err) {
    return jsonOut_({ ok: false, error: str_(err) });
  }
}
