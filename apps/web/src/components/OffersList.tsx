'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { offersApi } from '@/lib/api';
import { OFFER_STATUSES, getOfferStatusLabel, getOfferStatusColor } from '@/lib/constants';
import type { Offer, OfferStatus } from '@/lib/types';

/* ──────────────────────────────────────────────
   Date formatting helper
   ────────────────────────────────────────────── */

function formatDateHe(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

interface OffersListProps {
  leadId: string;
}

export default function OffersList({ leadId }: OffersListProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [amountEstimated, setAmountEstimated] = useState('');
  const [offerStatus, setOfferStatus] = useState<OfferStatus>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await offersApi.listByLead(leadId);
      setOffers(data);
    } catch (err) {
      setError('שגיאה בטעינת ההצעות');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.type !== 'application/pdf') {
      setFormError('ניתן להעלות קבצי PDF בלבד');
      setFile(null);
      return;
    }
    setFormError(null);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!file) {
      setFormError('יש לבחור קובץ PDF');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('offer_status', offerStatus);
      if (amountEstimated.trim()) {
        const parsed = parseFloat(amountEstimated);
        if (isNaN(parsed) || parsed < 0) {
          setFormError('יש להזין סכום תקין');
          setSubmitting(false);
          return;
        }
        formData.append('amount_estimated', String(parsed));
      }

      await offersApi.create(leadId, formData);

      // Reset form
      setFile(null);
      setAmountEstimated('');
      setOfferStatus('draft');
      // Reset the file input
      const fileInput = document.getElementById(`offer-file-input-${leadId}`) as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await fetchOffers();
    } catch (err) {
      setFormError('שגיאה בהעלאת ההצעה');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* ── Upload form ──────────────────────── */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">העלאת הצעה חדשה</h4>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">העלה קובץ PDF</label>
          <input
            id={`offer-file-input-${leadId}`}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:ml-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">סכום משוער</label>
          <input
            type="number"
            value={amountEstimated}
            onChange={(e) => setAmountEstimated(e.target.value)}
            placeholder="הזן סכום..."
            min="0"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">סטטוס</label>
          <select
            value={offerStatus}
            onChange={(e) => setOfferStatus(e.target.value as OfferStatus)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {OFFER_STATUSES.map((os) => (
              <option key={os.key} value={os.key}>
                {os.label}
              </option>
            ))}
          </select>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={submitting || !file}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'מעלה...' : 'העלה הצעה'}
        </button>
      </form>

      {/* ── Offers list ──────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-600 py-4">{error}</p>
      ) : offers.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-8">אין הצעות עדיין</p>
      ) : (
        <ul className="space-y-3">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Status badge */}
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getOfferStatusColor(offer.status)}`}
                  >
                    {getOfferStatusLabel(offer.status)}
                  </span>

                  {/* Amount */}
                  {offer.amount_estimated != null && (
                    <p className="text-sm font-semibold text-gray-800">
                      {formatCurrency(offer.amount_estimated)}
                    </p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-500">
                    {formatDateHe(offer.created_at)}
                  </p>
                </div>

                {/* Download link */}
                <a
                  href={offersApi.download(offer.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  הורד
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
