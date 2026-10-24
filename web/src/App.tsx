import { useCallback, useEffect, useState } from 'react';
import { getToken } from './api';
import { Onboarding } from './Onboarding';
import { Recover } from './Recover';
import { Security } from './Security';
import { Trips } from './Trips';
import { TripView } from './TripView';

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export function App() {
  const hash = useHash();
  const [signedIn, setSignedIn] = useState(() => getToken() !== null);

  const ready = useCallback(() => {
    setSignedIn(true);
    window.location.hash = '#/';
  }, []);

  let content;
  if (hash === '#/recover') {
    content = <Recover onReady={ready} />;
  } else if (!signedIn) {
    content = <Onboarding onReady={ready} />;
  } else if (hash === '#/security') {
    content = (
      <Security
        onSignedOut={() => {
          setSignedIn(false);
          window.location.hash = '#/';
        }}
      />
    );
  } else {
    const m = /^#\/trip\/([A-Za-z0-9-]+)$/.exec(hash);
    content = m ? <TripView key={m[1]} tripId={m[1]!} /> : <Trips />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          Wander
        </a>
      </header>
      <main>{content}</main>
    </div>
  );
}
