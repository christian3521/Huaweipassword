// Testes: node test/test.js
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

globalThis.CryptoJS = new Function(
  fs.readFileSync(path.join(__dirname, '../vendor/crypto-js-aes.min.js'), 'utf8') + ';return CryptoJS;'
)();
const C = globalThis.CryptoJS;
const { decrypt, KEY_HEX } = require('../js/huawei.js');

// --- Cifrador usado só nos testes (inverso do decifrador) ---
function encrypt(text, ivBytes) {
  const data = Buffer.from(text, 'utf8');
  const padded = Buffer.concat([data, Buffer.alloc((16 - (data.length % 16)) % 16)]);
  const hex = (b) => Buffer.from(b).toString('hex');
  const out = C.AES.encrypt(C.enc.Hex.parse(hex(padded)), C.enc.Hex.parse(KEY_HEX), {
    iv: C.enc.Hex.parse(hex(ivBytes)), mode: C.mode.CBC, padding: C.pad.NoPadding
  });
  const bytes = Buffer.concat([Buffer.from(out.ciphertext.toString(C.enc.Hex), 'hex'), Buffer.from(ivBytes)]);
  let s = '';
  for (let g = 0; g < bytes.length; g += 4) {
    let v = bytes.readUInt32LE(g);
    for (let k = 0; k < 5; k++) {
      const d = v % 93; v = Math.floor(v / 93);
      s += String.fromCharCode(d === 0x1e ? 0x7e : d + 0x21);
    }
  }
  return '$2' + s + '$';
}

// 1) Exemplo real do projeto original
const sample = '$2QRTqKHqFz<}*+cVC#oI,5~081XX~w5\\T*cPo5IY&TO+q0_1;p!u.[&AV$ki5$';
console.log('exemplo original ->', JSON.stringify(decrypt(sample)));
assert.ok(decrypt(sample).length > 0);

// 2) Ida e volta com vários tamanhos e acentos
const iv = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
for (const pw of ['a', 'senha123', '1234567890123456', '12345678901234567', 'Pässwörd€!', 'x'.repeat(63)]) {
  assert.strictEqual(decrypt(encrypt(pw, iv)), pw);
}
for (let i = 0; i < 200; i++) {
  const rnd = require('crypto').randomBytes(16);
  const pw = require('crypto').randomBytes(1 + (i % 40)).toString('base64').slice(0, 1 + (i % 40));
  assert.strictEqual(decrypt(encrypt(pw, rnd)), pw);
}

// 3) Entradas inválidas
for (const bad of ['', 'abc', '$2$', '$2abc$', sample.slice(0, -1), '$2' + 'é'.repeat(40) + '$']) {
  assert.throws(() => decrypt(bad), Error, 'deveria falhar: ' + bad);
}
console.log('OK: todos os testes passaram');
