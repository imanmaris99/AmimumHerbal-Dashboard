import assert from 'node:assert/strict';
import test from 'node:test';

import { getProfileUpdateErrorMessage } from './dashboard';

test('profile update errors fall back instead of exposing provider details', () => {
  const privateMarker = 'PRIVATE_PROFILE_PROVIDER_MARKER';
  const error = {
    message: privateMarker,
    response: {
      status: 502,
      data: { detail: { message: privateMarker } },
    },
  };

  const message = getProfileUpdateErrorMessage(error);
  assert.equal(
    message,
    'Layanan admin belum bisa memproses permintaan. Coba lagi beberapa saat lagi.'
  );
  assert.equal(message.includes(privateMarker), false);
});

test('profile update errors map auth failures to safe guidance', () => {
  assert.equal(
    getProfileUpdateErrorMessage({ response: { status: 401 } }),
    'Sesi admin perlu diperbarui. Silakan login ulang.'
  );
});
