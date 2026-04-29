import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Lock, ShieldCheck, Clock, Calendar, Stethoscope,
  CreditCard, Smartphone, Building2, IndianRupee, CheckCircle2, AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import './PaymentPage.css';

/* ─── helpers ─────────────────────────────────────────────────── */
const RESERVATION_MINUTES = 15;

const METHOD_TABS = [
  { id: 'upi',        label: 'UPI',          icon: '📱' },
  { id: 'card',       label: 'Card',         icon: '💳' },
  { id: 'netbanking', label: 'Net Banking',  icon: '🏦' },
  { id: 'cash',       label: 'Cash at Clinic', icon: '🏥' },
];

const BANKS = [
  { id: 'sbi',   name: 'SBI',   logo: '🏛️' },
  { id: 'hdfc',  name: 'HDFC',  logo: '🔵' },
  { id: 'icici', name: 'ICICI', logo: '🟠' },
  { id: 'axis',  name: 'Axis',  logo: '🟣' },
  { id: 'kotak', name: 'Kotak', logo: '🔴' },
  { id: 'yes',   name: 'Yes',   logo: '🟢' },
];

const UPI_APPS = [
  { id: 'gpay',  name: 'Google Pay', emoji: '🟦' },
  { id: 'phonepe', name: 'PhonePe',  emoji: '🟪' },
  { id: 'paytm', name: 'Paytm',     emoji: '🟦' },
  { id: 'bhim',  name: 'BHIM',      emoji: '🇮🇳' },
];

const formatCard = (v) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v) =>
  v.replace(/\D/g, '').slice(0, 4).replace(/^(.{2})(.+)/, '$1/$2');

