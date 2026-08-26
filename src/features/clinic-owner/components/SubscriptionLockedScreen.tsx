import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  CreditCard, 
  LogOut, 
  Mail, 
  CheckCircle2, 
  Smartphone, 
  RefreshCw,
  X
} from 'lucide-react';
import { mockPaymentService } from '../../payments/services/mockPaymentService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import type { Subscription } from '../../subscriptions/types';
import type { PaymentFormData, PaymentMethod } from '../../payments/types';

interface SubscriptionLockedScreenProps {
  subscription: Subscription | null;
  clinicName: string;
  userEmail: string;
  userName: string;
  onLogout: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function SubscriptionLockedScreen({
  subscription,
  clinicName,
  userEmail,
  userName,
  onLogout,
  showToast
}: SubscriptionLockedScreenProps) {
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const plan = subscription ? mockPlanService.getPlanById(subscription.planId) : null;
  const planName = plan?.name || subscription?.priceSnapshot?.planName || 'Max Enterprise Plan';
  const defaultMonthlyAmount = plan?.monthlyPrice || subscription?.priceSnapshot?.monthlyPrice || 10000;
  const [amountInput, setAmountInput] = useState(String(defaultMonthlyAmount));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = subscription?.status || 'suspended';
  const isExpired = status === 'expired';

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      showToast('Please enter the GCash/Maya reference number.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const amount = Number(amountInput) || defaultMonthlyAmount;
      
      const payload: PaymentFormData = {
        ownerType: 'subscriber',
        registrationId: '',
        subscriberId: subscription?.subscriberId || '',
        subscriptionId: subscription?.id || '',
        planId: subscription?.planId || '',
        payerName: userName || 'Clinic Owner',
        payerEmail: userEmail || '',
        amount,
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        paymentDate: new Date().toISOString().split('T')[0],
        notes: notes || `Renewal remittance submitted from lock screen. (${planName})`,
        administrativeNotes: 'Submitted via SubscriptionLockedScreen gatekeeper',
        proofFileName: 'gcash_remittance_proof.png',
        proofFileType: 'image/png',
        allocationMode: 'subscription_renewal',
        allocationAmount: amount
      };

      const result = mockPaymentService.createPayment(payload);
      setIsSubmitting(false);

      if (result.ok) {
        showToast('Renewal payment submitted! Platform Admin will verify and reactivate your workspace shortly.', 'success');
        setRenewalModalOpen(false);
        setReferenceNumber('');
        setNotes('');
      } else {
        showToast(result.error || 'Failed to record remittance.', 'error');
      }
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'inherit'
    }}>
      {/* TOP HEADER */}
      <header style={{
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Lock size={20} />
          </div>
          <div>
            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{clinicName || 'Angelo Dental Clinic'}</strong>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>• Clinic Workspace</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-outline"
          style={{
            width: 'auto',
            height: '36px',
            padding: '0 0.85rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </header>

      {/* CENTER LOCK CARD */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          maxWidth: '620px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden'
        }}>
          {/* HEADER STRIP */}
          <div style={{
            backgroundColor: isExpired ? '#fef3c7' : '#fee2e2',
            padding: '1.5rem 2rem',
            borderBottom: `1px solid ${isExpired ? '#fde68a' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: isExpired ? '#d97706' : '#dc2626',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.6rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                backgroundColor: isExpired ? '#b45309' : '#991b1b',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.4rem'
              }}>
                {isExpired ? 'Subscription Expired' : 'Subscription Suspended'}
              </div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                Clinic Workspace Access Paused
              </h2>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>
                Clinical operations, patient charting, odontograms, and appointments for <strong>{clinicName}</strong> are temporarily restricted.
              </p>
            </div>
          </div>

          {/* CARD BODY */}
          <div style={{ padding: '2rem' }}>
            {/* CONTRACT DETAILS BOX */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.875rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Organization:</span>
                <strong style={{ color: '#0f172a' }}>{clinicName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Plan Tier:</span>
                <strong style={{ color: '#7c3aed' }}>{planName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Contract Reference:</span>
                <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{subscription?.subscriptionNumber || 'SCP-000101'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Account Status:</span>
                <span style={{ color: isExpired ? '#d97706' : '#dc2626', fontWeight: 700, textTransform: 'capitalize' }}>
                  ● {status}
                </span>
              </div>
            </div>

            {/* ACTION CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '46px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '10px'
                }}
                onClick={() => setRenewalModalOpen(true)}
              >
                <CreditCard size={18} /> Renew Subscription / Settle Remittance
              </button>
            </div>

            {/* SUPPORT CONTACT BOX */}
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.825rem',
              color: '#1e40af'
            }}>
              <Mail size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong>Need immediate assistance or verification?</strong>
                <div style={{ marginTop: '0.2rem', color: '#3b82f6' }}>
                  Email support at <a href="mailto:pnjdentalwebsite@gmail.com" style={{ color: '#1d4ed8', fontWeight: 600 }}>pnjdentalwebsite@gmail.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* RENEWAL PAYMENT MODAL */}
      {renewalModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            animation: 'modalSlideUp 0.2s ease-out'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Smartphone size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Subscription Renewal Remittance</h3>
              </div>
              <button
                onClick={() => setRenewalModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', padding: '0.85rem', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534' }}>
                <strong>GCash Remittance Instructions:</strong>
                <div>Send <strong>₱7,990.00</strong> to <strong>0953-834-3050 (PNJ Platform Admin)</strong> and input the reference code below.</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Payment Channel</label>
                  <select
                    className="form-input"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    style={{ width: '100%', height: '40px', fontSize: '0.875rem' }}
                  >
                    <option value="gcash">GCash (Electronic Wallet)</option>
                    <option value="maya">Maya</option>
                    <option value="bank_transfer">Bank Transfer (BDO / BPI)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Amount (PHP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '0.875rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>GCash / Transaction Reference No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GCASH-20260824-998812"
                    className="form-input"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Administrative Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Renewal for September 2026 billing cycle"
                    className="form-input"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: 'auto', padding: '0.45rem 1rem' }}
                  onClick={() => setRenewalModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '0.45rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {isSubmitting ? <RefreshCw size={15} className="spin" /> : <CheckCircle2 size={15} />}
                  Submit Remittance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
