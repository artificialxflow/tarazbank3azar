import { TarazShell } from '@/components/TarazShell';
import { getSnapshot } from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const initialData = getSnapshot();
  return <TarazShell initialData={initialData} />;
}
