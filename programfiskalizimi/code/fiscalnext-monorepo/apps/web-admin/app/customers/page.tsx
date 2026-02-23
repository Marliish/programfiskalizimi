'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Table, Modal, Input } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiUser, FiPhone, FiMail, FiCalendar } from 'react-icons/fi';
import { customersApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerDetails extends Customer {
  stats: {
    totalSpent: number;
    totalVisits: number;
    lastPurchase: string | null;
    averageOrderValue: number;
  };
  recentTransactions: any[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
  });

  // Fetch customers
  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await customersApi.getAll({
        page,
        limit: 10,
        search: searchQuery || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (response.data.success) {
        setCustomers(response.data.data || []);
        setTotalCustomers(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setCurrentPage(response.data.pagination?.page || 1);
      }
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer details
  const fetchCustomerDetails = async (id: string) => {
    try {
      const response = await customersApi.getById(id);
      if (response.data.success) {
        setSelectedCustomer(response.data.customer);
        setIsDetailsModalOpen(true);
      }
    } catch (error: any) {
      console.error('Failed to fetch customer details:', error);
      toast.error('Failed to load customer details');
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage]);

  // Search handler
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomers(1);
  };

  // Open modal for adding/editing
  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        birthday: customer.birthday ? customer.birthday.split('T')[0] : '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthday: '',
      });
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthday: '',
    });
  };

  // Save customer
  const handleSave = async () => {
    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customersApi.create(formData);
        toast.success('Customer created successfully');
      }
      closeModal();
      fetchCustomers(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save customer');
    }
  };

  // Delete customer
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      await customersApi.delete(id);
      toast.success('Customer deleted successfully');
      fetchCustomers(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete customer');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout title="Customers" subtitle="Manage your customer database">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button onClick={() => openModal()} className="flex items-center gap-2">
            <FiPlus /> Add Customer
          </Button>
        </div>

        {/* Search Bar */}
        <Card>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                onKeyPress={(e: any) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </Card>

        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUser className="text-2xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Customer List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Contact</th>
                  <th className="text-left p-4 font-semibold">Total Spent</th>
                  <th className="text-left p-4 font-semibold">Last Purchase</th>
                  <th className="text-left p-4 font-semibold">Joined</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      No customers found. Add your first customer to get started!
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {(customer.firstName?.[0] || customer.lastName?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {customer.firstName || ''} {customer.lastName || ''}
                            </p>
                            <p className="text-sm text-gray-500">ID: {customer.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {customer.email && (
                            <p className="text-sm flex items-center gap-2">
                              <FiMail className="text-gray-400" />
                              {customer.email}
                            </p>
                          )}
                          {customer.phone && (
                            <p className="text-sm flex items-center gap-2">
                              <FiPhone className="text-gray-400" />
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(Number(customer.totalSpent))}
                        </span>
                      </td>
                      <td className="p-4">
                        {customer.lastPurchaseDate ? (
                          <span className="text-sm">{formatDate(customer.lastPurchaseDate)}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{formatDate(customer.createdAt)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => fetchCustomerDetails(customer.id)}
                          >
                            <FiEye />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openModal(customer)}
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(customer.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {customers.length} of {totalCustomers} customers
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Add/Edit Customer Modal */}
        <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e: any) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e: any) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
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
            <div>
              <label className="block text-sm font-medium mb-1">Birthday</label>
              <Input
                type="date"
                value={formData.birthday}
                onChange={(e: any) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingCustomer ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Customer Details Modal */}
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Customer Details"
        >
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    {(selectedCustomer.firstName?.[0] || selectedCustomer.lastName?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </h3>
                    <p className="text-gray-500">Customer ID: {selectedCustomer.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedCustomer.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedCustomer.stats.totalSpent)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Visits</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedCustomer.stats.totalVisits}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Average Order</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(selectedCustomer.stats.averageOrderValue)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Last Purchase</p>
                  <p className="text-sm font-medium">
                    {selectedCustomer.stats.lastPurchase
                      ? formatDate(selectedCustomer.stats.lastPurchase)
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-semibold mb-2">Recent Transactions</h4>
                {selectedCustomer.recentTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.recentTransactions.map((transaction: any) => (
                      <div key={transaction.id} className="border p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {transaction.transactionNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                          <p className="font-bold text-green-600">
                            {formatCurrency(Number(transaction.total))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
