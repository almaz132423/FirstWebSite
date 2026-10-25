# Соответствие: Google Таблица ↔ конфигурация сайта ↔ Apps Script

Данные взяты из листа `gid=384647661` таблицы:
https://docs.google.com/spreadsheets/d/11X-a1AUTlxjV5ZgwIR5PXFiyhsXRgELHqZUlDaSzQc4

## Структура листа

Колонки (первая строка): `type | key | value | id | name | description | price | duration | image | imageAlt`

| type | key | value | id | name | description | price | duration | image | imageAlt |
|---|---|---|---|---|---|---|---|---|---|---|
| settings | business.name | Название компании | d7dd6045-… | service-1 | Название услуги | Описание услуги | Уточняйте стоимость | 1 час | — |
| settings | contacts.phone | +70000000000 | 81bdbc50-… | service-2 | Вторая услуга | Описание второй услуги | от 3000 ₽ | 2 часа | — |
| settings | contacts.address | Адрес компании | — | — | — | — | — | — | — |
| settings | contacts.hours | Ежедневно 09:00–18:00 | — | — | — | — | — | — | — |
| settings | messengers.telegram.url | https://t.me/example | — | — | — | — | — | — | — |
| service | — | — | service-f54572a4-… | УСЛУГА 1 | 23 | 1222 | 23 | — | 23 |

> Замечания по текущим данным:
> 1. Первые две строки содержат и настройку, и пример услуги одновременно,
>    а значения услуг выглядят сдвинутыми относительно заголовков. После
>    первого «Сохранить в таблицу» из админки лист перепишется в чистом
>    виде: отдельные строки настроек и услуг — сделайте копию таблицы заранее.
> 2. Строка «УСЛУГА 1» содержит тестовые числа (23 / 1222 / 23) и будет
>    утеряна при перезаписи — она не используется сайтом.

## Маппинг «таблица → конфиг» (js/config.js, js/storage.js)

| Google Таблица | Конфигурация сайта |
|---|---|
| settings: business.name | `business.name` |
| settings: contacts.phone | `contacts.phone` |
| settings: contacts.address | `contacts.address` |
| settings: contacts.hours | `contacts.hours` |
| settings: messengers.telegram.url | `messengers.telegram.chatUrl` |
| service: id | `services[].id` |
| service: name | `services[].name` |
| service: description | `services[].description` |
| service: price | `services[].price` |
| service: duration | `services[].duration` |
| service: image | `services[].image` |
| service: imageAlt | `services[].imageAlt` |
| (не в таблице) | `business.tagline`, `messengers.whatsapp.*`, `messengers.max.*`, `booking.*`, `design.*`, `seo.*` — живут локально |

Синхронизируются только настройки из списка выше и массив услуг.
Остальные поля конфигурации остаются локальными.

## Apps Script (apps-script/Code.gs)

Скрипт публикуется как веб-приложение («Развёртывание → Новое развёртывание →
Веб-приложение», доступ: «Все»), URL `/exec` вставляется в админку в поле
`api.url`. Протокол:

- `GET ?action=read` → `{ settings: [{key, value}], services: [...] }`
- `POST {"action":"write","settings":[...],"services":[...]}` → `{ ok, written }`

Сайт (витрина и админка) обращается к этому URL через `fetch`
(`js/storage.js`: `loadRemote` / `saveRemote`). При записи строки данных
листа перезаписываются: настройки → `type=settings`, услуги → `type=service`.
