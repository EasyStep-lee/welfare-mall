export type AuditRisk = 'low' | 'medium' | 'high';

export type AuditActor = {
  userId: string;
  type: 'platform' | 'franchise' | 'merchant' | 'system';
};

export type AuditTarget = {
  type: string;
  id: string;
};

export type CreateAuditEventInput = {
  actor: AuditActor;
  action: string;
  target: AuditTarget;
  reason: string;
  risk: AuditRisk;
  occurredAt?: Date;
};

export type AuditEvent = {
  actor: AuditActor;
  action: string;
  target: AuditTarget;
  reason: string;
  risk: AuditRisk;
  occurredAt: string;
};

export function createAuditEvent(input: CreateAuditEventInput): AuditEvent {
  return {
    actor: input.actor,
    action: input.action,
    target: input.target,
    reason: input.reason,
    risk: input.risk,
    occurredAt: (input.occurredAt ?? new Date()).toISOString()
  };
}

