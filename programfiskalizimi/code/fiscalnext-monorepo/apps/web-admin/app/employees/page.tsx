'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Modal, Input } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiSearch, FiShield } from 'react-icons/fi';
import { employeesApi } from '@/lib/api';
import toast from 'react-hot-toast';

// Role templates with permissions
const ROLE_TEMPLATES = {
  cashier: {
    label: 'Cashier',
    permissions: [
      'sales:create',
      'sales:edit',
      'cash:open_shift',
      'cash:close_shift',
      'cash:reprint',
      'inventory:view',
    ],
  },
  waiter: {
    label: 'Waiter',
    permissions: [
      'sales:create',
      'sales:edit',
      'sales:void',
      'inventory:view',
    ],
  },
  manager: {
    label: 'Manager',
    permissions: [
      'sales:create',
      'sales:edit',
      'sales:void',
      'sales:refund',
      'sales:discount',
      'sales:price_override',
      'cash:open_shift',
      'cash:close_shift',
      'cash:in_out',
      'cash:reprint',
      'cash:reports',
      'inventory:view',
      'inventory:edit',
      'inventory:adjust',
      'inventory:cost_price',
      'admin:products',
      'admin:employees',
      'admin:reports',
    ],
  },
  admin: {
    label: 'Admin',
    permissions: [
      'sales:create',
      'sales:edit',
      'sales:void',
      'sales:refund',
      'sales:discount',
      'sales:price_override',
      'cash:open_shift',
      'cash:close_shift',
      'cash:in_out',
      'cash:reprint',
      'cash:reports',
      'inventory:view',
      'inventory:edit',
      'inventory:adjust',
      'inventory:cost_price',
      'admin:products',
      'admin:employees',
      'admin:settings',
      'admin:reports',
    ],
  },
};

// Permission categories
const PERMISSION_CATEGORIES = {
  sales: {
    label: 'Sales',
    permissions: [
      { id: 'sales:create', label: 'Create Sales' },
      { id: 'sales:edit', label: 'Edit Sales' },
      { id: 'sales:void', label: 'Void Sales' },
      { id: 'sales:refund', label: 'Refund' },
      { id: 'sales:discount', label: 'Apply Discounts' },
      { id: 'sales:price_override', label: 'Override Prices' },
    ],
  },
  cash: {
    label: 'Cash/POS',
    permissions: [
      { id: 'cash:open_shift', label: 'Open Shift' },
      { id: 'cash:close_shift', label: 'Close Shift' },
      { id: 'cash:in_out', label: 'Cash In/Out' },
      { id: 'cash:reprint', label: 'Reprint Receipts' },
      { id: 'cash:reports', label: 'View Reports' },
    ],
  },
  inventory: {
    label: 'Inventory',
    permissions: [
      { id: 'inventory:view', label: 'View Inventory' },
      { id: 'inventory:edit', label: 'Edit Products' },
      { id: 'inventory:adjust', label: 'Adjust Stock' },
      { id: 'inventory:cost_price', label: 'View Cost Price' },
    ],
  },
  admin: {
    label: 'Admin',
    permissions: [
      { id: 'admin:products', label: 'Manage Products' },
      { id: 'admin:employees', label: 'Manage Employees' },
      { id: 'admin:settings', label: 'System Settings' },
      { id: 'admin:reports', label: 'Advanced Reports' },
    ],
  },
};

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  employeeNumber: string;
  hireDate: string;
  salary?: number;
  isActive: boolean;
  role?: string;
  permissions?: string[];
  permissionCount?: number;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    position: '',
    department: '',
    employeeNumber: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: '',
    role: 'cashier',
    permissions: [] as string[],
  });

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeesApi.getAll({ isActive: true });
      console.log('[DEBUG] Employees API response:', response.data);

      if (response.data.success) {
        console.log('[DEBUG] Setting employees:', response.data.data);
        setEmployees(response.data.data || []);
      } else {
        console.error('[DEBUG] API returned success=false:', response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      toast.error(error.response?.data?.error || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        password: '', // Don't show existing password
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        employeeNumber: employee.employeeNumber || '',
        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
        salary: employee.salary?.toString() || '',
        role: employee.role || 'cashier',
        permissions: employee.permissions || [],
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        position: '',
        department: '',
        employeeNumber: `EMP-${Date.now()}`,
        hireDate: new Date().toISOString().split('T')[0],
        salary: '',
        role: 'cashier',
        permissions: ROLE_TEMPLATES.cashier.permissions,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleRoleChange = (role: string) => {
    const template = ROLE_TEMPLATES[role as keyof typeof ROLE_TEMPLATES];
    setFormData({
      ...formData,
      role,
      permissions: template ? template.permissions : [],
    });
  };

  const togglePermission = (permission: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permission)
        ? formData.permissions.filter(p => p !== permission)
        : [...formData.permissions, permission],
    });
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : 0,
        hireDate: new Date(formData.hireDate),
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
      console.error('Save error:', error);
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

  const filteredEmployees = employees.filter(emp =>
    searchQuery === '' ||
    emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Employees" subtitle="Manage team members and permissions">
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
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {/* Stats */}
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
                <FiShield className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold">
                  {employees.filter(e => e.role === 'admin').length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiShield className="text-2xl text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Managers</p>
                <p className="text-2xl font-bold">
                  {employees.filter(e => e.role === 'manager').length}
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
                  <th className="text-left p-4 font-semibold">Role</th>
                  <th className="text-left p-4 font-semibold">Permissions</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      Loading employees...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
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
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                          {employee.role || 'cashier'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600">{employee.permissionCount || 0} permissions</span>
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
          size="xl"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="font-semibold mb-3">Basic Information</h3>
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
                  <label className="block text-sm font-medium mb-1">
                    Password {!editingEmployee && '*'}
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingEmployee ? 'Leave blank to keep current' : 'Enter password'}
                    required={!editingEmployee}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingEmployee ? 'Leave blank to keep current password' : 'Employee will use this to login'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+355 XX XXX XXX"
                  />
                </div>
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
                <div>
                  <label className="block text-sm font-medium mb-1">Employee Number *</label>
                  <Input
                    value={formData.employeeNumber}
                    onChange={(e: any) => setFormData({ ...formData, employeeNumber: e.target.value })}
                    placeholder="EMP-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hire Date *</label>
                  <Input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e: any) => setFormData({ ...formData, hireDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Salary (ALL)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e: any) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions */}
            <div>
              <h3 className="font-semibold mb-3">Role & Permissions</h3>
              
              {/* Role Templates */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Role Template</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleRoleChange(key)}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                        formData.role === key
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission Checkboxes */}
              <div className="space-y-4">
                {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{category.label}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {category.permissions.map(permission => (
                        <label key={permission.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{formData.permissions.length}</strong> permissions selected
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingEmployee ? 'Update Employee' : 'Create Employee'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
