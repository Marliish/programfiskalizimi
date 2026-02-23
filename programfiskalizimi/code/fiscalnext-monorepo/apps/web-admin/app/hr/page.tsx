'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HRPage() {
  const [stats, setStats] = useState({
    employees: 0,
    trainingModules: 0,
    pendingReviews: 0,
    pendingTimeOff: 0,
    expiringDocs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [employeesRes, trainingRes, reviewsRes, timeOffRes, docsRes] = await Promise.all([
        fetch('/api/v1/payroll/employees', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/hr/training/modules', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/hr/performance-reviews?status=draft', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/hr/time-off-requests?status=pending', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/hr/employee-documents/expiring/list?daysAhead=30', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [employees, training, reviews, timeOff, docs] = await Promise.all([
        employeesRes.json(),
        trainingRes.json(),
        reviewsRes.json(),
        timeOffRes.json(),
        docsRes.json()
      ]);

      setStats({
        employees: employees.employees?.length || 0,
        trainingModules: training.modules?.length || 0,
        pendingReviews: reviews.reviews?.length || 0,
        pendingTimeOff: timeOff.requests?.length || 0,
        expiringDocs: docs.documents?.length || 0
      });
    } catch (error) {
      console.error('Error loading HR stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">HR Management</h1>
        <p className="text-gray-600 mt-2">Onboarding, training, reviews, and employee management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Employees</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.employees}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Training Modules</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{stats.trainingModules}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Pending Reviews</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingReviews}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Time-Off Requests</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">{stats.pendingTimeOff}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Expiring Docs</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{stats.expiringDocs}</div>
        </div>
      </div>

      {/* HR Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Onboarding */}
        <Link
          href="/hr/onboarding"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                🚀 Onboarding
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Manage new employee onboarding checklists and tasks
              </p>
            </div>
          </div>
          <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
            Manage Onboarding →
          </div>
        </Link>

        {/* Training */}
        <Link
          href="/hr/training"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                📚 Training & Certification
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Create training modules, enroll employees, track certifications
              </p>
            </div>
          </div>
          <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
            Manage Training →
          </div>
        </Link>

        {/* Performance Reviews */}
        <Link
          href="/hr/reviews"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                ⭐ Performance Reviews
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Conduct 360-degree reviews with ratings and feedback
              </p>
              {stats.pendingReviews > 0 && (
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                  {stats.pendingReviews} pending
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
            Manage Reviews →
          </div>
        </Link>

        {/* Time-Off Requests */}
        <Link
          href="/hr/time-off"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                🏖️ Time-Off Management
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Approve vacation, sick leave, and personal time off
              </p>
              {stats.pendingTimeOff > 0 && (
                <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                  {stats.pendingTimeOff} pending
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
            Manage Time-Off →
          </div>
        </Link>

        {/* Employee Documents */}
        <Link
          href="/hr/documents"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                📄 Employee Documents
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Secure document storage with expiry tracking and alerts
              </p>
              {stats.expiringDocs > 0 && (
                <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                  {stats.expiringDocs} expiring soon
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
            Manage Documents →
          </div>
        </Link>

        {/* Employee Directory */}
        <Link
          href="/payroll/employees"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                👥 Employee Directory
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                View and manage all employee information and profiles
              </p>
            </div>
          </div>
          <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
            View Employees →
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/hr/training/new"
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-4 text-center transition"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-medium text-gray-900">Create Training Module</div>
          </Link>
          <Link
            href="/hr/reviews/new"
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-4 text-center transition"
          >
            <div className="text-2xl mb-2">⭐</div>
            <div className="font-medium text-gray-900">New Performance Review</div>
          </Link>
          <Link
            href="/hr/time-off/new"
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-4 text-center transition"
          >
            <div className="text-2xl mb-2">🏖️</div>
            <div className="font-medium text-gray-900">Request Time Off</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