/* ─── Countdown hook ──────────────────────────────────────────── */
const useCountdown = (expiresAt) => {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      setRemaining(Math.max(0, Math.floor(diff / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
};

const fmtCountdown = (secs) => {
  if (secs === null) return '--:--';
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
};

/* ─── QR Art ──────────────────────────────────────────────────── */
const QrMockSVG = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    {/* Top-left finder */}
    <rect x="5" y="5" width="26" height="26" rx="2" fill="#0f172a"/>
    <rect x="9" y="9" width="18" height="18" rx="1" fill="#fff"/>
    <rect x="13" y="13" width="10" height="10" rx="1" fill="#0f172a"/>
    {/* Top-right finder */}
    <rect x="69" y="5" width="26" height="26" rx="2" fill="#0f172a"/>
    <rect x="73" y="9" width="18" height="18" rx="1" fill="#fff"/>
    <rect x="77" y="13" width="10" height="10" rx="1" fill="#0f172a"/>
    {/* Bottom-left finder */}
    <rect x="5" y="69" width="26" height="26" rx="2" fill="#0f172a"/>
    <rect x="9" y="73" width="18" height="18" rx="1" fill="#fff"/>
    <rect x="13" y="77" width="10" height="10" rx="1" fill="#0f172a"/>
    {/* Data dots */}
    {[40,44,48,52,56,60].map(x =>
      [5,9,13,17,21,25,40,44,48,52,56,60,75,79,83,87,91,95].map(y =>
        Math.abs(x * y) % 3 === 0 ? (
          <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="#0f172a"/>
        ) : null
      )
    )}
    {[5,9,13,17,21,25].map(x =>
      [40,44,48,52,56,60].map(y =>
        (x + y) % 5 !== 0 ? (
          <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="#0f172a"/>
        ) : null
      )
    )}
    {[75,79,83,87,91,95].map(x =>
      [40,44,48,52,56,60].map(y =>
        (x + y) % 4 !== 0 ? (
          <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="#0f172a"/>
        ) : null
      )
    )}
  </svg>
);

/* ─── Main Component ──────────────────────────────────────────── */
const PaymentPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  // Appointment data (from location.state or fetched)
  const [apptData, setApptData] = useState(state || null);
  const [fetching, setFetching] = useState(!state);

  // Payment form state
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  // Flow state: 'form' | 'processing' | 'success' | 'expired'
  const [screen, setScreen] = useState('form');
  const [processingStep, setProcessingStep] = useState(0);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState('');

  // Reservation countdown
  const reservationExpiresAt = apptData?.reservationExpiresAt;
  const secondsLeft = useCountdown(reservationExpiresAt);
  const isExpired = secondsLeft === 0;

  // Fetch appointment if not passed via state
  useEffect(() => {
    if (state) return;
    const fetch = async () => {
      try {
        const { data } = await api.get(`/appointments/myappointments`);
        const found = data.find(a => a._id === appointmentId);
        if (found) setApptData({
          doctorName: found.doctorId?.userId?.name,
          specialization: found.doctorId?.specialization,
          consultationFee: found.doctorId?.consultationFee,
          date: found.date,
          time: found.time,
          reservationExpiresAt: found.reservationExpiresAt,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, [appointmentId, state]);

  // Auto-show expired screen
  useEffect(() => {
    if (secondsLeft === 0 && screen === 'form') {
      setScreen('expired');
    }
  }, [secondsLeft, screen]);

  const handleConfirmPayment = async () => {
    setError('');
    // Validation
    if (method === 'upi' && !upiId.trim() && !selectedUpiApp) {
      setError('Please enter your UPI ID or select a UPI app.');
      return;
    }
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) { setError('Please enter a valid 16-digit card number.'); return; }
      if (!cardName.trim()) { setError('Please enter the cardholder name.'); return; }
      if (cardExpiry.length < 5) { setError('Please enter a valid expiry date (MM/YY).'); return; }
      if (cardCvv.length < 3)  { setError('Please enter a valid CVV.'); return; }
    }
    if (method === 'netbanking' && !selectedBank) {
      setError('Please select your bank.'); return;
    }

    setScreen('processing');
    setProcessingStep(0);

    // Simulate steps
    await new Promise(r => setTimeout(r, 700));  setProcessingStep(1);
    await new Promise(r => setTimeout(r, 800));  setProcessingStep(2);
    await new Promise(r => setTimeout(r, 900));  setProcessingStep(3);
    await new Promise(r => setTimeout(r, 500));

    try {
      const { data } = await api.put(`/appointments/${appointmentId}/pay`, {
        paymentMethod: method,
      });
      setSuccessData(data);
      setScreen('success');
      setTimeout(() => navigate('/patient-dashboard'), 6000);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Payment failed. Please try again.';
      if (err?.response?.status === 410) {
        setScreen('expired');
      } else {
        setScreen('form');
        setError(msg);
      }
    }
  };

  if (fetching) {
    return (
      <div className="pay-page" style={{ justifyContent: 'center' }}>
        <div className="pay-spinner" style={{ width: 48, height: 48 }} />
      </div>
    );
  }

  const fee = apptData?.consultationFee ?? 0;
  const convenienceFee = method === 'cash' ? 0 : Math.round(fee * 0.02);
  const total = fee + convenienceFee;

  const cardDisplayNumber = cardNumber
    ? cardNumber.replace(/\d(?=.{0,3} )/g, '•')
    : '•••• •••• •••• ••••';

  return (
    <div className="pay-page">
      {/* Header */}
      <div className="pay-header">
        <div className="pay-logo">
          <div className="pay-logo-icon">
            <Lock size={20} color="#fff" />
          </div>
          Health Connect Pay
        </div>
        <div className="pay-secure-badge">
          <ShieldCheck size={11} /> 256-bit SSL Secured
        </div>
      </div>

      <div className="pay-grid">

        {/* ── LEFT: Order Summary ──────────────────────────────── */}
        <div className="pay-summary">
          <div className="summary-label">Order Summary</div>

          <div className="summary-doc-row">
            <div className="summary-doc-avatar">
              {apptData?.doctorName?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div className="summary-doc-info">
              <h4>Dr. {apptData?.doctorName || 'Doctor'}</h4>
              <p>{apptData?.specialization || 'Specialist'}</p>
            </div>
          </div>

          <div className="summary-detail-row">
            <Calendar size={14} />
            <span>{apptData?.date}</span>
          </div>
          <div className="summary-detail-row">
            <Clock size={14} />
            <span>{apptData?.time}</span>
          </div>
          <div className="summary-detail-row">
            <Stethoscope size={14} />
            <span>Online Consultation</span>
          </div>

          <hr className="summary-divider" />

          <div className="summary-fee-row">
            <span>Consultation Fee</span>
            <span>₹{fee.toLocaleString('en-IN')}</span>
          </div>
          {convenienceFee > 0 && (
            <div className="summary-fee-row">
              <span>Convenience Fee (2%)</span>
              <span>₹{convenienceFee.toLocaleString('en-IN')}</span>
            </div>
          )}

          <hr className="summary-divider" />

          <div className="summary-total-row">
            <span className="label">Total</span>
            <span className="amount">₹{total.toLocaleString('en-IN')}</span>
          </div>

          {/* Reservation timer */}
          <div className={`summary-reservation ${isExpired ? 'reservation-expired' : ''}`}>
            <Clock size={16} />
            <div className="reservation-text">
              {isExpired ? (
                <>
                  <span className="reservation-countdown">Expired</span>
                  Reservation window closed
                </>
              ) : (
                <>
                  <span className="reservation-countdown">{fmtCountdown(secondsLeft)}</span>
                  Slot reserved — complete payment before timeout
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Payment Panel ─────────────────────────────── */}
        <div className="pay-panel">

          {/* SCREEN: Processing */}
          {screen === 'processing' && (
            <div className="pay-loading-overlay">
              <div className="pay-spinner" />
              <div>
                <div className="pay-loading-title">Processing Payment…</div>
                <div className="pay-loading-sub">Please do not close this window</div>
              </div>
              <div className="pay-processing-steps">
                {[
                  'Initiating secure connection',
                  'Verifying payment details',
                  'Authorizing transaction',
                  'Confirming appointment',
                ].map((label, i) => (
                  <div
                    key={i}
                    className={`pay-step ${processingStep > i ? 'done' : processingStep === i ? 'active' : ''}`}
                  >
                    <div className="pay-step-dot" />
                    {label}
                    {processingStep > i && ' ✓'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN: Success */}
          {screen === 'success' && (
            <div className="pay-success">
              <svg className="success-checkmark" viewBox="0 0 80 80">
                <circle
                  className="success-circle"
                  cx="40" cy="40" r="36"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <polyline
                  className="success-check"
                  points="24,40 35,52 56,28"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <h3>
                {successData?.paymentStatus === 'pay_at_clinic'
                  ? 'Appointment Confirmed!'
                  : 'Payment Successful!'}
              </h3>
              <p className="success-sub">
                {successData?.paymentStatus === 'pay_at_clinic'
                  ? 'Your slot is confirmed. Please pay at the clinic reception.'
                  : 'Your appointment is confirmed. Check your dashboard for details.'}
              </p>

              <div className="txn-card">
                {successData?.mockTransactionId && (
                  <div className="txn-row">
                    <span className="txn-key">Transaction ID</span>
                    <span className="txn-id-badge">{successData.mockTransactionId}</span>
                  </div>
                )}
                <div className="txn-row">
                  <span className="txn-key">Status</span>
                  <span className="txn-val" style={{ color: '#10b981' }}>
                    {successData?.paymentStatus === 'pay_at_clinic' ? 'Pay at Clinic' : 'Paid ✓'}
                  </span>
                </div>
                <div className="txn-row">
                  <span className="txn-key">Amount</span>
                  <span className="txn-val">₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="txn-row">
                  <span className="txn-key">Method</span>
                  <span className="txn-val" style={{ textTransform: 'capitalize' }}>
                    {successData?.paymentMethod === 'netbanking' ? 'Net Banking'
                      : successData?.paymentMethod === 'upi' ? 'UPI'
                      : successData?.paymentMethod === 'cash' ? 'Cash at Clinic'
                      : successData?.paymentMethod}
                  </span>
                </div>
                <div className="txn-row">
                  <span className="txn-key">Date</span>
                  <span className="txn-val">{new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <p className="pay-success-redirect">
                Redirecting to your dashboard in 6 seconds…
              </p>
            </div>
          )}

          {/* SCREEN: Expired */}
          {screen === 'expired' && (
            <div className="pay-expired-overlay">
              <span className="pay-expired-icon">⏰</span>
              <h3>Reservation Expired</h3>
              <p>
                Your 15-minute slot reservation has timed out and the slot has been released.
                Please book a new appointment.
              </p>
              <button
                className="btn-pay"
                style={{ maxWidth: 240, marginTop: '0.5rem' }}
                onClick={() => navigate('/doctors')}
              >
                Book Again
              </button>
            </div>
          )}

          {/* SCREEN: Payment Form */}
          {screen === 'form' && (
            <>
              <div className="pay-panel-header">
                <h3>Complete Payment</h3>
                <p>Choose your preferred payment method</p>
              </div>

              {/* Method tabs */}
              <div className="pay-method-tabs">
                {METHOD_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`pay-method-tab ${method === tab.id ? 'active' : ''}`}
                    onClick={() => { setMethod(tab.id); setError(''); }}
                  >
                    <span className="pay-method-tab-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  margin: '0.75rem 1.75rem 0',
                  padding: '0.65rem 0.9rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.83rem',
                  color: '#dc2626',
                }}>
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <div className="pay-form-body">

                {/* ── UPI ──────────────────────────────────────── */}
                {method === 'upi' && (
                  <div className="upi-section">
                    <div className="upi-qr-art">
                      <QrMockSVG />
                    </div>
                    <div className="upi-form">
                      <label className="pay-label">Enter UPI ID</label>
                      <div className="pay-input-group">
                        <input
                          className="pay-input"
                          placeholder="name@upi"
                          value={upiId}
                          onChange={e => { setUpiId(e.target.value); setSelectedUpiApp(null); }}
                        />
                        <span className="pay-input-icon"><Smartphone size={16} /></span>
                      </div>
                      <div className="upi-or">or pay with</div>
                      <div className="upi-apps">
                        {UPI_APPS.map(app => (
                          <button
                            key={app.id}
                            className={`upi-app-btn ${selectedUpiApp === app.id ? 'selected' : ''}`}
                            style={selectedUpiApp === app.id ? { borderColor: '#2563eb', background: '#eff6ff', color: '#2563eb' } : {}}
                            onClick={() => { setSelectedUpiApp(app.id); setUpiId(''); }}
                          >
                            {app.emoji} {app.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Card ─────────────────────────────────────── */}
                {method === 'card' && (
                  <>
                    {/* 3D card */}
                    <div className="card-scene">
                      <div className={`card-3d ${cardFlipped ? 'flipped' : ''}`}>
                        <div className="card-face card-front">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="card-chip" />
                            <div className="card-logo">VISA / MC</div>
                          </div>
                          <div className="card-number-display">{cardDisplayNumber}</div>
                          <div className="card-bottom-row">
                            <div>
                              <span className="card-label">Card Holder</span>
                              <span className="card-value">{cardName || 'FULL NAME'}</span>
                            </div>
                            <div>
                              <span className="card-label">Expires</span>
                              <span className="card-value">{cardExpiry || 'MM/YY'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="card-face card-back">
                          <div className="card-magnetic-strip" />
                          <div className="card-cvv-band">
                            <div className="card-cvv-strip">
                              {cardCvv ? '•'.repeat(cardCvv.length) : ''}
                            </div>
                            <span className="card-cvv-label">CVV</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card form */}
                    <div className="card-form-grid">
                      <div>
                        <label className="pay-label">Card Number</label>
                        <input
                          className="pay-input"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          maxLength={19}
                          onChange={e => setCardNumber(formatCard(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="pay-label">Cardholder Name</label>
                        <input
                          className="pay-input"
                          placeholder="Name as on card"
                          value={cardName}
                          onChange={e => setCardName(e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="card-row-2">
                        <div>
                          <label className="pay-label">Expiry Date</label>
                          <input
                            className="pay-input"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            maxLength={5}
                            onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="pay-label">CVV</label>
                          <input
                            className="pay-input"
                            type="password"
                            placeholder="•••"
                            value={cardCvv}
                            maxLength={4}
                            onFocus={() => setCardFlipped(true)}
                            onBlur={() => setCardFlipped(false)}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Net Banking ───────────────────────────────── */}
                {method === 'netbanking' && (
                  <>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.85rem' }}>
                      Select your bank to proceed
                    </div>
                    <div className="bank-grid">
                      {BANKS.map(bank => (
                        <button
                          key={bank.id}
                          className={`bank-btn ${selectedBank === bank.id ? 'selected' : ''}`}
                          onClick={() => setSelectedBank(bank.id)}
                        >
                          <span className="bank-logo">{bank.logo}</span>
                          {bank.name}
                        </button>
                      ))}
                      <div className="bank-other">
                        <label className="pay-label" style={{ marginBottom: '0.4rem' }}>Other Bank</label>
                        <input
                          className="pay-input"
                          placeholder="Search your bank…"
                          onChange={e => setSelectedBank(e.target.value || null)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Cash at Clinic ────────────────────────────── */}
                {method === 'cash' && (
                  <div className="cash-info-box">
                    <span className="cash-icon">🏥</span>
                    <h4>Pay ₹{fee.toLocaleString('en-IN')} at Reception</h4>
                    <p>Your appointment slot is confirmed. Pay at the clinic reception during your visit.</p>
                    <div className="cash-steps">
                      <div className="cash-step">
                        <span className="cash-step-num">1</span>
                        Arrive 10 minutes early at the clinic
                      </div>
                      <div className="cash-step">
                        <span className="cash-step-num">2</span>
                        Show your appointment ID at reception
                      </div>
                      <div className="cash-step">
                        <span className="cash-step-num">3</span>
                        Pay ₹{fee.toLocaleString('en-IN')} (exact change appreciated)
                      </div>
                      <div className="cash-step">
                        <span className="cash-step-num">4</span>
                        Collect your receipt before consulting
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Pay button */}
              <div className="pay-btn-area">
                <button
                  className={`btn-pay ${method === 'cash' ? 'cash' : ''}`}
                  onClick={handleConfirmPayment}
                  disabled={isExpired}
                >
                  <Lock size={18} />
                  {method === 'cash'
                    ? 'Confirm Appointment (Cash)'
                    : `Pay ₹${total.toLocaleString('en-IN')} Securely`}
                </button>
                <div className="pay-security-footer">
                  <Lock size={11} /> 256-bit SSL Encrypted &nbsp;·&nbsp;
                  <ShieldCheck size={11} /> PCI DSS Compliant &nbsp;·&nbsp;
                  <CheckCircle2 size={11} /> Demo Only
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
