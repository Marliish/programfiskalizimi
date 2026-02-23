'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export default function TaxSettingsPage() {
  const [country, setCountry] = useState<'AL' | 'XK'>('AL');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error'; text: string}|null>(null);

  // Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [certificate, setCertificate] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [integrationEnabled, setIntegrationEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [country]);

  const loadSettings = async () => {
    try {
      const response = await apiRequest(`/tax-integration/settings?country=${country}`);
      if (response.success && response.settings) {
        setSettings(response.settings);
        setUsername(response.settings[country === 'AL' ? 'dgtUsername' : 'atkUsername'] || '');
        setTestMode(response.settings.testMode ?? true);
        setIntegrationEnabled(response.settings.integrationEnabled ?? false);
      }
    } catch (error) {
      console.error('Failed to load tax settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const data = { country, username, password: password || undefined, certificate: certificate || undefined, testMode, integrationEnabled };
      const response = await apiRequest('/tax-integration/settings', { method: 'PUT', body: JSON.stringify(data) });
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setPassword(''); // Clear password field
        loadSettings();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setMessage(null);

    try {
      const response = await apiRequest('/tax-integration/test-connection', { method: 'POST', body: JSON.stringify({ country }) });
      
      if (response.success) {
        setMessage({ type: 'success', text: response.result.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Connection test failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tax Authority Integration</h1>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-yellow-800 mb-1">⚠️ MOCK MODE</h3>
        <p className="text-sm text-yellow-700">This is a test/mock implementation. No real connections are made to tax authorities. Real integration requires valid certificates and credentials.</p>
      </div>

      {/* Country Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium mb-2">Country</label>
        <select value={country} onChange={(e) => setCountry(e.target.value as 'AL'|'XK')} className="w-full px-4 py-2 border rounded-lg">
          <option value="AL">🇦🇱 Albania (DGT)</option>
          <option value="XK">🇽🇰 Kosovo (ATK)</option>
        </select>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={country === 'AL' ? 'DGT Username' : 'ATK Username'} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Certificate (Base64 or PEM)</label>
          <textarea value={certificate} onChange={(e) => setCertificate(e.target.value)} placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----" rows={5} className="w-full px-4 py-2 border rounded-lg font-mono text-sm" />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={testMode} onChange={(e) => setTestMode(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">Test Mode</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={integrationEnabled} onChange={(e) => setIntegrationEnabled(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">Enable Integration</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button type="button" onClick={handleTestConnection} disabled={testingConnection} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300">
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </form>

      {/* Certificate Status */}
      {settings?.certificateStatus && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="font-semibold mb-2">Certificate Status</h3>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${settings.certificateStatus === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {settings.certificateStatus.toUpperCase()}
            </span>
            {settings.certificateExpiresAt && <span className="text-sm text-gray-600">Expires: {new Date(settings.certificateExpiresAt).toLocaleDateString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
