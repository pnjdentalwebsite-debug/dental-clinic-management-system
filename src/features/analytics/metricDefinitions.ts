import type { MetricDefinition } from './types';

export const metricDefinitions: MetricDefinition[] = [
  {
    key: 'total_subscribers',
    label: 'Total Subscribers',
    description: 'All subscriber records currently present in the centralized subscriber service.',
    sourceRecords: ['subscribers'],
    inclusionRules: ['Include all subscriber account statuses.'],
    exclusionRules: ['None.'],
    formula: 'count(subscribers)',
    formatting: 'number',
    trendMeaning: 'increase_positive'
  },
  {
    key: 'active_subscribers',
    label: 'Active Subscribers',
    description: 'Subscribers with active account status.',
    sourceRecords: ['subscribers'],
    inclusionRules: ['subscriber.accountStatus = active'],
    exclusionRules: ['Suspended, pending, and deactivated subscribers.'],
    formula: 'count(active subscribers)',
    formatting: 'number',
    trendMeaning: 'increase_positive'
  },
  {
    key: 'mock_net_revenue',
    label: 'Net Mock Collected Amount',
    description: 'Prototype collected amount from valid approved payment states only.',
    sourceRecords: ['payments', 'refunds'],
    inclusionRules: ['Payment status is approved, partially_allocated, fully_allocated, partially_refunded, or refunded.'],
    exclusionRules: ['Rejected, voided, draft, submitted, and pending verification payments.'],
    formula: 'sum(payment.amount) - sum(payment.refundedAmount)',
    formatting: 'currency',
    trendMeaning: 'increase_positive'
  },
  {
    key: 'pending_payments',
    label: 'Pending Payments',
    description: 'Payments awaiting verification.',
    sourceRecords: ['payments'],
    inclusionRules: ['payment.verificationStatus = pending'],
    exclusionRules: ['Verified, rejected, voided, and not-required payments.'],
    formula: 'count(pending verification payments)',
    formatting: 'number',
    trendMeaning: 'increase_negative'
  },
  {
    key: 'refunded_amount',
    label: 'Refunded Amount',
    description: 'Total mock refunds stored on payment records.',
    sourceRecords: ['payments', 'refunds'],
    inclusionRules: ['All payment refundedAmount values.'],
    exclusionRules: ['None; refundedAmount is already zero for non-refunded payments.'],
    formula: 'sum(payment.refundedAmount)',
    formatting: 'currency',
    trendMeaning: 'increase_negative'
  },
  {
    key: 'registration_conversion_rate',
    label: 'Registration Conversion Rate',
    description: 'Approved or account-ready registrations divided by all registrations.',
    sourceRecords: ['registrations'],
    inclusionRules: ['paymentStatus = approved or registrationStatus = account_ready/registration_completed'],
    exclusionRules: ['None from denominator.'],
    formula: 'converted registrations / total registrations',
    formatting: 'percentage',
    trendMeaning: 'increase_positive'
  },
  {
    key: 'suspended_accounts',
    label: 'Suspended Accounts',
    description: 'Subscribers and users currently suspended.',
    sourceRecords: ['subscribers', 'users'],
    inclusionRules: ['accountStatus = suspended'],
    exclusionRules: ['Other account statuses.'],
    formula: 'count(suspended subscribers) + count(suspended users)',
    formatting: 'number',
    trendMeaning: 'increase_negative'
  },
  {
    key: 'data_quality_issues',
    label: 'Data Quality Issues',
    description: 'Detected mock cross-module inconsistencies.',
    sourceRecords: ['all centralized services'],
    inclusionRules: ['Only issues detected during analytics generation.'],
    exclusionRules: ['No automatic repair or mutation during report generation.'],
    formula: 'count(data quality warnings)',
    formatting: 'number',
    trendMeaning: 'increase_negative'
  }
];

export const metricDefinitionByKey = (key: string) => metricDefinitions.find(item => item.key === key);
