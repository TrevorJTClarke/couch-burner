import React from 'react';
import Link from 'next/link';
import { WalletSection } from '../components';

export const Header = () => {
  return (
    <header className="sticky top-0 z-[99999] px-8 hidden h-24 w-full max-w-full border-b border-zinc-800 bg-black lg:flex lg:flex-row lg:items-center lg:justify-between">
      <div className="flex">
        <Link href="/">
          <div className="flex items-center transition-transform focus:scale-110 focus:outline-0 focus:drop-shadow-primary">
            <img src="/stargaze.svg" alt="stargaze" width="124" height="30" />
            <img src="/dumpsterfire.png" alt="burner" width="70" height="30" />
          </div>
        </Link>
      </div>

      <WalletSection />
    </header>
  );
}
