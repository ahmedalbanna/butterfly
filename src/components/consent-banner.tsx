"use client"

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const KEY = 'luxefinds_consent';

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch { setVisible(true); }
  }, []);

  if (!visible) return null;

  const accept = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ analytics: true, at: new Date().toISOString() })); } catch {}
    setVisible(false);
  };
  const decline = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ analytics: false, at: new Date().toISOString() })); } catch {}
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[90] bg-black text-white border-t border-white/10 p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      <p className="text-xs md:text-sm text-white/80 max-w-2xl">
        We use essential cookies and, with your consent, analytics to improve our boutique. See our privacy policy for details.
        <span className="hidden md:inline"> You can change your choice anytime.</span>
      </p>
      <div className="flex gap-2 shrink-0">
        <Button variant="outline" onClick={decline} className="rounded-none border-white/20 text-white hover:bg-white/10 uppercase text-xs tracking-widest">Decline</Button>
        <Button onClick={accept} className="rounded-none bg-primary text-white hover:bg-white hover:text-primary uppercase text-xs tracking-widest">Accept</Button>
      </div>
    </div>
  );
}
