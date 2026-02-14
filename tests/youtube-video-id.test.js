const test = require('node:test');
const assert = require('node:assert/strict');
const { parseYouTubeVideoId } = require('../lib/youtube');

test('parses youtu.be links', () => {
  assert.equal(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('parses watch?v links', () => {
  assert.equal(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('parses shorts links', () => {
  assert.equal(parseYouTubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ?si=abc'), 'dQw4w9WgXcQ');
});

test('parses embed links', () => {
  assert.equal(parseYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('returns null for invalid url/video id', () => {
  assert.equal(parseYouTubeVideoId('https://example.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(parseYouTubeVideoId('not-a-valid-id'), null);
});
