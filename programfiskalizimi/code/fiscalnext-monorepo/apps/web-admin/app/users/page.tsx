'use client';
// User Management Page - Day 4
import { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, Shield, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  lastLoginAt?: string;
}

interface PermissionMatrix {
  [role: string]: {
    description: string;
    permissions: string[];
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>({});
  const [showPermissions, setShowPermissions] = useState(false);
  
  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRoles, setFormRoles] = useState<string[]>(['cashier']);

  useEffect(() => {
    fetchUsers();
    fetchPermissionMatrix();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/v1/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionMatrix = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/v1/users/permissions/matrix', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch permissions');
      
      const data = await response.json();
      setPermissionMatrix(data.matrix || {});
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleAddUser = async () => {
    if (!formEmail || !formPassword) {
      alert('Email and password are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          firstName: formFirstName,
          lastName: formLastName,
          phone: formPhone,
          roleNames: formRoles,
        }),
      });

      if (!response.ok) throw new Error('Failed to create user');

      alert('User created successfully!');
      resetForm();
      setAddDialogOpen(false);
      fetchUsers();
    } catch (error) {
      alert('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/v1/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formFirstName,
          lastName: formLastName,
          phone: formPhone,
        }),
      });

      if (!response.ok) throw new Error('Failed to update user');

      alert('User updated successfully!');
      resetForm();
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      alert('Failed to update user');
    }
  };

  const handleUpdateRoles = async (userId: string, roles: string[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/v1/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleNames: roles }),
      });

      if (!response.ok) throw new Error('Failed to update roles');

      alert('Roles updated successfully!');
      fetchUsers();
    } catch (error) {
      alert('Failed to update roles');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/v1/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to deactivate user');

      alert('User deactivated successfully!');
      fetchUsers();
    } catch (error) {
      alert('Failed to deactivate user');
    }
  };

  const resetForm = () => {
    setFormEmail('');
    setFormPassword('');
    setFormFirstName('');
    setFormLastName('');
    setFormPhone('');
    setFormRoles(['cashier']);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-600',
      manager: 'bg-blue-600',
      cashier: 'bg-green-600',
      accountant: 'bg-orange-600',
    };
    return <Badge className={colors[role] || 'bg-gray-600'}>{role}</Badge>;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowPermissions(!showPermissions)} variant="outline">
            <Shield className="mr-2 h-4 w-4" /> {showPermissions ? 'Hide' : 'Show'} Permissions
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <UserPlus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+355 69 123 4567"
                  />
                </div>
                <div>
                  <Label>Roles</Label>
                  <div className="space-y-2 mt-2">
                    {['owner', 'manager', 'cashier', 'accountant'].map((role) => (
                      <div key={role} className="flex items-center">
                        <Checkbox
                          id={`role-${role}`}
                          checked={formRoles.includes(role)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormRoles([...formRoles, role]);
                            } else {
                              setFormRoles(formRoles.filter((r) => r !== role));
                            }
                          }}
                        />
                        <label htmlFor={`role-${role}`} className="ml-2 text-sm capitalize">
                          {role}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddUser} className="w-full">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showPermissions && (
        <Card className="mb-6 p-6">
          <h2 className="font-bold mb-4">Permission Matrix</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(permissionMatrix).map(([role, data]) => (
              <div key={role} className="border rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getRoleBadge(role)}
                  <span className="text-sm text-gray-600">{data.description}</span>
                </div>
                <ul className="text-xs space-y-1 ml-2">
                  {data.permissions.map((perm) => (
                    <li key={perm} className="text-gray-700">• {perm}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">Loading users...</div>
      ) : (
        <div className="grid gap-4">
          {users.length === 0 ? (
            <Card className="p-12 text-center text-gray-500">
              No users found. Add your first user to get started.
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </span>
                      {user.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {user.roles.map((role) => getRoleBadge(role))}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                      {user.lastLoginAt && (
                        <span className="ml-2">
                          • Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setFormFirstName(user.firstName || '');
                            setFormLastName(user.lastName || '');
                            setFormPhone(user.phone || '');
                            setFormRoles(user.roles);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>First Name</Label>
                              <Input
                                value={formFirstName}
                                onChange={(e) => setFormFirstName(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Last Name</Label>
                              <Input
                                value={formLastName}
                                onChange={(e) => setFormLastName(e.target.value)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={formPhone}
                              onChange={(e) => setFormPhone(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Roles</Label>
                            <div className="space-y-2 mt-2">
                              {['owner', 'manager', 'cashier', 'accountant'].map((role) => (
                                <div key={role} className="flex items-center">
                                  <Checkbox
                                    id={`edit-role-${role}`}
                                    checked={formRoles.includes(role)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormRoles([...formRoles, role]);
                                      } else {
                                        setFormRoles(formRoles.filter((r) => r !== role));
                                      }
                                    }}
                                  />
                                  <label htmlFor={`edit-role-${role}`} className="ml-2 text-sm capitalize">
                                    {role}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateUser} className="flex-1">
                              Update Profile
                            </Button>
                            <Button
                              onClick={() => {
                                if (selectedUser) {
                                  handleUpdateRoles(selectedUser.id, formRoles);
                                }
                              }}
                              variant="outline"
                              className="flex-1"
                            >
                              Update Roles
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      onClick={() => handleDeactivateUser(user.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
