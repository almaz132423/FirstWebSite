# Соответствие: Google Таблица ↔ конфигурация сайта ↔ Apps Script

Данные взяты из листа `gid=384647661` таблицы:
https://docs.google.com/spreadsheets/d/11X-a1AUTlxjV5ZgwIR5PXFiyhsXRgELHqZUlDaSzQc4

## Структура листа (реконструкция)

Колонки (первая строка): `type | key | value | id | name | description | price | duration | image | imageAlt`

Строки:

| type | key | value | id | name | description | price | duration | image | imageAlt |
|---|---|---|---|---|---|---|---|---|---|---|
| settings | business.name | Название компании | d7dd6045-… | service-1 | Название услуги | Описание услуги | Уточняйте стоимость | 1 час | — |
| settings | contacts.phone | +70000000000 | 81bdbc50-… | service-2 | Вторая услуга | Описание второй услуги | от 3000 ₽ | 2 часа | — |
| settings | contacts.address | Адрес компании | — | — | — | — | — | — | — |
| settings | contacts.hours | Ежедневно 09:00–18:00 | — | — | — | — | — | — | — |
| settings | messengers.telegram.url | https://t.me/example | — | — | — | — | — | — | — |
| service | — | — | service-f54572a4-… | УСЛУГА 1 | 23 | 1222 | 23 | — | 23 |

> Замечания по данным:
> 1. Первые две строки содержат и настройку, и пример услуги одновременно —
>    видимо, так заполнялся пример. В конфигурации сайта настройки и услуги
>    разделены по своим массивам.
> 2. В строках услуг значения выглядят сдвинутыми относительно заголовков
>    («Описание услуги» попало в price, «Уточняйте стоимость» — в duration,
>    «1 час» — в image). В оболочке поля услуг называются по заголовкам
>    листа: id, name, description, price, duration, image, imageAlt.
> 3. Строка «УСЛУГА 1» содержит тестовые числа (23 / 1222 / 23) — вероятно,
>    случайные данные, в конфигурацию по умолчанию не включена.

## Маппинг «таблица → конфиг» (js/config.js)

| Google Таблица | Конфигурация сайта |
|---|---|
| settings: business.name | `business.name` |
| settings: contacts.phone | `contacts.phone` (+ `contacts.phoneDisplay`) |
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
| (не в таблице) | `messengers.whatsapp.phone`, `messengers.max.*`, `booking.fields`, `design.colors`, `seo.*` |

## Связь с Google Apps Script (план на будущее)

Сейчас админка работает локально (localStorage). Чтобы связать её с таблицей
через существующий Apps Script:

1. Опубликуйте Apps Script как Web App («Развёртывание → Управление
   развёртываниями → Новое развёртывание → Веб-приложение»).
2. Пропишите URL веб-приложения в поле `api.url` (админка → Настройки → API).
3. Добавьте в `storage.js` функции `loadRemote()` / `saveRemote()` с `fetch`
   к этому URL и переключение режима `local` ↔ `api`.

Тогда настройки и услуги будут читаться/писаться прямо из листа, и данные
станут общими для всех посетителей. Для публичного редактирования обязательно
нужна авторизация на стороне Apps Script.
