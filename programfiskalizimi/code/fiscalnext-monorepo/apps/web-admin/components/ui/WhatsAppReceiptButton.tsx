'use client';

import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCopy, FiCheck, FiX } from 'react-icons/fi';
import { 
  generateWhatsAppReceipt, 
  shareViaWhatsApp, 
  copyReceiptToClipboard,
  type ReceiptData 
} from '@/lib/utils/receiptGenerator';
import { useTranslation } from '@/lib/i18n';

interface WhatsAppReceiptButtonProps {
  receiptData: ReceiptData;
  className?: string;
  variant?: 'button' | 'icon';
}

export function WhatsAppReceiptButton({ 
  receiptData, 
  className = '',
  variant = 'button'
}: WhatsAppReceiptButtonProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const receipt = generateWhatsAppReceipt(receiptData);
    shareViaWhatsApp(receipt, phoneNumber || undefined);
    setShowModal(false);
  };

  const handleCopy = async () => {
    const receipt = generateWhatsAppReceipt(receiptData);
    const success = await copyReceiptToClipboard(receipt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleQuickShare = () => {
    const receipt = generateWhatsAppReceipt(receiptData);
    shareViaWhatsApp(receipt);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleQuickShare}
        className={`p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors ${className}`}
        title="Dërgo në WhatsApp"
      >
        <FaWhatsapp className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${className}`}
      >
        <FaWhatsapp className="w-5 h-5" />
        <span>WhatsApp</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-green-500 text-white">
              <div className="flex items-center gap-2">
                <FaWhatsapp className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Dërgo Faturën në WhatsApp</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-green-600 rounded"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Phone number input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numri i telefonit (opsional)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+355 6X XXX XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lëreni bosh për të zgjedhur kontaktin nga WhatsApp
                </p>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pamja e faturës
                </label>
                <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {generateWhatsAppReceipt(receiptData)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {copied ? (
                  <>
                    <FiCheck className="w-4 h-4 text-green-500" />
                    <span>U kopjua!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    <span>Kopjo</span>
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <FaWhatsapp className="w-5 h-5" />
                <span>Dërgo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WhatsAppReceiptButton;
