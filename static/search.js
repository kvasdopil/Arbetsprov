function escapeHtml(text) {
  var repl = {
    '"': '&quot;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  };
  return text.replace(/["&<>]/g, function(a) { return repl[a] });
}

// ==== constants ====

var SEARCH_THROTTLE = 300;
var MAX_RESULTS = 5;

// ==== data items ====

var items = [];
var suggestions = [];
var focused = -1;

// ==== dom element refs ====

var inputEl;
var suggestionsEl;
var searchesEl;

// ==== renderers ====

function renderSearches() {
  var text = items.map(function(item, i) {
    return [
      '<li class="item">',
        '<h4 class="title">', escapeHtml(item.text), '</h4>',
        '<time class="time">', item.date.toLocaleString(), '</time>',
        '<button class="remove" onClick="javascript: removeSearchItem(', i, ')">',
          '<div class="remove-icon"></div>',
        '</button>',
      '</li>',
    ].join(' ')
  });

  searchesEl.innerHTML = text.join(' ');
}

function renderSuggestions() {
  var text = suggestions.map(function(item, i) {
    return [
      '<li class="', (i === focused ? 'item focused' : 'item'), '" ',
        'onClick="javascript: addSearchItem(\'', escapeHtml(item), '\')" ',
        'onmouseenter="javascript: setFocusedItem(', i, ')" ',
      '>',
        escapeHtml(item),
      '</li>',
    ].join('')
  });

  suggestionsEl.innerHTML = text.join(' ');
}

// ==== data manipulation ====

function addSearchItem(text) {
  if (!text || !text.trim()) {
    return;
  }

  items.unshift({
    text: text,
    date: new Date(),
  });

  suggestions = [];

  inputEl.value = '';

  renderSearches();
  renderSuggestions();
}

function removeSearchItem(i) {
  items.splice(i, 1);

  renderSearches();
}

function showSuggestions(items) {
  if (items) {
    suggestions = items.map(function(item) { return item.name; }).slice(0, MAX_RESULTS);
  } else {
    suggestions = [];
  }
  focused = 0;
  renderSuggestions();
}

function setFocusedItem(f) {
  if (f !== focused) {
    focused = f;
    renderSuggestions();
  }
}

// ==== ajax ====

function doSearch() {
  var text = inputEl.value.trim();

  if (text !== '') {
    fetch('https://api.github.com/search/repositories?q=' + encodeURIComponent(text))
      .then(function(res) { return res.json(); })
      .then(function(json) { return showSuggestions(json && json.items); })
      .catch(function(e) { console.error(e) });
  }
}

// ==== entry point ====

function onReady() {
  var timeout;

  inputEl = document.querySelector('.search > input');
  suggestionsEl = document.querySelector('.suggestions');
  searchesEl = document.querySelector('.searches');

  var onChanged = function(event) {
    if (timeout) {
      clearTimeout(timeout);
    }

    if (event.code === 'Enter') {
      if (suggestions.length) {
        addSearchItem(suggestions[focused]);
      }
    } else {
      timeout = setTimeout(doSearch, SEARCH_THROTTLE);
    }
  };

  inputEl.onkeypress = onChanged;
  inputEl.onkeydown = function(event) {
    if (event.code === 'ArrowDown') {
      setFocusedItem(focused < suggestions.length - 1 ? focused + 1 : focused);
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
