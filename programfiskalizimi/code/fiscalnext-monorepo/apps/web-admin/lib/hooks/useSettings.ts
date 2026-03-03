import { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/api';

interface SystemSettings {
  taxRate: number;
  currency: string;
  receiptFooter: string;
  timeZone: string;
}

let cachedSettings: SystemSettings | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    taxRate: 20,
    currency: 'EUR',
    receiptFooter: 'Thank you!',
    timeZone: 'Europe/Tirane',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (cachedSettings) {
        setSettings(cachedSettings);
        setLoading(false);
        return;
      }

      try {
        const response = await settingsApi.getAll();
        if (response.data.success) {
          const systemSettings = response.data.settings.system;
          const newSettings = {
            taxRate: systemSettings.taxRate || 20,
            currency: systemSettings.currency || 'EUR',
            receiptFooter: systemSettings.receiptFooter || 'Thank you!',
            timeZone: systemSettings.timeZone || 'Europe/Tirane',
          };
          cachedSettings = newSettings;
          setSettings(newSettings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || settings.currency,
    }).format(amount);
  };

  const refreshSettings = async () => {
    cachedSettings = null;
    setLoading(true);
    try {
      const response = await settingsApi.getAll();
      if (response.data.success) {
        const systemSettings = response.data.settings.system;
        const newSettings = {
          taxRate: systemSettings.taxRate || 20,
          currency: systemSettings.currency || 'EUR',
          receiptFooter: systemSettings.receiptFooter || 'Thank you!',
          timeZone: systemSettings.timeZone || 'Europe/Tirane',
        };
        cachedSettings = newSettings;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to refresh settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, formatCurrency, refreshSettings };
}
