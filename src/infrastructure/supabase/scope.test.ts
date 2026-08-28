import { describe, expect, it } from 'vitest';
import { createClinicScope, createSubscriberScope } from './scope';

describe('Supabase scope guards', () => {
  it('creates a branch operation scope only when both tenant and clinic exist', () => {
    expect(createClinicScope('subscriber-1', 'clinic-1')).toEqual({
      subscriberId: 'subscriber-1',
      clinicId: 'clinic-1',
    });
  });

  it('rejects blank tenant or clinic identifiers before a query is attempted', () => {
    expect(() => createSubscriberScope('   ')).toThrow('subscriberId is required');
    expect(() => createClinicScope('subscriber-1', '')).toThrow('clinicId is required');
  });
});
