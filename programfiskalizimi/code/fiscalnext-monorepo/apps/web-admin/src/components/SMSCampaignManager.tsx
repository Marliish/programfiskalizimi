// SMS Campaign Manager - PRODUCTION READY
// Created: 2026-02-23 by Boli + Mela (CEO ORDER)
// Twilio integration with character counter and cost tracking

import React, { useState, useEffect } from 'react';

interface SMSCampaign {
  id: string;
  name: string;
  message: string;
  status: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  failed: number;
  costPerSms: number;
  totalCost: number;
  createdAt: string;
  scheduledFor?: string;
}

export const SMSCampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState('');
  const [campaignName, setCampaignName] = useState('');

  const MAX_SMS_LENGTH = 160;
  const messageLength = message.length;
  const smsCount = Math.ceil(messageLength / MAX_SMS_LENGTH) || 1;
  const remainingChars = MAX_SMS_LENGTH - (messageLength % MAX_SMS_LENGTH || MAX_SMS_LENGTH);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns/sms');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to fetch SMS campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignName || !message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/campaigns/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          message: message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('SMS Campaign created successfully!');
        setShowCreateModal(false);
        setCampaignName('');
        setMessage('');
        fetchCampaigns();
      } else {
        alert('Failed to create campaign');
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Error creating campaign');
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Send this SMS campaign now? This will charge your Twilio account.')) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/sms/${campaignId}/send`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert(`SMS campaign sending started! ${data.totalRecipients} recipients`);
        fetchCampaigns();
      } else {
        alert('Failed to send campaign');
      }
    } catch (error) {
      console.error('Failed to send campaign:', error);
      alert('Error sending campaign');
    }
  };

  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalCost = campaigns.reduce((sum, c) => sum + (c.totalCost || 0), 0);
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.totalRecipients, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading SMS campaigns...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📱 SMS Campaigns</h1>
            <p className="text-gray-600 mt-1">Send bulk SMS via Twilio</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            + Create SMS Campaign
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Campaigns</div>
          <div className="text-3xl font-bold text-gray-900">{campaigns.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">SMS Sent</div>
          <div className="text-3xl font-bold text-green-600">
            {totalSent.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Recipients</div>
          <div className="text-3xl font-bold text-blue-600">
            {totalRecipients.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Cost</div>
          <div className="text-3xl font-bold text-purple-600">
            ${totalCost.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">SMS Campaigns</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📱</div>
              <p>No SMS campaigns yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-green-600 hover:text-green-700 font-semibold"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {campaign.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          campaign.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : campaign.status === 'sending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>

                    <div className="bg-gray-100 rounded-lg p-3 mb-3 max-w-2xl">
                      <p className="text-gray-900 whitespace-pre-wrap">{campaign.message}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {campaign.message.length} characters • {Math.ceil(campaign.message.length / 160)} SMS
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Recipients</div>
                        <div className="font-semibold text-gray-900">
                          {campaign.totalRecipients.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Sent</div>
                        <div className="font-semibold text-green-600">
                          {campaign.sent.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Delivered</div>
                        <div className="font-semibold text-blue-600">
                          {campaign.delivered.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Failed</div>
                        <div className="font-semibold text-red-600">
                          {campaign.failed.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Cost</div>
                        <div className="font-semibold text-purple-600">
                          ${(campaign.totalCost || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleSendCampaign(campaign.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
                      >
                        Send Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create SMS Campaign</h2>

            <form onSubmit={handleCreateCampaign}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Flash Sale Alert"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMS Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Your SMS message here..."
                  />

                  {/* Character Counter */}
                  <div className="mt-2 flex justify-between items-center text-sm">
                    <div>
                      <span className={messageLength > MAX_SMS_LENGTH ? 'text-orange-600' : 'text-gray-600'}>
                        {messageLength} / {MAX_SMS_LENGTH} characters
                      </span>
                      <span className="text-gray-500 ml-4">
                        {smsCount} SMS {smsCount > 1 ? 'segments' : 'segment'}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {remainingChars} characters remaining
                    </div>
                  </div>

                  {/* Cost Estimate */}
                  <div className="mt-2 bg-blue-50 rounded-lg p-3">
                    <div className="text-sm text-blue-900">
                      <strong>Cost Estimate:</strong> $0.05 per SMS × {smsCount} segment(s) × recipients
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Example: 100 recipients = ${(0.05 * smsCount * 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Warning for long messages */}
                {messageLength > MAX_SMS_LENGTH && (
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-3">
                    <div className="text-sm text-orange-900">
                      ⚠️ Your message is {messageLength} characters and will be sent as {smsCount} SMS segments.
                      This will cost {smsCount}x more per recipient.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCampaignName('');
                    setMessage('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSCampaignManager;
