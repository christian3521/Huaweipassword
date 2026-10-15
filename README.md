# Visualizador de senha Huawei

Página estática que mostra a senha guardada em strings `$2...$` dos arquivos de
configuração de roteadores Huawei. Tudo roda no navegador: nenhum dado sai da
sua máquina e não há chamadas de rede.

## Como usar

Abra `index.html` no navegador (funciona direto do disco, sem servidor), cole o
texto que começa com `$2` e termina com `$` e leia a senha. É possível colar
várias strings, uma por linha, ou a linha inteira do XML.

Para publicar no GitHub Pages: envie os arquivos para um repositório e ative
Pages em *Settings → Pages* usando a branch `main`.

## Como funciona

- `js/huawei.js`: decodifica o texto (base 93), separa o IV e decifra com
  AES-256-CBC usando a chave fixa que os roteadores Huawei usam.
- `vendor/crypto-js-aes.min.js`: build mínimo do crypto-js 4.0.0 (só AES, CBC,
  Hex e padding), incluído no repositório para não depender de CDN.
- `js/app.js` e `css/style.css`: interface.
- `test/test.js`: testes (`node test/test.js`).

## Créditos e licença

Derivado de [andreluis034/huawei-utility-page](https://github.com/andreluis034/huawei-utility-page),
de Fayaru, que se baseia na análise em
<https://blog.fayaru.me/posts/huawei_router_config/>. Mantido sob
**GPL-3.0** (veja `LICENSE`). O crypto-js é MIT (`vendor/crypto-js.LICENSE`).
