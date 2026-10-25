/* =====================================================================
 * config.js — конфигурация бизнеса ПО УМОЛЧАНИЮ.
 *
 * Это единственное место, где лежат данные компании: название, контакты,
 * мессенджеры, услуги, поля формы записи, шаблон сообщения, дизайн и SEO.
 * Чтобы адаптировать сайт под нового клиента, меняйте этот файл или
 * редактируйте данные в admin.html и экспортируйте JSON.
 *
 * Структура зеркалит Google Таблицу, с которой работает Apps Script:
 *
 *   Настройки (лист: type="settings", пары key/value):
 *     business.name            -> business.name
 *     contacts.phone           -> contacts.phone
 *     contacts.address         -> contacts.address
 *     contacts.hours           -> contacts.hours
 *     messengers.telegram.url  -> messengers.telegram.chatUrl
 *
 *   Услуги (лист: type="service", колонки):
 *     id, name, description, price, duration, image, imageAlt
 *     -> элементы массива services
 *
 * Значения по умолчанию взяты из текущего содержимого таблицы (заглушки).
 * ===================================================================== */

window.APP_CONFIG_DEFAULTS = {
  meta: {
    version: '1.0.0',
    updated: '2026-10-25'
  },

  business: {
    name: 'Название компании',
    tagline: 'Короткое описание бизнеса: чем вы занимаетесь и чем полезны клиентам.',
    description:
      'Несколько предложений о компании. Замените этот текст на реальную информацию ' +
      'о вашем бизнесе, не выдумывайте достижения и награды.',
    features: [
      'Преимущество 1',
      'Преимущество 2',
      'Преимущество 3'
    ]
  },

  contacts: {
    phone: '+70000000000',
    phoneDisplay: '+7 000 000-00-00',
    address: 'Адрес компании',
    hours: 'Ежедневно 09:00–18:00',
    mapUrl: ''
  },

  messengers: {
    whatsapp: {
      enabled: true,
      // Только цифры, без «+»: 70000000000
      phone: '70000000000'
    },
    telegram: {
      enabled: true,
      // Чат/канал компании (из таблицы). Текст заявки передаётся через
      // официальный механизм t.me/share/url — пользователь сам выбирает чат.
      chatUrl: 'https://t.me/example'
    },
    max: {
      enabled: false,
      // Официальный шаблон ссылки MAX для передачи текста; уточните его
      // перед включением. Плейсхолдер {text} заменяется закодированным
      // сообщением. Пока шаблон пуст — кнопка скрыта.
      linkTemplate: '',
      hint: 'Укажите официальную ссылку MAX для передачи текста в админ-панели.'
    }
  },

  services: [
    {
      id: 'service-1',
      name: 'Название услуги',
      description: 'Описание услуги',
      price: 'Уточняйте стоимость',
      duration: '1 час',
      image: '',
      imageAlt: ''
    },
    {
      id: 'service-2',
      name: 'Вторая услуга',
      description: 'Описание второй услуги',
      price: 'от 3000 ₽',
      duration: '2 часа',
      image: '',
      imageAlt: ''
    }
  ],

  booking: {
    modalTitle: 'Оставить заявку',
    intro:
      'Заполните форму — мы подготовим текст сообщения, а вы отправите его нам ' +
      'в удобном мессенджере. Запись считается подтверждённой только после нашего ответа.',
    // Набор полей настраивается здесь; логика формы остаётся общей.
    fields: [
      { id: 'name',    label: 'Имя',            type: 'text',     required: true,  placeholder: 'Как к вам обращаться?' },
      { id: 'service', label: 'Услуга',         type: 'select',   source: 'services', required: true },
      { id: 'date',    label: 'Дата',           type: 'date',     required: true },
      { id: 'time',    label: 'Время',          type: 'time',     required: false },
      { id: 'comment', label: 'Комментарий',    type: 'textarea', required: false, placeholder: 'Пожелания и детали' }
    ],
    message: {
      greeting: 'Здравствуйте! Хочу оставить заявку.',
      closing: '',
      // Необязательные пустые поля в сообщение не попадают.
      includeEmpty: false
    }
  },

  design: {
    colors: {
      primary: '#4f46e5',
      primaryDark: '#4338ca',
      accent: '#f59e0b',
      bg: '#f6f7fb',
      surface: '#ffffff',
      ink: '#191b23',
      muted: '#626a7a',
      line: '#e6e8ef'
    },
    heroBadge: 'Работаем ежедневно'
  },

  seo: {
    title: 'Название компании — услуги и запись',
    description: 'Описание компании и услуг. Запишитесь через удобный мессенджер.'
  },

  api: {
    // Плейсхолдер будущего backend (например, Google Apps Script Web App).
    // Пока админка работает локально через localStorage.
    url: ''
  }
};
