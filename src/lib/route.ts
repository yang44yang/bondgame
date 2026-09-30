/** View state mirrored into the URL hash, so the iPad back gesture returns to the home page. No router library. */
import { useCallback, useEffect, useState } from 'react';

export type View = { name: 'home' } | { name: 'level'; id: number } | { name: 'exam' } | { name: 'sandbox' };

export function parseHash(hash: string): View {
  const h = hash.replace(/^#\/?/, '');
  const level = /^level\/(\d{1,2})$/.exec(h);
  if (level) return { name: 'level', id: Number(level[1]) };
  if (h === 'exam') return { name: 'exam' };
  if (h === 'sandbox') return { name: 'sandbox' };
  return { name: 'home' };
}

export function toHash(v: View): string {
  switch (v.name) {
    case 'level': return `#/level/${v.id}`;
    case 'exam': return '#/exam';
    case 'sandbox': return '#/sandbox';
    default: return '#/';
  }
}

export function useView(): [View, (v: View) => void] {
  const [view, setView] = useState<View>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onHash = () => setView(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = useCallback((v: View) => {
    const h = toHash(v);
    if (window.location.hash !== h) window.location.hash = h;
    else setView(v);
  }, []);
  return [view, go];
}

/** `?dev=1` shows the progress simulator and the "mark cleared" buttons, also on the deployed site. */
export const DEV = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1';
