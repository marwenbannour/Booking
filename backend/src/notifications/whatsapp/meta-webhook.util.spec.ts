import { createHmac } from 'node:crypto';
import {
  parseMetaDeliveryStatuses,
  verifyMetaSignature,
} from './meta-webhook.util.js';

describe('verifyMetaSignature', () => {
  const appSecret = 'super-secret';
  const body = Buffer.from(JSON.stringify({ hello: 'world' }));

  it('accepts a correctly signed body', () => {
    const digest = createHmac('sha256', appSecret).update(body).digest('hex');
    expect(verifyMetaSignature(body, `sha256=${digest}`, appSecret)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const digest = createHmac('sha256', appSecret).update(body).digest('hex');
    const tampered = Buffer.from('{"hello":"mars"}');
    expect(verifyMetaSignature(tampered, `sha256=${digest}`, appSecret)).toBe(
      false,
    );
  });

  it('rejects a missing or malformed header', () => {
    expect(verifyMetaSignature(body, undefined, appSecret)).toBe(false);
    expect(verifyMetaSignature(body, 'md5=abc', appSecret)).toBe(false);
    expect(verifyMetaSignature(body, 'sha256=', appSecret)).toBe(false);
  });
});

describe('parseMetaDeliveryStatuses', () => {
  it('extracts and maps delivery statuses', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: 'wamid.1', status: 'delivered' },
                  { id: 'wamid.2', status: 'read' },
                  {
                    id: 'wamid.3',
                    status: 'failed',
                    errors: [{ code: 131026, title: 'Undeliverable' }],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = parseMetaDeliveryStatuses(payload);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ providerMessageId: 'wamid.1', status: 'DELIVERED' });
    expect(result[1]).toMatchObject({ providerMessageId: 'wamid.2', status: 'DELIVERED' });
    expect(result[2]).toMatchObject({
      providerMessageId: 'wamid.3',
      status: 'FAILED',
      errorCode: '131026',
      errorMessage: 'Undeliverable',
    });
  });

  it('returns an empty array for unrelated payloads', () => {
    expect(parseMetaDeliveryStatuses({})).toEqual([]);
    expect(parseMetaDeliveryStatuses(null)).toEqual([]);
    expect(parseMetaDeliveryStatuses({ entry: [{ changes: [{}] }] })).toEqual([]);
  });
});
