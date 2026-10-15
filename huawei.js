/*
 * Decifra strings "$2...$" usadas pelos roteadores Huawei nos arquivos de
 * configuração (AES-256-CBC com chave fixa + codificação ASCII em base 93).
 *
 * Baseado no trabalho de Fayaru (andreluis034/huawei-utility-page), GPL-3.0.
 */
(function (global) {
  'use strict';

  var C = global.CryptoJS;

  // Chave AES usada pelos roteadores Huawei (256 bits, em hexadecimal).
  var KEY_HEX = '6fc6e3436a53b6310dc09a475494ac774e7afb21b9e58fc8e58b5660e48e2498';
  var BLOCK = 20;   // 20 caracteres codificados = 16 bytes
  var BASE = 93;    // 0x5D

  function fail(message) {
    throw new Error(message);
  }

  // Remove o "$2" inicial e o "$" final.
  function unwrap(text) {
    if (text.length < 3 || text.charAt(0) !== '$' || text.charAt(1) !== '2' ||
        text.charAt(text.length - 1) !== '$') {
      fail('O texto precisa começar com $2 e terminar com $.');
    }
    return text.substring(2, text.length - 1);
  }

  // Caracteres visíveis -> valores 0..92.
  function toDigits(body) {
    var digits = new Array(body.length);
    for (var i = 0; i < body.length; i++) {
      var code = body.charCodeAt(i);
      if (code < 0x21 || code > 0x7e) {
        fail('Caractere inválido na posição ' + (i + 3) + '.');
      }
      digits[i] = code === 0x7e ? 0x1e : code - 0x21;
    }
    return digits;
  }

  // Cada grupo de 5 dígitos (base 93, menos significativo primeiro) vira 4 bytes.
  function digitsToBytes(digits) {
    var bytes = new Uint8Array(digits.length / 5 * 4);
    for (var g = 0; g < digits.length / 5; g++) {
      var value = 0;
      var weight = 1;
      for (var k = 0; k < 5; k++) {
        value += weight * digits[g * 5 + k];
        weight *= BASE;
      }
      if (value > 0xffffffff) fail('Os dados estão corrompidos.');
      for (var b = 0; b < 4; b++) {
        bytes[g * 4 + b] = value % 256;
        value = Math.floor(value / 256);
      }
    }
    return bytes;
  }

  function toHex(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i++) {
      out += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
    }
    return out;
  }

  function fromHex(hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  // Devolve a senha em texto, ou lança um Error com a explicação em português.
  function decrypt(input) {
    var body = unwrap(String(input).trim());
    if (body.length < BLOCK * 2 || body.length % BLOCK !== 0) {
      fail('Tamanho inválido: o conteúdo deve ter múltiplos de 20 caracteres (pelo menos 40).');
    }

    var bytes = digitsToBytes(toDigits(body));
    var iv = bytes.slice(bytes.length - 16);
    var data = bytes.slice(0, bytes.length - 16);

    var params = C.lib.CipherParams.create({ ciphertext: C.enc.Hex.parse(toHex(data)) });
    var plain = C.AES.decrypt(params, C.enc.Hex.parse(KEY_HEX), {
      iv: C.enc.Hex.parse(toHex(iv)),
      mode: C.mode.CBC,
      padding: C.pad.NoPadding
    });

    // O roteador completa o último bloco com bytes zero.
    var raw = fromHex(C.enc.Hex.stringify(plain));
    var end = raw.length;
    while (end > 0 && raw[end - 1] === 0) end--;

    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(raw.subarray(0, end));
    } catch (e) {
      fail('Não foi possível ler o resultado como texto. A string pode não ter sido gerada por um roteador Huawei.');
    }
  }

  var api = { decrypt: decrypt, KEY_HEX: KEY_HEX };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else global.HuaweiCipher = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
