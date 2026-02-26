/**
 * Entity Studio — Full-page editor for ghost partner profiles.
 * Replaces the inline Dossier modal with a sovereign editing environment.
 */

import { redirect } from 'next/navigation';
import { getCurrentOrgId } from '@/features/network/api/actions';
import { getNetworkNodeDetails } from '@/features/network-data';
import { EntityStudioClient } from './EntityStudioClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EntityStudioPage({ params }: PageProps) {
  const { id } = await params;
  const sourceOrgId = await getCurrentOrgId();
  if (!sourceOrgId) redirect('/network');

  const details = await getNetworkNodeDetails(id, 'external_partner', sourceOrgId);
  if (!details || details.kind !== 'external_partner' || !details.isGhost) {
    redirect('/network');
  }

  return (
    <EntityStudioClient
      details={details}
      sourceOrgId={sourceOrgId}
    />
  );
}
