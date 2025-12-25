// stapp/public/js/calendar/jalali-calendar.patch.js
(function () {
  'use strict';

  if (window.__jalali_calendar_patch_applied__) return;
  window.__jalali_calendar_patch_applied__ = true;

  function waitForDeps(done, tries = 100) {
    const t = setInterval(() => {
      const ok =
        typeof frappe !== 'undefined' &&
        frappe.views && frappe.views.Calendar &&
        typeof $ !== 'undefined' &&
        $.fn && typeof $.fn.fullCalendar === 'function' &&
        typeof moment !== 'undefined';
      if (ok) {
        clearInterval(t);
        done();
      } else if (--tries <= 0) {
        clearInterval(t);
        console.error('Jalali Calendar: dependencies not ready.');
      }
    }, 120);
  }

  function isJalaaliCapable() {
    return !!(window.moment && moment.fn && typeof moment.fn.jYear === 'function');
  }

  function setupMomentPersian() {
    try {
      if (typeof moment.loadPersian === 'function') {
        moment.loadPersian({ usePersianDigits: false, dialect: 'persian-modern' });
      }
      if (typeof moment.locale === 'function') {
        moment.locale('fa');
      }
    } catch (e) {
      console.warn('Jalali Calendar: moment Persian setup failed', e);
    }
  }

  function formatJTitle(view) {
    if (!isJalaaliCapable()) return null;
    const start = view && view.intervalStart ? view.intervalStart.clone() : null;
    const end = view && view.intervalEnd ? view.intervalEnd.clone() : null;
    if (!start) return null;

    const name = (view.name || view.type || '').toLowerCase();
    if (name.indexOf('month') >= 0) {
      return start.format('jMMMM jYYYY');
    }
    if (name.indexOf('week') >= 0 && end) {
      const e = end.clone().subtract(1, 'day');
      return `${start.format('jD jMMMM jYYYY')} - ${e.format('jD jMMMM jYYYY')}`;
    }
    if (name.indexOf('day') >= 0) {
      return start.format('jD jMMMM jYYYY');
    }
    if (name.indexOf('list') >= 0 && end) {
      const e = end.clone().subtract(1, 'day');
      return `${start.format('jD jMMMM jYYYY')} - ${e.format('jD jMMMM jYYYY')}`;
    }
    return start.format('jMMMM jYYYY');
  }

  function forceJalaliHeaderAndCells(view, el) {
    if (!isJalaaliCapable()) return;
    try {
      const $root = $(el).closest('.fc');
      if ($root && $root.length) {
        $root.addClass('fc-rtl').attr('dir', 'rtl');
      }

      // Fix title to Jalali text
      const jTitle = formatJTitle(view);
      if (jTitle) {
        const $title = $root.find('.fc-center h2');
        if ($title && $title.length) {
          $title.text(jTitle);
        }
      }

      // Fix day numbers in month/week grids (fallback if plugin didn't convert cells)
      $(el).find('.fc-day-number').each(function () {
        const $num = $(this);
        let iso = $num.closest('td').attr('data-date');
        if (!iso) {
          // Some themes keep date on .fc-day-top
          iso = $num.closest('.fc-day-top').attr('data-date');
        }
        if (iso) {
          const jd = moment(iso).format('jD');
          $num.text(jd);
        }
      });

      // Fix column headers (week/day views)
      $(el).find('th.fc-day-header[data-date]').each(function () {
        const iso = $(this).attr('data-date');
        if (iso) {
          const label = moment(iso).format('ddd jD');
          const $span = $(this).find('span');
          if ($span.length) $span.text(label);
          else $(this).text(label);
        }
      });
    } catch (e) {
      console.warn('Jalali Calendar: viewRender fallback failed', e);
    }
  }

  function applyPatch() {
    const Proto = frappe.views.Calendar && frappe.views.Calendar.prototype;
    if (!Proto) {
      console.warn('Jalali Calendar: frappe.views.Calendar prototype not found');
      return;
    }
    if (Proto.__jalali_calendar_patched__) return;
    Proto.__jalali_calendar_patched__ = true;

    const original_get_calendar_options = Proto.get_calendar_options;

    Proto.get_calendar_options = function () {
      const opts = (original_get_calendar_options ? original_get_calendar_options.call(this) : {}) || {};

      // Prepare moment for Persian
      setupMomentPersian();

      // Core i18n/RTL
      opts.isRTL = true;
      opts.locale = 'fa';
      opts.firstDay = 6;
      opts.timeFormat = 'HH:mm';

      // Prefer Jalaali plugin if available
      if (isJalaaliCapable()) {
        // Different plugins use different flags; set both
        opts.isJalaali = true;
        opts.isJalali = true;

        // Title and column formats per view
        opts.titleFormat = 'jMMMM jYYYY';
        opts.columnFormat = 'jD ddd';
        opts.views = $.extend(true, {}, opts.views || {}, {
          month: { titleFormat: 'jMMMM jYYYY' },
          basicMonth: { titleFormat: 'jMMMM jYYYY' },
          agendaWeek: { titleFormat: 'jD jMMMM jYYYY' },
          basicWeek: { titleFormat: 'jD jMMMM jYYYY' },
          agendaDay: { titleFormat: 'jD jMMMM jYYYY' },
          basicDay: { titleFormat: 'jD jMMMM jYYYY' },
          listMonth: { titleFormat: 'jMMMM jYYYY' },
          listWeek: { titleFormat: 'jD jMMMM jYYYY' },
          listDay: { titleFormat: 'jD jMMMM jYYYY' }
        });
      }

      // Persian button texts
      opts.buttonText = $.extend(true, {}, opts.buttonText || {}, {
        today: 'امروز',
        month: 'ماه',
        week: 'هفته',
        day: 'روز',
        list: 'فهرست'
      });

      // Fallback conversion on each render to guarantee Jalali header/cells
      const user_viewRender = opts.viewRender;
      opts.viewRender = function (view, el) {
        try {
          const $root = $(el).closest('.fc');
          if ($root && $root.length) {
            $root.addClass('fc-rtl').attr('dir', 'rtl');
          }
          forceJalaliHeaderAndCells(view, el);
        } catch (e) {}
        if (typeof user_viewRender === 'function') {
          user_viewRender(view, el);
        }
      };

      return opts;
    };

    console.log('Jalali Calendar patch applied. isJalaaliCapable:', isJalaaliCapable());
  }

  waitForDeps(applyPatch);
})();
