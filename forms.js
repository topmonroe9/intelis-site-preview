/**
 * Глобальный обработчик lead-форм.
 *
 * Перехватывает submit для всех `form[data-lead-form]` через делегирование на
 * document — работает и для динамически добавленных форм.
 *
 * Отправка:
 *   - если задан endpoint (window.__LEAD__.endpoint) — реальный POST (JSON) на
 *     YC Cloud Function, которая создаёт сделку в Битрикс24;
 *   - если endpoint пуст (preview без бэкенда) — имитация success-флоу.
 *
 * Антиспам: Yandex SmartCaptcha (invisible) + honeypot-поле `_hp`.
 * UTM-метки перехватываются из URL и хранятся в sessionStorage.
 *
 * Телефон: маска +7 (XXX) XXX-XX-XX на всех input[type="tel"] (включая
 * калькулятор), до отправки форма проверяется — имя, 10 цифр номера, согласие.
 *
 * Состояния: loading → success (зелёный блок) / error (красное сообщение + retry).
 * Текст ошибки зависит от причины: неверные данные, нет сети, сбой сервера.
 *
 * Calculator (Preact) переиспользует отправку через window.intelisLead.send().
 */
(function () {
  'use strict';

  if (window.__intelisFormsInit) return;
  window.__intelisFormsInit = true;

  var CFG = window.__LEAD__ || {};
  var ENDPOINT = CFG.endpoint || '';
  var CAPTCHA_KEY = CFG.captchaKey || '';

  var FORM_SELECTOR = 'form[data-lead-form]';
  var BUSY_ATTR = 'data-busy';

  // ─── UTM ───────────────────────────────────────────────────────────────
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var UTM_STORE = 'intelis_utm';

  function captureUtm() {
    try {
      var q = new URLSearchParams(window.location.search);
      var found = {};
      var has = false;
      UTM_KEYS.forEach(function (k) {
        var v = q.get(k);
        if (v) {
          found[k] = v;
          has = true;
        }
      });
      // Сохраняем первый источник на сессию; не перезатираем при переходах без UTM.
      if (has && !sessionStorage.getItem(UTM_STORE)) {
        sessionStorage.setItem(UTM_STORE, JSON.stringify(found));
      }
    } catch (_) {}
  }

  function getStoredUtm() {
    try {
      return JSON.parse(sessionStorage.getItem(UTM_STORE) || '{}');
    } catch (_) {
      return {};
    }
  }

  captureUtm();

  // ─── SmartCaptcha (invisible) ────────────────────────────────────────────
  var _captchaLoading = null;

  function ensureCaptcha() {
    if (window.smartCaptcha) return Promise.resolve(window.smartCaptcha);
    if (_captchaLoading) return _captchaLoading;
    _captchaLoading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://smartcaptcha.yandexcloud.net/captcha.js';
      s.defer = true;
      s.onload = function () {
        var tries = 0;
        (function wait() {
          if (window.smartCaptcha) return resolve(window.smartCaptcha);
          if (tries++ > 50) return reject(new Error('captcha_unavailable'));
          setTimeout(wait, 100);
        })();
      };
      s.onerror = function () {
        reject(new Error('captcha_script_error'));
      };
      document.head.appendChild(s);
    });
    return _captchaLoading;
  }

  /**
   * Возвращает Promise<token>. Для каждого контейнера лениво создаёт один
   * invisible-виджет и переиспользует его (reset перед каждым execute).
   */
  function getCaptchaToken(container) {
    if (!CAPTCHA_KEY) return Promise.resolve('');
    return ensureCaptcha().then(function (sc) {
      return new Promise(function (resolve, reject) {
        var widget = container.__captchaWidget;
        if (widget == null) {
          var box = document.createElement('div');
          box.style.display = 'none';
          container.appendChild(box);
          widget = sc.render(box, {
            sitekey: CAPTCHA_KEY,
            invisible: true,
            callback: function (token) {
              var r = container.__captchaResolve;
              container.__captchaResolve = null;
              if (r) r(token);
            },
          });
          container.__captchaWidget = widget;
        }
        container.__captchaResolve = resolve;
        sc.reset(widget);
        sc.execute(widget);
        setTimeout(function () {
          if (container.__captchaResolve) {
            container.__captchaResolve = null;
            reject(new Error('captcha_timeout'));
          }
        }, 25000);
      });
    });
  }

  // ─── Маска телефона ──────────────────────────────────────────────────────
  var PHONE_LEN = 11; // 7 + 10 цифр

  /** Цифры номера, всегда с кодом страны 7 впереди (8 → 7, «999…» → «7999…»). */
  function phoneDigits(value) {
    var d = String(value || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.charAt(0) === '8') d = '7' + d.slice(1);
    else if (d.charAt(0) !== '7') d = '7' + d;
    return d.slice(0, PHONE_LEN);
  }

  function formatPhone(d) {
    if (!d) return '';
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  function isPhoneComplete(value) {
    return phoneDigits(value).length === PHONE_LEN;
  }

  // Позиция в отформатированной строке сразу после n-й цифры.
  function caretAfterDigit(str, n) {
    if (n <= 0) return 0;
    for (var i = 0, seen = 0; i < str.length; i++) {
      if (/\d/.test(str.charAt(i)) && ++seen === n) return i + 1;
    }
    return str.length;
  }

  function onPhoneInput(e) {
    var el = e.target;
    if (!(el instanceof HTMLInputElement) || el.type !== 'tel') return;

    var raw = el.value;
    var caret = el.selectionStart == null ? raw.length : el.selectionStart;
    var rawDigits = raw.replace(/\D/g, '');
    var before = raw.slice(0, caret).replace(/\D/g, '').length;

    // Backspace по скобке/дефису: цифр не убавилось — удаляем цифру перед курсором,
    // иначе маска тут же вернёт символ обратно и стереть номер будет нельзя.
    var prev = el.dataset.phonePrev || '';
    if (
      e.inputType === 'deleteContentBackward' &&
      rawDigits === prev.replace(/\D/g, '') &&
      before > 0
    ) {
      rawDigits = rawDigits.slice(0, before - 1) + rawDigits.slice(before);
      before -= 1;
    }

    var digits = phoneDigits(rawDigits);
    // Если код страны дописали сами — курсор сдвигается на одну цифру.
    if (rawDigits && /^[^78]/.test(rawDigits)) before += 1;

    var formatted = formatPhone(digits);
    el.value = formatted;
    el.dataset.phonePrev = formatted;
    if (document.activeElement === el) {
      var pos = caretAfterDigit(formatted, Math.min(before, digits.length));
      try { el.setSelectionRange(pos, pos); } catch (_) {}
    }
  }

  // capture — раньше обработчиков Preact в калькуляторе, они уже читают отформатированное значение.
  document.addEventListener('input', onPhoneInput, true);

  // ─── Тексты ошибок ───────────────────────────────────────────────────────
  var MESSAGES = {
    name_required: 'Укажите, как к вам обращаться.',
    phone_required: 'Укажите номер телефона.',
    phone_invalid: 'Номер телефона указан неполностью: нужно 10 цифр после +7.',
    agree_required: 'Нужно согласие на обработку персональных данных.',
    name_and_phone_required: 'Заполните имя и номер телефона.',
    captcha_failed: 'Не прошла проверка от спама. Обновите страницу и попробуйте ещё раз.',
    network: 'Нет соединения с интернетом. Проверьте сеть и попробуйте ещё раз.',
    server: 'Сервис заявок временно недоступен. Попробуйте позже или позвоните нам: +7 (495) 023-70-22.',
  };

  var INVALID_DATA = {
    name_required: 1,
    phone_required: 1,
    phone_invalid: 1,
    agree_required: 1,
    name_and_phone_required: 1,
  };

  function errorMessage(err) {
    var code = (err && err.message) || '';
    return MESSAGES[code] || MESSAGES.server;
  }

  /**
   * Проверка полей до отправки. Возвращает null или {code, field} —
   * field указывает, на какое поле перевести фокус.
   */
  function validatePayload(p) {
    if (!String(p.name || '').trim()) return { code: 'name_required', field: 'name' };
    if (!String(p.phone || '').trim()) return { code: 'phone_required', field: 'phone' };
    if (!isPhoneComplete(p.phone)) return { code: 'phone_invalid', field: 'phone' };
    return null;
  }

  // ─── Отправка заявки ─────────────────────────────────────────────────────
  /**
   * Отправляет заявку на бэкенд. `container` — DOM-элемент (форма) для рендера
   * невидимой капчи. Возвращает Promise, который реджектится при ошибке.
   */
  function sendLead(payload, container) {
    return getCaptchaToken(container).then(function (token) {
      var body = {};
      for (var k in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, k)) body[k] = payload[k];
      }
      var utm = getStoredUtm();
      for (var u in utm) {
        if (Object.prototype.hasOwnProperty.call(utm, u)) body[u] = utm[u];
      }
      if (token) body.captchaToken = token;

      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(function () {
        // fetch падает только без сети / при обрыве соединения
        throw new Error('network');
      }).then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (json) {
            if (!res.ok || !json.ok) throw new Error((json && json.error) || 'request_failed');
            return json;
          });
      });
    });
  }

  function collectPayload(form) {
    var fd = new FormData(form);
    var p = {};
    fd.forEach(function (v, k) {
      if (typeof v === 'string') p[k] = v;
    });
    // Услуга: вместо slug кладём человекочитаемый текст выбранной опции.
    var sel = form.querySelector('select[name="service"]');
    if (sel && sel.selectedOptions && sel.selectedOptions[0]) {
      p.service = sel.selectedOptions[0].textContent.trim();
    }
    return p;
  }

  // Экспорт для калькулятора и прочих кастомных форм.
  window.intelisLead = {
    endpoint: ENDPOINT,
    hasCaptcha: !!CAPTCHA_KEY,
    getUtm: getStoredUtm,
    send: sendLead,
    validate: validatePayload,
    errorMessage: errorMessage,
  };

  // ─── helpers UI ──────────────────────────────────────────────────────────
  function getSubmitButton(form) {
    return form.querySelector('button[type="submit"]');
  }

  function setLoading(form, btn) {
    form.setAttribute(BUSY_ATTR, '1');
    if (!btn) return;
    if (!btn.dataset.origText) btn.dataset.origText = btn.textContent.trim();
    btn.disabled = true;
    btn.classList.add('lead-btn--loading');
    btn.innerHTML = '<span class="lead-spinner" aria-hidden="true"></span><span>Отправляем…</span>';
  }

  function clearLoading(form, btn) {
    form.removeAttribute(BUSY_ATTR);
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('lead-btn--loading');
    if (btn.dataset.origText) btn.textContent = btn.dataset.origText;
  }

  function showSuccess(form) {
    var success = document.createElement('div');
    success.className = 'lead-success';
    success.setAttribute('role', 'status');
    success.setAttribute('aria-live', 'polite');
    success.innerHTML =
      '<div class="lead-success__icon" aria-hidden="true">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M5 12.5l4.5 4.5L19 7.5"/>' +
        '</svg>' +
      '</div>' +
      '<h3 class="lead-success__title">Заявка принята</h3>' +
      '<p class="lead-success__text">Перезвоним в течение часа в рабочее время. Если срочно — звоните <a href="tel:+74950237022">+7 (495) 023-70-22</a>.</p>';

    // Подгоняем стиль success-блока под вариант: card / plain / compact
    if (form.classList.contains('rounded-pill')) {
      success.classList.add('lead-success--compact');
    } else if (form.classList.contains('bg-paper')) {
      success.classList.add('lead-success--card');
    } else {
      success.classList.add('lead-success--plain');
    }

    // Fade-out → swap → fade-in
    form.classList.add('lead-form--leaving');
    window.setTimeout(function () {
      if (form.parentNode) {
        form.parentNode.insertBefore(success, form);
        form.style.display = 'none';
      }
      // forced reflow и затем класс на success — для transition
      // eslint-disable-next-line no-unused-expressions
      success.offsetHeight;
      success.classList.add('lead-success--in');
    }, 250);
  }

  /** title задан — это ошибка в данных: свой заголовок и без кнопки повтора. */
  function showError(form, message, title) {
    // Удаляем старое сообщение об ошибке, если было
    var prev = form.querySelector('.lead-error');
    if (prev) prev.remove();

    var text = message || MESSAGES.server;

    var err = document.createElement('div');
    err.className = 'lead-error';
    err.setAttribute('role', 'alert');
    err.innerHTML =
      '<div class="lead-error__inner">' +
        '<div class="lead-error__icon" aria-hidden="true">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="9"/>' +
            '<path d="M12 7v6"/><path d="M12 16.5h.01"/>' +
          '</svg>' +
        '</div>' +
        '<div class="lead-error__body">' +
          '<strong class="lead-error__title">' + (title || 'Не удалось отправить') + '</strong>' +
          '<span class="lead-error__text">' + text + '</span>' +
        '</div>' +
        (title ? '' : '<button type="button" class="lead-error__retry">Попробовать снова</button>') +
      '</div>';

    // Compact — короче padding, plain/card — обычный
    if (form.classList.contains('rounded-pill')) {
      err.classList.add('lead-error--compact');
    }

    form.prepend(err);
    var retry = err.querySelector('.lead-error__retry');
    if (retry) retry.addEventListener('click', function () {
      err.remove();
    });
  }

  function markInvalid(form, field) {
    var el = form.querySelector('[name="' + field + '"]');
    if (!el) return;
    el.setAttribute('aria-invalid', 'true');
    el.classList.add('lead-invalid');
    try { el.focus(); } catch (_) {}
  }

  function clearInvalid(form) {
    var list = form.querySelectorAll('.lead-invalid');
    for (var i = 0; i < list.length; i++) {
      list[i].classList.remove('lead-invalid');
      list[i].removeAttribute('aria-invalid');
    }
  }

  // Подсветку поля снимаем, как только его начали править.
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el && el.classList && el.classList.contains('lead-invalid')) {
      el.classList.remove('lead-invalid');
      el.removeAttribute('aria-invalid');
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el && el.classList && el.classList.contains('lead-invalid')) {
      el.classList.remove('lead-invalid');
      el.removeAttribute('aria-invalid');
    }
  });

  // ─── имитация запроса (preview без бэкенда) ───────────────────────────────
  function fakeSubmit(form) {
    var delay = 800 + Math.random() * 400; // 800–1200ms
    return new Promise(function (resolve, reject) {
      window.setTimeout(function () {
        try {
          var p = new URLSearchParams(window.location.search);
          if (p.get('form_error') === '1') return reject(new Error('emulated'));
        } catch (_) {}
        resolve({ ok: true });
      }, delay);
    });
  }

  // ─── основной обработчик ───────────────────────────────────────────────
  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.matches(FORM_SELECTOR)) return;

      e.preventDefault();

      // Защита от множественных кликов
      if (form.getAttribute(BUSY_ATTR) === '1') return;

      // Чистим прошлую ошибку
      var prevErr = form.querySelector('.lead-error');
      if (prevErr) prevErr.remove();
      clearInvalid(form);

      var payload = collectPayload(form);
      var invalid = validatePayload(payload);
      var agree = form.querySelector('input[name="agree"]');
      if (!invalid && agree && !agree.checked) invalid = { code: 'agree_required', field: 'agree' };
      if (invalid) {
        markInvalid(form, invalid.field);
        showError(form, MESSAGES[invalid.code], 'Проверьте данные');
        return;
      }

      var btn = getSubmitButton(form);
      setLoading(form, btn);

      var request = ENDPOINT ? sendLead(payload, form) : fakeSubmit(form);

      request.then(
        function () {
          showSuccess(form);
        },
        function (err) {
          clearLoading(form, btn);
          var code = err && err.message;
          // Сервер мог отклонить данные — тогда это не сбой, а просьба поправить поле.
          if (INVALID_DATA[code]) {
            markInvalid(form, code === 'name_and_phone_required' ? 'name' : 'phone');
            showError(form, errorMessage(err), 'Проверьте данные');
          } else {
            showError(form, errorMessage(err));
          }
        }
      );
    },
    true // capture — чтобы перехватывать раньше потенциальных нативных хэндлеров
  );

  // ─── инжектим CSS один раз ─────────────────────────────────────────────
  var css =
    '.lead-form--leaving{opacity:0;transform:translateY(-6px);transition:opacity .25s ease, transform .25s ease;pointer-events:none}' +
    '.lead-spinner{display:inline-block;width:14px;height:14px;border-radius:999px;border:2px solid rgba(255,255,255,.45);border-top-color:#fff;animation:leadSpin .7s linear infinite;margin-right:8px;vertical-align:-2px}' +
    '@keyframes leadSpin{to{transform:rotate(360deg)}}' +
    '.lead-btn--loading{cursor:wait}' +

    /* success */
    '.lead-success{opacity:0;transform:translateY(8px);transition:opacity .3s ease, transform .3s cubic-bezier(.6,.2,.2,1);font-family:var(--font-body)}' +
    '.lead-success--in{opacity:1;transform:translateY(0)}' +
    '.lead-success--card{background:var(--color-paper);border:1px solid var(--color-line);border-radius:20px;padding:36px;box-shadow:var(--shadow-2);text-align:center}' +
    '.lead-success--plain{padding:8px 0;text-align:center}' +
    '.lead-success--compact{display:flex;align-items:center;gap:14px;padding:14px 22px;background:rgba(27,180,122,.08);border:1px solid rgba(27,180,122,.25);border-radius:999px;max-width:480px}' +
    '.lead-success__icon{width:56px;height:56px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:rgba(27,180,122,.12);color:var(--color-success);margin:0 auto 18px}' +
    '.lead-success--compact .lead-success__icon{width:34px;height:34px;margin:0;flex:none}' +
    '.lead-success--compact .lead-success__icon svg{width:18px;height:18px}' +
    '.lead-success__title{font-family:var(--font-display);font-weight:800;font-size:22px;line-height:1.15;letter-spacing:-0.01em;color:var(--color-ink);margin:0 0 8px}' +
    '.lead-success--compact .lead-success__title{font-size:15px;margin:0}' +
    '.lead-success__text{font-family:var(--font-body);font-size:15px;line-height:1.5;color:var(--color-ink-mute);margin:0;max-width:440px;margin-left:auto;margin-right:auto}' +
    '.lead-success--compact .lead-success__text{font-size:13px;margin:0}' +
    '.lead-success__text a{color:var(--color-azure);font-weight:600;border-bottom:1px solid currentColor;white-space:nowrap}' +

    /* error */
    '.lead-error{margin-bottom:16px;animation:leadErrIn .25s ease}' +
    '@keyframes leadErrIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}' +
    '.lead-error__inner{display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(211,74,71,.07);border:1px solid rgba(211,74,71,.3);border-radius:12px;font-family:var(--font-body)}' +
    '.lead-error__icon{flex:none;width:32px;height:32px;border-radius:999px;background:rgba(211,74,71,.12);color:var(--color-error);display:inline-flex;align-items:center;justify-content:center}' +
    '.lead-error__body{flex:1;display:flex;flex-direction:column;line-height:1.3}' +
    '.lead-error__title{font-family:var(--font-display);font-weight:700;font-size:13.5px;color:var(--color-ink)}' +
    '.lead-error__text{font-size:13px;color:var(--color-ink-mute);margin-top:2px}' +
    '.lead-error__retry{flex:none;font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:.04em;text-transform:uppercase;padding:8px 14px;border-radius:999px;background:var(--color-error);color:#fff;border:0;cursor:pointer;transition:opacity .15s, transform .12s}' +
    '.lead-error__retry:hover{opacity:.92;transform:translateY(-1px)}' +
    '.lead-error--compact{margin-bottom:8px}' +
    '.lead-invalid{border-color:var(--color-error)!important;box-shadow:0 0 0 2px rgba(211,74,71,.15)!important}' +
    'input[type="checkbox"].lead-invalid{outline:2px solid var(--color-error);outline-offset:2px}' +
    '.lead-error--compact .lead-error__inner{padding:10px 12px;font-size:12.5px}' +

    '@media (prefers-reduced-motion: reduce){' +
      '.lead-form--leaving,.lead-success,.lead-error{transition:none;animation:none}' +
      '.lead-spinner{animation-duration:1.4s}' +
    '}';

  var style = document.createElement('style');
  style.setAttribute('data-lead-forms', '');
  style.textContent = css;
  document.head.appendChild(style);
})();
