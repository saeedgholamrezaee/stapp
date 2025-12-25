// stapp/public/js/datetime/jalali-date-time_range.patch.js
(function () {
  'use strict';

  if (window.__jalali_patch_applied__) return;
  window.__jalali_patch_applied__ = true;

  // Wait until frappe (and jQuery) are available
  function waitForDeps(done, tries = 60) {
    const t = setInterval(() => {
      if (typeof frappe !== 'undefined' && frappe.ui && frappe.ui.form && typeof $ !== 'undefined') {
        clearInterval(t);
        done();
      } else if (--tries <= 0) {
        clearInterval(t);
        console.error('Jalali patch: dependencies not ready.');
      }
    }, 150);
  }

  // Accurate Jalaali conversions (jalaali-js core)
  const J = (function() {
    function div(a, b) { return Math.floor(a / b); }
    function pad2(n) { n = parseInt(n, 10) || 0; return (n < 10 ? '0' : '') + n; }

    function g2d(gy, gm, gd) {
      gy = +gy; gm = +gm; gd = +gd;
      const gdm = [0,31,28,31,30,31,30,31,31,30,31,30,31];
      let d = 365 * (gy - 1600)
            + div(gy - 1600 + 3, 4)
            - div(gy - 1600 + 99, 100)
            + div(gy - 1600 + 399, 400);
      for (let i = 0; i < gm - 1; ++i) d += gdm[i + 1];
      if (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) d++;
      return d + gd - 1;
    }
    function d2g(g_day_no) {
      let gy = 1600 + 400 * div(g_day_no, 146097);
      g_day_no %= 146097;
      let leap = true;
      if (g_day_no >= 36525) {
        g_day_no--;
        gy += 100 * div(g_day_no, 36524);
        g_day_no %= 36524;
        if (g_day_no >= 365) g_day_no++;
        else leap = false;
      }
      gy += 4 * div(g_day_no, 1461);
      g_day_no %= 1461;
      if (g_day_no >= 366) {
        leap = false;
        g_day_no--;
        gy += div(g_day_no, 365);
        g_day_no %= 365;
      }
      let gd = g_day_no + 1;
      const sal_a = [0,31, ((gy%4===0 && gy%100!==0) || (gy%400===0)) ? 29 : 28,31,30,31,30,31,31,30,31,30,31];
      let gm = 0;
      for (gm = 1; gm <= 12; gm++) {
        const v = sal_a[gm];
        if (gd <= v) break;
        gd -= v;
      }
      return [gy, gm, gd];
    }
    function j2d(jy, jm, jd) {
      jy = +jy; jm = +jm; jd = +jd;
      jy -= 979; jm -= 1; jd -= 1;
      const jdm = [31,31,31,31,31,31,30,30,30,30,30,29];
      let j_day_no = 365 * jy + div(jy, 33) * 8 + div((jy % 33 + 3), 4);
      for (let i = 0; i < jm; ++i) j_day_no += jdm[i];
      j_day_no += jd;
      return j_day_no + 79;
    }
    function d2j(j_day_no) {
      j_day_no -= 79;
      const j_np = div(j_day_no, 12053);
      j_day_no %= 12053;
      let jy = 979 + 33 * j_np + 4 * div(j_day_no, 1461);
      j_day_no %= 1461;
      if (j_day_no >= 366) {
        jy += div(j_day_no - 1, 365);
        j_day_no = (j_day_no - 1) % 365;
      }
      const jm = (j_day_no < 186) ? 1 + div(j_day_no, 31) : 7 + div((j_day_no - 186), 30);
      const jd = 1 + ((j_day_no < 186) ? (j_day_no % 31) : ((j_day_no - 186) % 30));
      return [jy, jm, jd];
    }
    function toGregorian(jy, jm, jd) {
      const g = d2g(j2d(jy, jm, jd));
      return { gy: g[0], gm: g[1], gd: g[2] };
    }
    function toJalaali(gy, gm, gd) {
      const j = d2j(g2d(gy, gm, gd));
      return { jy: j[0], jm: j[1], jd: j[2] };
    }
    function parseJalaliDate(s) {
      if (!s) return null;
      const clean = String(s).trim().replace(/\//g, '-');
      const m = clean.match(/^(\d{3,4})-(\d{1,2})-(\d{1,2})$/);
      if (!m) return null;
      const jy = +m[1], jm = +m[2], jd = +m[3];
      if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;
      return [jy, jm, jd];
    }
    function parseISODate(s) {
      if (!s) return null;
      const m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return null;
      return [+m[1], +m[2], +m[3]];
    }
    function jalaliToISO(txt) {
      const p = parseJalaliDate(txt);
      if (!p) return null;
      const g = toGregorian(p[0], p[1], p[2]);
      return g ? `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}` : null;
    }
    function isoToJalali(iso) {
      const p = parseISODate(iso);
      if (!p) return null;
      const j = toJalaali(p[0], p[1], p[2]);
      return j ? `${j.jy}-${pad2(j.jm)}-${pad2(j.jd)}` : null;
    }
    function normalizeHyphen(s) {
      return String(s || '').trim().replace(/\//g, '-').replace(/\s+/g, ' ');
    }
    return { pad2, toGregorian, toJalaali, parseJalaliDate, parseISODate, jalaliToISO, isoToJalali, normalizeHyphen };
  })();

  // Utils
  function destroyFlatpickrIfAny($inp) {
    if (!$inp || !$inp.length) return;
    try { if ($inp[0] && $inp[0]._flatpickr) $inp[0]._flatpickr.destroy(); } catch (e) {}
    try { $inp.off('.datepicker').removeData('datepicker'); } catch (e) {}
  }
  function ensureId($el, seed) {
    if (!$el || !$el.length) return null;
    let id = $el.attr('id');
    if (!id) {
      id = `jal-${seed}-${Math.random().toString(36).slice(2, 9)}`;
      $el.attr('id', id);
    }
    return `#${id}`;
  }
  function setInputValSafe(ctrl, $inp, val) {
    if (!$inp || !$inp.length) return;
    ctrl.__jalali_setting__ = true;
    $inp.val(val);
    setTimeout(() => { ctrl.__jalali_setting__ = false; }, 0);
  }
  function setDisplay(ctrl, text) {
    try {
      if (!ctrl || !ctrl.$wrapper) return;
      const $val = ctrl.$wrapper.find('.control-value');
      if ($val && $val.length) {
        $val.text(text || '').attr('title', text || '');
      }
      const $like = ctrl.$wrapper.find('.like-disabled-input');
      if ($like && $like.length) {
        if ($like.is('input,textarea')) $like.val(text || '');
        else $like.text(text || '').attr('title', text || '');
      }
    } catch (e) {}
  }

  // Input binders
  function bindPickerDate(ctrl) {
    const $inp = ctrl.$input;
    if (!$inp || !$inp.length) return;
    if ($inp.data('jalali-init') === true) return;

    destroyFlatpickrIfAny($inp);
    $inp.attr('placeholder', 'YYYY-MM-DD');
    const selector = ensureId($inp, ctrl.df && ctrl.df.fieldname ? ctrl.df.fieldname : 'date');

    if (typeof $.fn.MdPersianDateTimePicker === 'function') {
      try {
        $inp.MdPersianDateTimePicker({
          targetTextSelector: selector,
          englishNumber: true,
          enableTimePicker: false,
          isGregorian: false,
          dateFormat: 'yyyy-MM-dd',
          textFormat: 'yyyy-MM-dd',
          modalMode: false
        });
      } catch (e) { console.warn('Jalali: picker init failed (date).', e); }
    }

    $inp.off('change.jalali input.jalali blur.jalali');
    $inp.on('input.jalali change.jalali blur.jalali', function () {
      if (ctrl.__jalali_setting__) return;
      let raw = J.normalizeHyphen($inp.val());
      if ($inp.val() !== raw) $inp.val(raw);
      const m = raw.match(/^(\d{3,4})-(\d{1,2})-(\d{1,2})$/);
      if (m) {
        const iso = J.jalaliToISO(raw);
        if (iso) {
          if (ctrl.value !== iso) {
            ctrl.__jalali_syncing__ = true;
            ctrl.set_value(iso);
            ctrl.__jalali_syncing__ = false;
          }
          setInputValSafe(ctrl, $inp, J.isoToJalali(iso) || raw);
          setDisplay(ctrl, J.isoToJalali(iso) || raw);
        }
      }
    });

    $inp.data('jalali-init', true);
  }

  function bindPickerDatetime(ctrl) {
    const $inp = ctrl.$input;
    if (!$inp || !$inp.length) return;
    if ($inp.data('jalali-init') === true) return;

    destroyFlatpickrIfAny($inp);
    $inp.attr('placeholder', 'YYYY-MM-DD HH:mm');
    const selector = ensureId($inp, ctrl.df && ctrl.df.fieldname ? ctrl.df.fieldname : 'datetime');

    if (typeof $.fn.MdPersianDateTimePicker === 'function') {
      try {
        $inp.MdPersianDateTimePicker({
          targetTextSelector: selector,
          englishNumber: true,
          enableTimePicker: true,
          isGregorian: false,
          dateFormat: 'yyyy-MM-dd',
          textFormat: 'yyyy-MM-dd HH:mm',
          modalMode: false
        });
      } catch (e) { console.warn('Jalali: picker init failed (datetime).', e); }
    }

    $inp.off('change.jalali input.jalali blur.jalali');
    $inp.on('input.jalali change.jalali blur.jalali', function () {
      if (ctrl.__jalali_setting__) return;
      let raw = J.normalizeHyphen($inp.val());
      if ($inp.val() !== raw) $inp.val(raw);

      const mt = raw.match(/^(\d{3,4}-\d{1,2}-\d{1,2})\s+(\d{1,2}:\d{2})(?::\d{2})?$/);
      if (mt) {
        const jdate = mt[1];
        const time = mt[2];
        const isoDate = J.jalaliToISO(jdate);
        if (isoDate) {
          const isoVal = `${isoDate} ${time}:00`;
          if (ctrl.value !== isoVal) {
            ctrl.__jalali_syncing__ = true;
            ctrl.set_value(isoVal);
            ctrl.__jalali_syncing__ = false;
          }
          const jtext = `${J.isoToJalali(isoDate)} ${time}`;
          setInputValSafe(ctrl, $inp, jtext);
          setDisplay(ctrl, jtext);
        }
      }
    });

    $inp.data('jalali-init', true);
  }

  function bindPickerDateRange(ctrl) {
    const $from = ctrl.$input_from;
    const $to = ctrl.$input_to;

    if ($from && $from.length && !$from.data('jalali-init')) {
      destroyFlatpickrIfAny($from);
      $from.attr('placeholder', 'YYYY-MM-DD');
      const selFrom = ensureId($from, (ctrl.df && ctrl.df.fieldname) ? ctrl.df.fieldname + '-from' : 'date-from');
      if (typeof $.fn.MdPersianDateTimePicker === 'function') {
        try {
          $from.MdPersianDateTimePicker({
            targetTextSelector: selFrom,
            englishNumber: true,
            enableTimePicker: false,
            isGregorian: false,
            dateFormat: 'yyyy-MM-dd',
            textFormat: 'yyyy-MM-dd',
            modalMode: false
          });
        } catch (e) { console.warn('Jalali: daterange from init failed.', e); }
      }
      $from.off('change.jalali input.jalali blur.jalali');
      $from.on('input.jalali change.jalali blur.jalali', function () {
        if (ctrl.__jalali_setting__) return;
        let raw = J.normalizeHyphen($from.val());
        if ($from.val() !== raw) $from.val(raw);
        const iso = J.jalaliToISO(raw);
        if (iso) {
          const cur = ctrl.get_value() || [null, null];
          const next = [iso, cur[1]];
          if (!cur[0] || cur[0] !== iso || (cur[1] !== next[1])) {
            ctrl.__jalali_syncing__ = true;
            ctrl.set_value(next);
            ctrl.__jalali_syncing__ = false;
          }
          const jtxt = J.isoToJalali(iso) || raw;
          setInputValSafe(ctrl, $from, jtxt);
          setDisplay(ctrl, `${jtxt}${cur[1] ? ' — ' + (J.isoToJalali(cur[1]) || cur[1]) : ''}`);
        }
      });
      $from.data('jalali-init', true);
    }

    if ($to && $to.length && !$to.data('jalali-init')) {
      destroyFlatpickrIfAny($to);
      $to.attr('placeholder', 'YYYY-MM-DD');
      const selTo = ensureId($to, (ctrl.df && ctrl.df.fieldname) ? ctrl.df.fieldname + '-to' : 'date-to');
      if (typeof $.fn.MdPersianDateTimePicker === 'function') {
        try {
          $to.MdPersianDateTimePicker({
            targetTextSelector: selTo,
            englishNumber: true,
            enableTimePicker: false,
            isGregorian: false,
            dateFormat: 'yyyy-MM-dd',
            textFormat: 'yyyy-MM-dd',
            modalMode: false
          });
        } catch (e) { console.warn('Jalali: daterange to init failed.', e); }
      }
      $to.off('change.jalali input.jalali blur.jalali');
      $to.on('input.jalali change.jalali blur.jalali', function () {
        if (ctrl.__jalali_setting__) return;
        let raw = J.normalizeHyphen($to.val());
        if ($to.val() !== raw) $to.val(raw);
        const iso = J.jalaliToISO(raw);
        if (iso) {
          const cur = ctrl.get_value() || [null, null];
          const next = [cur[0], iso];
          if (!cur[1] || cur[1] !== iso || (cur[0] !== next[0])) {
            ctrl.__jalali_syncing__ = true;
            ctrl.set_value(next);
            ctrl.__jalali_syncing__ = false;
          }
          const jtxt = J.isoToJalali(iso) || raw;
          setInputValSafe(ctrl, $to, jtxt);
          setDisplay(ctrl, `${cur[0] ? (J.isoToJalali(cur[0]) || cur[0]) + ' — ' : ''}${jtxt}`);
        }
      });
      $to.data('jalali-init', true);
    }
  }

  // Formatters override for read-only/disabled displays everywhere
  function patchFormatters() {
    frappe.form = frappe.form || {};
    frappe.form.formatters = frappe.form.formatters || {};
    const fmt = frappe.form.formatters;

    const origDate = fmt.Date;
    const origDatetime = fmt.Datetime;
    const origDateRange = fmt.DateRange;

    fmt.Date = function(value, df, options, doc) {
      if (!value) return '';
      const v = String(value).replace(/\//g, '-').trim();
      const mISO = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (mISO) {
        const j = J.isoToJalali(v);
        if (j) return j;
      }
      return origDate ? origDate(value, df, options, doc) : value;
    };

    fmt.Datetime = function(value, df, options, doc) {
      if (!value) return '';
      const v = String(value).replace(/\//g, '-').trim();
      const m = v.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?/);
      if (m) {
        const j = J.isoToJalali(m[1]);
        if (j) return `${j} ${m[2]}`;
      }
      return origDatetime ? origDatetime(value, df, options, doc) : value;
    };

    fmt.DateRange = function(value, df, options, doc) {
      if (Array.isArray(value) && value.length === 2) {
        const from = value[0], to = value[1];
        const jf = (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) ? (J.isoToJalali(from) || from) : (from || '');
        const jt = (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) ? (J.isoToJalali(to) || to) : (to || '');
        return [jf, jt].filter(Boolean).join(' — ');
      }
      return origDateRange ? origDateRange(value, df, options, doc) : (value || '');
    };

    // Also hook frappe.format fallback (safety net)
    const origFormat = frappe.format;
    frappe.format = function(value, df, options, doc) {
      if (df && (df.fieldtype === 'Date' || df.fieldtype === 'Datetime' || df.fieldtype === 'DateRange')) {
        return (fmt[df.fieldtype] || origFormat)(value, df, options, doc);
      }
      return origFormat ? origFormat(value, df, options, doc) : value;
    };
  }

  // Apply prototypes patch
  waitForDeps(function applyPatch() {
    patchFormatters();

    const originals = {
      date: {
        make_input: frappe.ui.form.ControlDate.prototype.make_input,
        set_formatted_input: frappe.ui.form.ControlDate.prototype.set_formatted_input,
        make_picker: frappe.ui.form.ControlDate.prototype.make_picker,
        parse: frappe.ui.form.ControlDate.prototype.parse
      },
      datetime: {
        make_input: frappe.ui.form.ControlDatetime.prototype.make_input,
        set_formatted_input: frappe.ui.form.ControlDatetime.prototype.set_formatted_input,
        make_picker: frappe.ui.form.ControlDatetime.prototype.make_picker,
        parse: frappe.ui.form.ControlDatetime.prototype.parse
      },
      daterange: {
        make_input: frappe.ui.form.ControlDateRange.prototype.make_input,
        set_formatted_input: frappe.ui.form.ControlDateRange.prototype.set_formatted_input
      }
    };

    // ControlDate
    frappe.ui.form.ControlDate.prototype.make_picker = function () { /* disable default picker */ };
    frappe.ui.form.ControlDate.prototype.make_input = function () {
      originals.date.make_input.call(this);
      bindPickerDate(this);
    };
    frappe.ui.form.ControlDate.prototype.set_formatted_input = function (value) {
      if (this.__jalali_syncing__) return;
      const $inp = this.$input;
      if (!value) {
        if ($inp && $inp.length) setInputValSafe(this, $inp, '');
        setDisplay(this, '');
        return;
      }
      const iso = String(value).trim();
      const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        const j = J.isoToJalali(iso);
        if (j) {
          if ($inp && $inp.length) setInputValSafe(this, $inp, j);
          setDisplay(this, j);
          return;
        }
      }
      return originals.date.set_formatted_input.call(this, value);
    };
    frappe.ui.form.ControlDate.prototype.parse = function (value) {
      if (!value) return value;
      const s = J.normalizeHyphen(value);
      if (/^\d{3,4}-\d{1,2}-\d{1,2}$/.test(s)) {
        const iso = J.jalaliToISO(s);
        return iso || value;
      }
      return originals.date.parse ? originals.date.parse.call(this, value) : value;
    };

    // ControlDatetime
    frappe.ui.form.ControlDatetime.prototype.make_picker = function () { /* disable default picker */ };
    frappe.ui.form.ControlDatetime.prototype.make_input = function () {
      originals.datetime.make_input.call(this);
      bindPickerDatetime(this);
    };
    frappe.ui.form.ControlDatetime.prototype.set_formatted_input = function (value) {
      if (this.__jalali_syncing__) return;
      const $inp = this.$input;
      if (!value) {
        if ($inp && $inp.length) setInputValSafe(this, $inp, '');
        setDisplay(this, '');
        return;
      }
      const s = String(value).trim();
      const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?/);
      if (m) {
        const j = J.isoToJalali(m[1]);
        if (j) {
          const txt = `${j} ${m[2]}`;
          if ($inp && $inp.length) setInputValSafe(this, $inp, txt);
          setDisplay(this, txt);
          return;
        }
      }
      return originals.datetime.set_formatted_input.call(this, value);
    };
    frappe.ui.form.ControlDatetime.prototype.parse = function (value) {
      if (!value) return value;
      const s = J.normalizeHyphen(value);
      const m = s.match(/^(\d{3,4}-\d{1,2}-\d{1,2})\s+(\d{1,2}:\d{2})(?::\d{2})?$/);
      if (m) {
        const isoDate = J.jalaliToISO(m[1]);
        if (isoDate) return `${isoDate} ${m[2]}:00`;
      }
      return originals.datetime.parse ? originals.datetime.parse.call(this, value) : value;
    };

    // ControlDateRange
    frappe.ui.form.ControlDateRange.prototype.make_input = function () {
      originals.daterange.make_input.call(this);
      bindPickerDateRange(this);
    };
    frappe.ui.form.ControlDateRange.prototype.set_formatted_input = function (value) {
      const $from = this.$input_from, $to = this.$input_to;
      if (!value || !Array.isArray(value)) {
        if ($from && $from.length) setInputValSafe(this, $from, '');
        if ($to && $to.length) setInputValSafe(this, $to, '');
        setDisplay(this, '');
        return;
      }
      const [from, to] = value;
      const jf = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? (J.isoToJalali(from) || from) : '';
      const jt = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? (J.isoToJalali(to) || to) : '';
      if ($from && $from.length) setInputValSafe(this, $from, jf);
      if ($to && $to.length) setInputValSafe(this, $to, jt);
      setDisplay(this, [jf, jt].filter(Boolean).join(' — '));
    };

    console.log('Jalali patch applied (hyphen format + disabled display fixed).');

    // Optional: force re-render visible read-only values currently on page
    setTimeout(() => {
      $('.control-value').each(function() {
        const $el = $(this);
        const dfType = ($el.closest('.frappe-control').data('fieldtype') || '').toString();
        const txt = $el.text().trim().replace(/\//g, '-');
        if (dfType === 'Date' && /^\d{4}-\d{2}-\d{2}$/.test(txt)) {
          const j = J.isoToJalali(txt); if (j) $el.text(j).attr('title', j);
        } else if (dfType === 'Datetime') {
          const m = txt.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
          if (m) {
            const j = J.isoToJalali(m[1]); if (j) { const t = `${j} ${m[2]}`; $el.text(t).attr('title', t); }
          }
        }
      });
    }, 200);
  });

})();
