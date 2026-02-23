// Kitchen Display Page - Full Screen KDS
// Built by: Tafa, Mela, Gesa

'use client';

import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';

export default function KitchenPage() {
  return <KitchenDisplay autoRefresh refreshInterval={5000} />;
}
