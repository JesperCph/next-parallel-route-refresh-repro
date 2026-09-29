import DocumentStatus from './document-status';
import './style.css';

export const metadata = { title: 'Parallel-route refresh reproduction' };

export default function RootLayout({ children, dialogs }) {
  return (
    <html lang="en">
      <body>
        <header>
          <p>Next.js parallel-route refresh reproduction</p>
          <nav aria-label="Choose example">
            {/* Deliberate document navigation resets history/cache between experiments. */}
            <a href="/home">Start flat example</a>
            <a href="/grouped-home">Start grouped example</a>
          </nav>
          <DocumentStatus />
          <details>
            <summary>Steps for either example</summary>
            <ol>
              <li>Start an example above (this deliberately loads a fresh document).</li>
              <li>Open Edit Dialog, click Mutate, then Close dialog.</li>
              <li>Click About Page, then open Edit Dialog again.</li>
              <li>Click Router Refresh. Watch the document number and background.</li>
            </ol>
            <p>Flat should retain About; grouped reproduces the reload. Skip step 3 for a no-navigation control.</p>
          </details>
        </header>
        <main>{children}</main>
        {dialogs}
      </body>
    </html>
  );
}
