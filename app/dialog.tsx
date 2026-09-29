'use client';

import { useRouter } from 'next/navigation';
import { mutate } from './actions';
import { dialogHref } from './examples';

export default function Dialog({ kind, closePath }: { kind: 'edit' | 'result'; closePath: string }) {
  const router = useRouter();

  return (
    <aside role="dialog" aria-labelledby="dialog-title">
      <h2 id="dialog-title">{kind === 'result' ? 'Result' : 'Edit'} dialog</h2>
      <p>The current background page should remain visible.</p>
      <div className="buttons">
        <button onClick={() => router.replace(closePath)}>Close dialog</button>
        <button onClick={() => router.refresh()}>Router Refresh</button>
        {kind === 'result' ? (
          <button onClick={() => router.replace(dialogHref('edit', closePath))}>
            Back to Edit
          </button>
        ) : (
          <button onClick={async () => {
            await mutate();
            router.replace(dialogHref('result', closePath));
          }}>
            Mutate
          </button>
        )}
      </div>
      <p className="document-status">Close returns to <code>{closePath}</code>.</p>
    </aside>
  );
}
