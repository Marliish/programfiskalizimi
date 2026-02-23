'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Modal, Input } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiClock, FiDollarSign, FiCalendar, FiUser, FiSearch } from 'react-icons/fi';
import { employeesApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  hourlyRate?: number;
  isActive: boolean;
  startDate: Date;
  totalHoursThisMonth: number;
  shiftsThisMonth: number;
  createdAt: Date;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hourlyRate: '',
    startDate: '',
  });

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeesApi.getAll({
        search: searchQuery || undefined,
        isActive: true,
      });

      if (response.data.success) {
        setEmployees(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSearch = () => {
    fetchEmployees();
  };

  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        hourlyRate: employee.hourlyRate?.toString() || '',
        startDate: employee.startDate ? new Date(employee.startDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        hourlyRate: '',
        startDate: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      };

      if (editingEmployee) {
        await employeesApi.update(editingEmployee.id, payload);
        toast.success('Employee updated successfully');
      } else {
        await employeesApi.create(payload);
        toast.success('Employee created successfully');
      }
      closeModal();
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save employee');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await employeesApi.delete(id);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete employee');
    }
  };

  const fetchEmployeeDetails = async (id: string) => {
    try {
      const response = await employeesApi.getById(id);
      if (response.data.success) {
        setSelectedEmployee(response.data.employee);
        setIsDetailsModalOpen(true);
      }
    } catch (error: any) {
      toast.error('Failed to load employee details');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <DashboardLayout title="Employees" subtitle="Manage your team members">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button onClick={() => openModal()} className="flex items-center gap-2">
            <FiPlus /> Add Employee
          </Button>
        </div>

        {/* Search Bar */}
        <Card>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or position..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                onKeyPress={(e: any) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </Card>

        {/* Employee Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUser className="text-2xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiClock className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours (This Month)</p>
                <p className="text-2xl font-bold">
                  {employees.reduce((sum, e) => sum + e.totalHoursThisMonth, 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiDollarSign className="text-2xl text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Hourly Rate</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    employees.reduce((sum, e) => sum + (e.hourlyRate || 0), 0) / employees.length || 0
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Employee List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Position</th>
                  <th className="text-left p-4 font-semibold">Department</th>
                  <th className="text-left p-4 font-semibold">Hourly Rate</th>
                  <th className="text-left p-4 font-semibold">Hours (Month)</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500">
                      Loading employees...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500">
                      No employees found. Add your first employee to get started!
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{employee.position}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600">{employee.department || 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-green-600">
                          {employee.hourlyRate ? formatCurrency(employee.hourlyRate) : 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{employee.totalHoursThisMonth}h</p>
                          <p className="text-sm text-gray-500">{employee.shiftsThisMonth} shifts</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            employee.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => fetchEmployeeDetails(employee.id)}
                          >
                            <FiEye />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openModal(employee)}
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add/Edit Employee Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e: any) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e: any) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+355 XX XXX XXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Position *</label>
                <Input
                  value={formData.position}
                  onChange={(e: any) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Cashier, Manager, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e: any) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Sales, Management, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hourly Rate (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e: any) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="5.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e: any) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingEmployee ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </Modal>

        {/* Employee Details Modal */}
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Employee Details"
        >
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                  {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <p className="text-gray-500">{selectedEmployee.position}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Hours (Month)</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedEmployee.totalHoursThisMonth}h
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Shifts (Month)</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedEmployee.shiftsThisMonth}
                  </p>
                </div>
              </div>

              {selectedEmployee.performance && (
                <div>
                  <h4 className="font-semibold mb-2">Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sales Count:</span>
                      <span className="font-medium">{selectedEmployee.performance.salesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg. Transaction:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedEmployee.performance.avgTransactionValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer Rating:</span>
                      <span className="font-medium">
                        {selectedEmployee.performance.customerRating} / 5.0
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
