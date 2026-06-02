import { createAuditEvent } from '../../src/iam/audit-event';

describe('createAuditEvent', () => {
  it('creates a structured high-risk audit event', () => {
    const occurredAt = new Date('2026-06-02T09:30:00.000Z');

    const event = createAuditEvent({
      actor: { userId: 'u-1', type: 'platform' },
      action: 'settlement.adjust',
      target: { type: 'settlement', id: 'st-1' },
      reason: 'Finance correction approved by manager',
      risk: 'high',
      occurredAt
    });

    expect(event).toEqual({
      actor: { userId: 'u-1', type: 'platform' },
      action: 'settlement.adjust',
      target: { type: 'settlement', id: 'st-1' },
      reason: 'Finance correction approved by manager',
      risk: 'high',
      occurredAt: occurredAt.toISOString()
    });
  });
});

