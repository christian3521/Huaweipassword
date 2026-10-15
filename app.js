(function () {
  'use strict';

  var EXAMPLE = '$2QRTqKHqFz<}*+cVC#oI,5~081XX~w5\\T*cPo5IY&TO+q0_1;p!u.[&AV$ki5$';

  var input = document.getElementById('input');
  var results = document.getElementById('results');
  var split = document.getElementById('split');
  var lastValues = [];

  // Arquivos XML escapam caracteres como &lt; e &amp;. A <textarea> decodifica
  // essas entidades sem executar nada.
  function decodeEntities(text) {
    var box = document.createElement('textarea');
    box.innerHTML = text;
    return box.value;
  }

  // Aceita a linha inteira (por exemplo, com tags ao redor) e isola o $2...$.
  function extract(line) {
    var text = decodeEntities(line.trim());
    var start = text.indexOf('$2');
    var end = text.lastIndexOf('$');
    return start >= 0 && end > start ? text.slice(start, end + 1) : text;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderValue(value) {
    var node = el('p', 'value');
    if (split.checked) {
      node.classList.add('split');
      Array.from(value).forEach(function (ch) {
        node.appendChild(el('span', 'cell', ch));
      });
    } else {
      node.textContent = value;
    }
    return node;
  }

  function copy(button, value) {
    var done = function () {
      button.textContent = 'Copiado';
      setTimeout(function () { button.textContent = 'Copiar'; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done, function () {
        button.textContent = 'Não foi possível copiar';
      });
    }
  }

  function render() {
    var lines = input.value.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    results.textContent = '';
    lastValues = [];

    if (lines.length === 0) {
      results.appendChild(el('p', 'empty', 'Cole um texto cifrado acima para ver a senha.'));
      return;
    }

    lines.forEach(function (line, index) {
      var row = el('div', 'row');
      if (lines.length > 1) row.appendChild(el('p', 'row-label', 'Linha ' + (index + 1)));

      try {
        var value = window.HuaweiCipher.decrypt(extract(line));
        lastValues.push(value);
        var line_ = el('div', 'value-line');
        line_.appendChild(renderValue(value));
        var button = el('button', 'copy', 'Copiar');
        button.type = 'button';
        button.addEventListener('click', function () { copy(button, value); });
        line_.appendChild(button);
        row.appendChild(line_);
      } catch (err) {
        row.appendChild(el('p', 'error', err.message));
      }
      results.appendChild(row);
    });
  }

  input.addEventListener('input', render);
  split.addEventListener('change', render);
  document.getElementById('example').addEventListener('click', function () {
    input.value = EXAMPLE;
    render();
  });
  document.getElementById('clear').addEventListener('click', function () {
    input.value = '';
    render();
    input.focus();
  });

  render();
})();
