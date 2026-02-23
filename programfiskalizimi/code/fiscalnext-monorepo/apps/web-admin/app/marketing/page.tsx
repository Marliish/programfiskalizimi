'use client';

// Marketing Dashboard
// Overview of all marketing features
// Created: 2026-02-23 - Day 13

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MarketingDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    campaigns: { total: 0, active: 0, scheduled: 0 },
    surveys: { total: 0, responses: 0 },
    referrals: { total: 0, conversions: 0 },
    social: { posts: 0, engagement: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production, fetch from API
    setTimeout(() => {
      setStats({
        campaigns: { total: 12, active: 3, scheduled: 2 },
        surveys: { total: 5, responses: 284 },
        referrals: { total: 145, conversions: 89 },
        social: { posts: 48, engagement: 4523 },
      });
      setLoading(false);
    }, 500);
  }, []);

  const features = [
    {
      id: 'email',
      name: 'Email Campaigns',
      description: 'Create and manage email marketing campaigns',
      icon: '📧',
      href: '/marketing/campaigns',
      stats: [
        { label: 'Total Campaigns', value: stats.campaigns.total },
        { label: 'Active', value: stats.campaigns.active },
        { label: 'Scheduled', value: stats.campaigns.scheduled },
      ],
      color: 'bg-blue-50 border-blue-200',
    },
    {
      id: 'sms',
      name: 'SMS Campaigns',
      description: 'Send SMS messages to your customers',
      icon: '📱',
      href: '/marketing/sms',
      stats: [
        { label: 'Campaigns', value: 8 },
        { label: 'Sent', value: 1523 },
        { label: 'Delivered', value: 1498 },
      ],
      color: 'bg-green-50 border-green-200',
    },
    {
      id: 'surveys',
      name: 'Customer Surveys',
      description: 'Collect feedback with custom surveys',
      icon: '📋',
      href: '/marketing/surveys',
      stats: [
        { label: 'Active Surveys', value: stats.surveys.total },
        { label: 'Total Responses', value: stats.surveys.responses },
        { label: 'Avg. Rating', value: 4.3 },
      ],
      color: 'bg-purple-50 border-purple-200',
    },
    {
      id: 'referrals',
      name: 'Referral Program',
      description: 'Reward customers for referrals',
      icon: '🎁',
      href: '/marketing/referrals',
      stats: [
        { label: 'Total Referrals', value: stats.referrals.total },
        { label: 'Conversions', value: stats.referrals.conversions },
        { label: 'Conversion Rate', value: '61.4%' },
      ],
      color: 'bg-yellow-50 border-yellow-200',
    },
    {
      id: 'social',
      name: 'Social Media',
      description: 'Manage social posts and reviews',
      icon: '📱',
      href: '/marketing/social',
      stats: [
        { label: 'Posts', value: stats.social.posts },
        { label: 'Engagement', value: stats.social.engagement },
        { label: 'Avg. Rating', value: 4.5 },
      ],
      color: 'bg-pink-50 border-pink-200',
    },
    {
      id: 'segments',
      name: 'Customer Segments',
      description: 'Create targeted customer groups',
      icon: '👥',
      href: '/marketing/segments',
      stats: [
        { label: 'Segments', value: 12 },
        { label: 'Total Customers', value: 3456 },
        { label: 'VIP Customers', value: 145 },
      ],
      color: 'bg-indigo-50 border-indigo-200',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'campaign',
      title: 'Summer Sale Campaign sent',
      time: '2 hours ago',
      icon: '📧',
      color: 'text-blue-600',
    },
    {
      id: 2,
      type: 'review',
      title: '5-star review received',
      time: '3 hours ago',
      icon: '⭐',
      color: 'text-yellow-600',
    },
    {
      id: 3,
      type: 'referral',
      title: '3 new referrals completed',
      time: '5 hours ago',
      icon: '🎁',
      color: 'text-green-600',
    },
    {
      id: 4,
      type: 'survey',
      title: '25 new survey responses',
      time: '1 day ago',
      icon: '📋',
      color: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Marketing & Campaigns
        </h1>
        <p className="text-gray-600">
          Manage your email campaigns, SMS, surveys, referrals, and social media all in one place
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
              <p className="text-2xl font-bold text-blue-600">{stats.campaigns.active}</p>
            </div>
            <div className="text-4xl">📧</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Survey Responses</p>
              <p className="text-2xl font-bold text-purple-600">{stats.surveys.responses}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Referral Conversions</p>
              <p className="text-2xl font-bold text-green-600">{stats.referrals.conversions}</p>
            </div>
            <div className="text-4xl">🎁</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Social Engagement</p>
              <p className="text-2xl font-bold text-pink-600">{stats.social.engagement}</p>
            </div>
            <div className="text-4xl">📱</div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => router.push(feature.href)}
            className={`${feature.color} p-6 rounded-lg shadow border-2 cursor-pointer hover:shadow-lg transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {feature.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
              <div className="text-4xl">{feature.icon}</div>
            </div>

            <div className="space-y-2">
              {feature.stats.map((stat, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{stat.label}:</span>
                  <span className="font-semibold text-gray-900">{stat.value}</span>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full bg-white text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm">
              Open →
            </button>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${activity.color}`}>
                  {activity.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
