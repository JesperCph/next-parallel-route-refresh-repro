export const examples = {
  flat: { label: 'Flat control', home: '/home', about: '/about' },
  grouped: { label: 'Grouped reproduction', home: '/grouped-home', about: '/grouped-about' },
} as const;

export type Example = keyof typeof examples;
export type PageName = 'home' | 'about';

export function resolveClosePath(value: string | string[] | undefined): string {
  // Only permit known local pages; query input is never an arbitrary navigation URL.
  return Object.values(examples).some(example => example.home === value || example.about === value)
    ? value as string
    : examples.flat.home;
}

export function dialogHref(kind: 'edit' | 'result', closePath: string): string {
  return `/${kind}?${new URLSearchParams({ closePath }).toString()}`;
}
