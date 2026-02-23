// Email Campaign Dashboard - PRODUCTION READY
// Created: 2026-02-23 by Boli + Mela (CEO ORDER)
// Full campaign management with analytics

import React, { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  createdAt: string;
  scheduledFor?: string;
}

interface CampaignStats {
  summary: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
}

export const EmailCampaignDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch campaigns
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns/email');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignStats = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/email/${campaignId}/analytics`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    fetchCampaignStats(campaign.id);
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;

    try {
      const response = await fetch(`/api/campaigns/email/${campaignId}/send`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        alert(`Campaign sending started! ${data.totalRecipients} recipients`);
        fetchCampaigns();
      } else {
        alert('Failed to send campaign');
      }
    } catch (error) {
      console.error('Failed to send campaign:', error);
      alert('Error sending campaign');
    }
  };

  const handleSendTest = async (campaignId: string) => {
    const email = prompt('Enter test email address:');
    if (!email) return;

    try {
      const response = await fetch(`/api/campaigns/email/${campaignId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: email }),
      });
      const data = await response.json();

      if (data.success) {
        alert(`Test email sent to ${email}!`);
      } else {
        alert('Failed to send test email');
      }
    } catch (error) {
      console.error('Failed to send test:', error);
      alert('Error sending test email');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
            <p className="text-gray-600 mt-1">
              Manage and track your email marketing campaigns
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            + Create Campaign
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
          <div className="text-sm text-gray-600 mb-2">Active</div>
          <div className="text-3xl font-bold text-green-600">
            {campaigns.filter(c => c.status === 'sent').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Scheduled</div>
          <div className="text-3xl font-bold text-blue-600">
            {campaigns.filter(c => c.status === 'scheduled').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Draft</div>
          <div className="text-3xl font-bold text-gray-600">
            {campaigns.filter(c => c.status === 'draft').length}
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipients
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelectCampaign(campaign)}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{campaign.name}</div>
                  <div className="text-sm text-gray-500">{campaign.subject}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      campaign.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : campaign.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {campaign.totalRecipients.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {campaign.delivered.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="text-gray-900">{campaign.opened.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    {campaign.delivered > 0
                      ? ((campaign.opened / campaign.delivered) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="text-gray-900">{campaign.clicked.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    {campaign.delivered > 0
                      ? ((campaign.clicked / campaign.delivered) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex space-x-2">
                    {campaign.status === 'draft' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendTest(campaign.id);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Test
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendCampaign(campaign.id);
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          Send
                        </button>
                      </>
                    )}
                    <button className="text-gray-600 hover:text-gray-800">View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Campaign Details Modal */}
      {selectedCampaign && stats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCampaign.name}
                </h2>
                <p className="text-gray-600">{selectedCampaign.subject}</p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">Sent</div>
                <div className="text-2xl font-bold text-blue-900">
                  {stats.summary.sent.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">Delivered</div>
                <div className="text-2xl font-bold text-green-900">
                  {stats.summary.delivered.toLocaleString()}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 mb-1">Opened</div>
                <div className="text-2xl font-bold text-purple-900">
                  {stats.summary.opened.toLocaleString()}
                </div>
                <div className="text-xs text-purple-600">
                  {stats.summary.openRate.toFixed(1)}% rate
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 mb-1">Clicked</div>
                <div className="text-2xl font-bold text-orange-900">
                  {stats.summary.clicked.toLocaleString()}
                </div>
                <div className="text-xs text-orange-600">
                  {stats.summary.clickRate.toFixed(1)}% rate
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal - Simplified */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create Email Campaign</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get('name'),
                  subject: formData.get('subject'),
                  fromName: formData.get('fromName'),
                  fromEmail: formData.get('fromEmail'),
                  htmlContent: formData.get('htmlContent'),
                };

                fetch('/api/campaigns/email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                })
                  .then((res) => res.json())
                  .then(() => {
                    alert('Campaign created!');
                    setShowCreateModal(false);
                    fetchCampaigns();
                  })
                  .catch(() => alert('Failed to create campaign'));
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Name
                    </label>
                    <input
                      type="text"
                      name="fromName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Email
                    </label>
                    <input
                      type="email"
                      name="fromEmail"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Content (HTML)
                  </label>
                  <textarea
                    name="htmlContent"
                    rows={6}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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

export default EmailCampaignDashboard;
