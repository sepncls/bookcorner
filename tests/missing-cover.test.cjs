const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise the real render loop: a missing cover must not hide subsequent books.
test('renders every book when a cover is missing', () => {
  const elements = {};
  function element() {
    return { value: '', textContent: '', innerHTML: '', children: [],
      appendChild(child) { this.children.push(child); },
      querySelector() { return element(); },
      querySelectorAll() { return []; },
      addEventListener() {} };
  }
  const document = {
    getElementById(id) { return elements[id] ||= element(); },
    createElement() { return element(); }
  };
  document.getElementById('categoryFilter').value = 'All';
  document.getElementById('sort').value = 'title';
  const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
  const source = html.split('<script>')[1].split('</script>')[0]
    .split("document.getElementById('search').addEventListener")[0];
  const context = vm.createContext({ document, console });
  vm.runInContext(source, context);
  vm.runInContext(`loadFromText('Batch ID,Book Title,Author,Price,Notes,Picture Link\\n1,A With Cover,,1,,https://example.com/cover.jpg\\n2,B Without Cover,,2,,\\n3,C After Missing Cover,,3,,https://example.com/cover2.jpg');`, context);
  assert.equal(elements.grid.children.length, 3);
  assert.equal(elements.status.textContent, '3 shown • 3 total');
  for (const value of ['', '   ', null, undefined]) {
    context.imageInput = value;
    const normalized = vm.runInContext('normalizeImageUrl(imageInput)', context);
    assert.equal(normalized.candidates.length, 0);
  }
});
