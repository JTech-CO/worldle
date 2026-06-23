// Accessible autocomplete combobox over the country list. Filters by Korean
// name, English name and aliases; supports keyboard navigation and selection.
import { getLang, countryName } from '../i18n.js';

const MAX_SUGGESTIONS = 8;

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const squash = (s) => norm(s).replace(/\s+/g, ''); // space-insensitive form

function searchTerms(c) {
  return [c.ko, c.en, ...(c.aliases || [])];
}

/**
 * @param {{ input: HTMLInputElement, list: HTMLElement }} els
 */
export function createCombobox({ input, list }) {
  let countries = [];
  let filtered = [];
  let activeIndex = -1;
  let pickHandler = () => {};
  let composing = false; // true while a CJK/IME character is being composed
  let blurTimer = 0;

  function close() {
    list.hidden = true;
    list.replaceChildren();
    activeIndex = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function rankMatches(query) {
    const q = norm(query);
    if (!q) return [];
    const starts = [];
    const contains = [];
    for (const c of countries) {
      const terms = searchTerms(c).map(norm);
      if (terms.some((t) => t.startsWith(q))) starts.push(c);
      else if (terms.some((t) => t.includes(q))) contains.push(c);
      if (starts.length >= MAX_SUGGESTIONS) break;
    }
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
  }

  function renderList() {
    list.replaceChildren();
    filtered.forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'suggestion';
      li.id = `sugg-${c.id}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === activeIndex));

      const primary = document.createElement('span');
      primary.textContent = countryName(c);
      const sub = document.createElement('span');
      sub.className = 's-sub';
      sub.textContent = getLang() === 'ko' ? c.en : c.ko;

      li.append(primary, sub);
      li.addEventListener('mousedown', (e) => {
        e.preventDefault(); // keep focus on the input
        pick(c);
      });
      list.appendChild(li);
    });
    list.hidden = filtered.length === 0;
    input.setAttribute('aria-expanded', String(filtered.length > 0));
  }

  function setActive(next) {
    const options = [...list.children];
    if (activeIndex >= 0 && options[activeIndex]) options[activeIndex].setAttribute('aria-selected', 'false');
    activeIndex = next;
    if (activeIndex >= 0 && options[activeIndex]) {
      options[activeIndex].setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', options[activeIndex].id);
      options[activeIndex].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function pick(country) {
    input.value = countryName(country);
    close();
    pickHandler(country);
  }

  /** Resolve current text to a country: exact name match, else sole/top match. */
  function resolveInput() {
    const q = norm(input.value);
    if (!q) return null;
    const sq = squash(input.value);
    const exact = countries.find((c) =>
      searchTerms(c).some((term) => norm(term) === q || squash(term) === sq));
    if (exact) return exact;
    const matches = rankMatches(input.value);
    return matches.length ? matches[0] : null;
  }

  input.addEventListener('input', () => {
    clearTimeout(blurTimer);
    filtered = rankMatches(input.value);
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant'); // list was rebuilt; old id is gone
    renderList();
  });

  // Track IME composition so a Hangul-commit Enter is never read as submit/select.
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { setTimeout(() => { composing = false; }, 0); });

  input.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return; // mid-composition key (e.g. Hangul)
    if (list.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      filtered = rankMatches(input.value);
      if (filtered.length) renderList();
    }
    switch (e.key) {
      case 'ArrowDown':
        if (!filtered.length) return;
        e.preventDefault();
        setActive((activeIndex + 1) % filtered.length);
        break;
      case 'ArrowUp':
        if (!filtered.length) return;
        e.preventDefault();
        setActive((activeIndex - 1 + filtered.length) % filtered.length);
        break;
      case 'Enter':
        if (activeIndex >= 0 && filtered[activeIndex]) {
          e.preventDefault(); // pick the highlighted item instead of submitting raw text
          pick(filtered[activeIndex]);
        }
        break;
      case 'Escape':
        if (!list.hidden) { e.preventDefault(); close(); }
        break;
      default:
        break;
    }
  });

  // Close when focus leaves the combo. The timer lets a suggestion mousedown win
  // the race; cancel it if focus returns so a quick re-focus keeps the list open.
  input.addEventListener('blur', () => { blurTimer = setTimeout(close, 120); });
  input.addEventListener('focus', () => clearTimeout(blurTimer));

  return {
    setCountries(list_) { countries = list_; },
    onPick(cb) { pickHandler = cb; },
    resolveInput,
    isComposing() { return composing; },
    focus() { input.focus(); },
    clear() { input.value = ''; close(); },
    setDisabled(disabled) { input.disabled = disabled; if (disabled) close(); },
  };
}
