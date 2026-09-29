import { connection } from 'next/server';
import ResultDialog from './ResultDialog';
import { resolveClosePath } from '../../examples';

export default async function ResultPage({ searchParams }: {
  searchParams: Promise<{ closePath?: string | string[] }>;
}) {
  await connection();
  const { closePath } = await searchParams;
  return <ResultDialog closePath={resolveClosePath(closePath)} />;
}
