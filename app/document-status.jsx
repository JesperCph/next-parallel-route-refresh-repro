'use client';

import { useEffect, useState } from 'react';

export default function DocumentStatus() {
  const [timeOrigin, setTimeOrigin] = useState(null);

  useEffect(() => {
    setTimeOrigin(performance.timeOrigin);
  }, []);

  return (
    <p className="document-status">
      Document time origin: <output data-testid="time-origin">{timeOrigin ?? 'hydrating…'}</output>
      <br />This number should stay unchanged throughout soft navigation and router refresh from any of the dialogs.
    </p>
  );
}
