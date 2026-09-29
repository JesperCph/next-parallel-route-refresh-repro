import { connection } from 'next/server';
import EditDialog from './EditDialog';
import { resolveClosePath } from '../../examples';

export default async function EditPage({ searchParams }: {
  searchParams: Promise<{ closePath?: string | string[] }>;
}) {
  await connection();
  const { closePath } = await searchParams;
  return <EditDialog closePath={resolveClosePath(closePath)} />;
}
