import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to POS interface
  redirect('/pos');
}
