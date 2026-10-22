const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const wasmPath =
  process.env.MARKDOWN_WASM_PATH || path.join(root, 'src/web/wasm/md4c.js');
const context = {
  module: { exports: {} },
  exports: {},
  console,
  WebAssembly,
  TextDecoder,
  TextEncoder,
  atob,
};
vm.runInNewContext(fs.readFileSync(wasmPath, 'utf8'), context);
const wasmParser = context.module
  .exports()
  .then((module) =>
    module.cwrap('parseMarkdown', 'string', ['string', 'number', 'number'])
  );
const parsers = {
  wasm: async (markdown) => JSON.parse((await wasmParser)(markdown, 0, 1)),
};
if (process.env.MARKDOWN_NATIVE_PARSER) {
  parsers.native = async (markdown) => {
    const result = spawnSync(process.env.MARKDOWN_NATIVE_PARSER, {
      input: markdown,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
}

const text = (node) =>
  (node.content || '') + (node.children || []).map(text).join('');
const nodes = (node) => [node, ...(node.children || []).flatMap(nodes)];

for (const [name, parse] of Object.entries(parsers)) {
  test(`${name}: preserves the reported words and bold colon`, async () => {
    for (const [source, expected] of [
      ['13. Cop&#121;**:** Showcase demo', 'Copy: Showcase demo'],
      [
        '5. Schema checkpoint&#115;**:** Save schema checkpoints',
        'Schema checkpoints: Save schema checkpoints',
      ],
    ]) {
      const ast = await parse(source);
      assert.equal(text(ast), expected);
      assert.equal(
        text(nodes(ast).find((node) => node.type === 'Strong')),
        ':'
      );
    }
  });

  test(`${name}: decodes named, decimal, hexadecimal and multi-codepoint references`, async () => {
    const ast = await parse(
      'Tom &amp; Jerry &copy; &#169; &#xA9; &#20013;&#25991; &#128515; &NotNestedGreaterGreater;'
    );
    assert.equal(text(ast), 'Tom & Jerry © © © 中文 😃 ⪢̸');
  });

  test(`${name}: preserves unknown, incomplete, escaped and code references`, async () => {
    for (const [source, expected] of [
      ['&MadeUpEntity; &amp', '&MadeUpEntity; &amp'],
      ['\\&amp;', '&amp;'],
      ['`Cop&#121; &amp;`', 'Cop&#121; &amp;'],
      ['```text\nCop&#121; &amp;\n```', 'Cop&#121; &amp;\n'],
      ['&amp;#121;', '&#121;'],
    ]) {
      assert.equal(text(await parse(source)), expected);
    }
  });

  test(`${name}: replaces invalid Unicode codepoints`, async () => {
    assert.equal(text(await parse('&#0; &#xD800; &#x110000;')), '� � �');
  });

  test(`${name}: decoded punctuation stays literal text`, async () => {
    const ast = await parse('&#42;&#42;bold&#42;&#42; &#60;span&#62;');
    assert.equal(text(ast), '**bold** <span>');
    assert.equal(
      nodes(ast).some((node) => node.type === 'Strong'),
      false
    );
  });

  test(`${name}: decodes link destinations and image attributes`, async () => {
    const ast = await parse(
      '[q](/u?a=1&amp;b=2) ![alt](/i?a=1&amp;b=2 "Tom &amp; Jerry")'
    );
    const all = nodes(ast);
    assert.equal(
      all.find((node) => node.type === 'Link').attributes.url,
      '/u?a=1&b=2'
    );
    const image = all.find((node) => node.type === 'Image');
    assert.equal(image.attributes.url, '/i?a=1&b=2');
    assert.equal(image.attributes.title, 'Tom & Jerry');
  });
}
