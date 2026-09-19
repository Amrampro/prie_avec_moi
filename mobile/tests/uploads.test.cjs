const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relative, dependencies) {
  const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)((name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}


function setup(platform, { token = 'test-token', exists = true, status = 200, body = '{"file":{"url":"/uploaded"}}' } = {}) {
  const calls = [];
  const { apiAdminUploadFile } = load('services/uploads.api.ts', {
    'react-native': { Platform: { OS: platform } },
    'expo-file-system': {
      UploadType: { MULTIPART: 1 },
      File: class {
        constructor(uri) { this.uri = uri; this.exists = exists; }
        async arrayBuffer() { throw Error('Native upload must not read ArrayBuffer'); }
        async upload(url, options) { calls.push({ uri: this.uri, url, options }); return { status, body }; }
      },
    },
    '../constants/api': { API_BASE_URL: 'https://test.invalid' },
    '../stores/auth.store': { useAuthStore: { getState: () => ({ token }) } },
    'expo/fetch': { fetch: async (url, options) => {
      assert.equal(platform, 'web', 'Native uploads must not use fetch/FormData');
      if (!options) return { ok: true, blob: async () => new Blob(['media'], { type: 'image/jpeg' }) };
      calls.push({ url, options });
      return { status, text: async () => body };
    } },
  });
  return { upload: apiAdminUploadFile, calls };
}

for (const platform of ['ios', 'android', 'web']) {
  for (const [name, mime, privateAudio] of [['photo.jpg', 'image/jpeg', false], ['audio.mp3', 'audio/mpeg', false], ['premium.m4a', 'audio/mp4', true]]) {
    test(platform + ': ' + name, async () => {
      const { upload, calls } = setup(platform);
      const result = await upload('file:///' + name, name, mime, privateAudio);
      assert.equal(result.file.url, '/uploaded');
      assert.equal(calls.length, 1);
      const { url, options } = calls[0];
      assert.equal(url, 'https://test.invalid/admin/uploads' + (privateAudio ? '/premium-audio' : ''));
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      assert.equal(options.headers['Content-Type'], undefined);
      if (platform !== 'web') {
        assert.equal(options.uploadType, 1);
        assert.equal(options.fieldName, 'file');
        assert.equal(options.mimeType, mime);
        assert.equal(options.httpMethod, 'POST');
        assert.equal(calls[0].uri, 'file:///' + name);
      } else assert.equal(options.body.get('file').name, name);
    });
  }
  for (const [label, config, error] of [
    ['unauthenticated', { token: null }, /Unauthenticated/],
    ['HTTP rejection', { status: 413, body: '{"message":"Fichier trop volumineux"}' }, /Fichier trop volumineux/],
    ['non-JSON error', { status: 502, body: 'Bad gateway' }, /Bad gateway/],
    ['invalid success', { body: '{}' }, /adresse du fichier/],
  ]) {
    test(platform + ': ' + label, async () => {
      await assert.rejects(setup(platform, config).upload('file:///a.jpg', 'a.jpg', 'image/jpeg'), error);
    });
  }
}
test('missing native file is rejected before upload', async () => {
  const { upload, calls } = setup('ios', { exists: false });
  await assert.rejects(upload('file:///missing.jpg', 'a.jpg', 'image/jpeg'), /introuvable/);
  assert.equal(calls.length, 0);
});
