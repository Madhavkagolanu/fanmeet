'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Download, Share2 } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  url: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  title,
  subtitle,
  url,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch {
        // Fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="inline-block text-xs font-black tracking-widest uppercase px-3 py-1 bg-black text-white rounded-full mb-3">
            QR SCAN & SHARE
          </span>
          <h3 className="text-xl font-black tracking-tight text-neutral-900 leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-1 font-medium">{subtitle}</p>
          )}
        </div>

        {/* QR Code Canvas Frame */}
        <div className="bg-neutral-50 p-6 rounded-2xl border-2 border-neutral-900 inline-block shadow-inner mb-6">
          <QRCodeSVG
            id="fanmeet-qr-svg"
            value={url}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="p-3 bg-neutral-100 rounded-xl mb-6 flex items-center justify-between gap-2 overflow-hidden border border-neutral-200">
          <p className="text-xs text-neutral-700 font-mono truncate">{url}</p>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white rounded-lg text-neutral-700 hover:text-black transition-colors shrink-0"
            title="Copy URL"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-xl border border-neutral-300 font-bold text-xs uppercase tracking-wider text-neutral-900 hover:border-black hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="w-full py-3 px-4 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
