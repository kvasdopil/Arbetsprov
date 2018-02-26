function escapeHtml(text) {
  const repl = {
    '"': '&quot;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  };
  return text.replace(/["&<>]/g, a => repl[a]);
}

const SEARCH_THROTTLE = 300;
const MAX_RESULTS = 5;
const items = [];
let suggestions = [];
let focused = -1;

function renderSearches() {
  const searches = document.querySelector('.searches');

  const text = items.map((item, i) =>
    [
      '<div class="search-item">',
        '<div class="title">', escapeHtml(item.text), '</div>',
        '<div class="time">', item.date.toLocaleString(), '</div>',
        '<div class="remove" onClick="javascript: removeSearchItem(', i, ')">',
          '<div class="remove-icon"></div>',
        '</div>',
      '</div>',
    ].join(' ')
  );

  searches.innerHTML = text.join(' ');
}

function renderSuggestions() {
  const sugg = document.querySelector('.suggestions');

  const text = suggestions.map((item, i) => {
    const itemClass = 'suggestion-item' + (i === focused ? ' focused' : '');
    return [
      '<div class="', itemClass, '" onClick="javascript: addSearchItem(\'', escapeHtml(item), '\')" onmouseenter="javascript: setFocusedItem(', i, ')">',
        escapeHtml(item),
      '</div>',
    ].join('')
  });

  sugg.innerHTML = text.join(' ');
}

function addSearchItem(text) {
  if (!text || !text.trim()) {
    return;
  }

  items.unshift({
    text: text,
    date: new Date(),
  });

  suggestions = [];

  document.querySelector('.search > input').value = '';

  renderSearches();
  renderSuggestions();
}

function removeSearchItem(i) {
  items.splice(i, 1);

  renderSearches();
}

function showSuggestions(json) {
  if (json && json.items) {
    suggestions = json.items.map(item => item.name).slice(0, MAX_RESULTS);
  } else {
    suggestions = [];
  }
  focused = 0;
  renderSuggestions();
}

function doSearch() {
  const val = document.querySelector('.search > input').value;

  if (val) {
    fetch('https://api.github.com/search/repositories?q=' + encodeURIComponent(val))
      .then(res => res.json())
      .then(json => showSuggestions(json))
      .catch(e => console.error(e));
  }
}

function setFocusedItem(f) {
  if (f !== focused) {
    focused = f;
    renderSuggestions();
  }
}

let timeout;

function onReady() {
  const input = document.querySelector('.search > input');
  const onChanged = (event) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    if (event.code === 'Enter') {
      if (suggestions.length) {
        addSearchItem(suggestions[focused]);
        input.value = '';
      }
    } else {
      timeout = setTimeout(doSearch, SEARCH_THROTTLE);
    }
  };

  input.onkeypress = onChanged;
  input.onkeydown = (event) => {
    if (event.code === 'ArrowDown') {
      setFocusedItem(focused < suggestions.length - 1 ? focused + 1 : suggestions.length);
    }

    if (event.code === 'ArrowUp') {
      setFocusedItem(focused > 1 ? focused - 1 : 0);
    }

    if (event.code === 'Escape') {
      showSuggestions(false);
    }

    if (event.code === 'Backspace') {
      // onkeypress is not fired when backpace is pressed, fix that
      onChanged(event);
    }
  };
}

document.addEventListener('DOMContentLoaded', onReady, false);
