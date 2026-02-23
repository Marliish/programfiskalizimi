'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PayrollPage() {
  const [employees, setEmployees] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empRes, runsRes] = await Promise.all([
        fetch('/api/v1/payroll/employees', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/v1/payroll/payroll-runs', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const empData = await empRes.json();
      const runsData = await runsRes.json();

      setEmployees(empData.employees || []);
      setPayrollRuns(runsData.runs || []);
    } catch (error) {
      console.error('Error loading payroll data:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <p className="text-gray-600 mt-2">Manage employees and payroll runs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Employees</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{employees.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Active Employees</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {employees.filter((e: any) => e.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Payroll Runs</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{payrollRuns.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Pending Approval</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">
            {payrollRuns.filter((r: any) => r.status === 'draft').length}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/payroll/employees/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition"
        >
          ➕ Add New Employee
        </Link>
        <Link
          href="/payroll/runs/new"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition"
        >
          ▶️ Create Payroll Run
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Employees */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Employees</h2>
          </div>
          <div className="p-6">
            {employees.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No employees yet</p>
            ) : (
              <div className="space-y-4">
                {employees.slice(0, 5).map((emp: any) => (
                  <Link
                    key={emp.id}
                    href={`/payroll/employees/${emp.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{emp.position || 'No position'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {emp.employeeNumber}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('sq-AL', {
                            style: 'currency',
                            currency: emp.currency || 'ALL'
                          }).format(emp.salary)}
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          emp.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {emp.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/payroll/employees"
              className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              View All Employees →
            </Link>
          </div>
        </div>

        {/* Recent Payroll Runs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Payroll Runs</h2>
          </div>
          <div className="p-6">
            {payrollRuns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payroll runs yet</p>
            ) : (
              <div className="space-y-4">
                {payrollRuns.slice(0, 5).map((run: any) => (
                  <Link
                    key={run.id}
                    href={`/payroll/runs/${run.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{run.runNumber}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Pay Date: {new Date(run.payDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('sq-AL', {
                            style: 'currency',
                            currency: 'ALL'
                          }).format(run.totalNet)}
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          run.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : run.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/payroll/runs"
              className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              View All Payroll Runs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
