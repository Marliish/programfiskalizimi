'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

interface Location {
  id: string;
  name: string;
  type: string;
  address?: string;
  city?: string;
  phone?: string;
  isActive: boolean;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('store');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await apiRequest('/locations');
      if (response.success) {
        setLocations(response.locations);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setName(location.name);
      setType(location.type);
      setAddress(location.address || '');
      setCity(location.city || '');
      setPhone(location.phone || '');
    } else {
      setEditingLocation(null);
      setName('');
      setType('store');
      setAddress('');
      setCity('');
      setPhone('');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = { name, type, address, city, phone };
      const response = editingLocation
        ? await apiRequest(`/locations/${editingLocation.id}`, { method: 'PUT', body: JSON.stringify(data) })
        : await apiRequest('/locations', { method: 'POST', body: JSON.stringify(data) });

      if (response.success) {
        setShowModal(false);
        loadLocations();
      }
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Locations</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <div key={location.id} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg">{location.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{location.type}</p>
            {location.address && <p className="text-sm mt-2">{location.address}</p>}
            {location.city && <p className="text-sm text-gray-600">{location.city}</p>}
            {location.phone && <p className="text-sm text-gray-600">{location.phone}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => handleOpenModal(location)} className="text-blue-600 text-sm hover:underline">Edit</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingLocation ? 'Edit' : 'Add'} Location</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Location Name" required className="w-full px-4 py-2 border rounded-lg" />
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                <option value="store">Store</option>
                <option value="warehouse">Warehouse</option>
              </select>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full px-4 py-2 border rounded-lg" />
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full px-4 py-2 border rounded-lg" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full px-4 py-2 border rounded-lg" />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
