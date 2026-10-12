import { redirect } from 'next/navigation';

export default async function PodDetailPage({ params }) {
  const { id } = await params;
  redirect(`/pods?id=${id}`);
}
