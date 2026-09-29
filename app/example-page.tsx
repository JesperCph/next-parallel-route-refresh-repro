import Link from 'next/link';
import { connection } from 'next/server';
import { dialogHref, examples, type Example, type PageName } from './examples';

export default async function ExamplePage({ example, page }: { example: Example; page: PageName }) {
  await connection();
  const routes = examples[example];

  return (
    <section data-testid="background" data-example={example}>
      <p className="example-label">{routes.label}</p>
      <h1>{page === 'home' ? 'Home Page' : 'About Page'}</h1>
      <nav aria-label="Example navigation">
        <Link href={routes.home}>Home Page</Link>
        <Link href={routes.about}>About Page</Link>
        <Link href={dialogHref('edit', routes[page])}>Edit Dialog</Link>
      </nav>
      <p>
        {example === 'flat'
          ? 'These pages sit directly under app/. The background should survive refresh.'
          : 'These pages sit under app/(site)/. This case demonstrates the unexpected reload.'}
      </p>
    </section>
  );
}
