import { useCallback, useEffect, useState } from 'react';
import { getToken } from './api';
import { Deck } from './discover/Deck';
import { Destination } from './discover/Destination';
import { Explore } from './discover/Explore';
import { Picked } from './discover/Picked';
import { TabBar } from './discover/TabBar';
import type { Tab } from './discover/TabBar';
import { discover, useDiscover } from './discover/store';
import { Onboarding } from './Onboarding';
import { Recover } from './Recover';
import { Security } from './Security';
import { Trips } from './Trips';
import { TripView } from './TripView';

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

const ID = '([a-z0-9]+(?:-[a-z0-9]+)*)';

/** Trang khám phá (giao diện .disc): tự vẽ toàn màn hình, có hoặc không có thanh tab. */
function DiscoverPage({ hash }: { hash: string }) {
  const s = useDiscover();
  const pickedCount = Object.values(s.decisions).filter((v) => v === 'like').length;
  const swipe = new RegExp('^#/dest/' + ID + '/swipe$').exec(hash);
  const dest = new RegExp('^#/dest/' + ID + '$').exec(hash);
  let content;
  let tab: Tab | null = null;
  if (swipe) content = <Deck key={swipe[1]} id={swipe[1]!} />;
  else if (dest) content = <Destination key={dest[1]} id={dest[1]!} />;
  else if (hash === '#/picked') {
    content = <Picked destinationId={s.lastDest} />;
    tab = 'picked';
  } else {
    content = <Explore />;
    tab = 'explore';
  }
  return (
    <div className={tab ? 'disc' : 'disc nobar'}>
      {content}
      {tab ? <TabBar current={tab} pickedCount={pickedCount} /> : null}
    </div>
  );
}

export function App() {
  const hash = useHash();
  const [signedIn, setSignedIn] = useState(() => getToken() !== null);
  const s = useDiscover();
  const pickedCount = Object.values(s.decisions).filter((v) => v === 'like').length;

  /** Sau khi vào được: người mới tới Khám phá, người khôi phục tài khoản về danh sách chuyến của họ. */
  const ready = useCallback((to: string) => {
    setSignedIn(true);
    window.location.hash = to;
  }, []);

  if (hash === '#/recover') {
    return (
      <div className="app">
        <header className="topbar">
          <a href="#/" className="brand">
            Wander
          </a>
        </header>
        <main>
          <Recover onReady={() => ready('#/trips')} />
        </main>
      </div>
    );
  }
  if (!signedIn) {
    return (
      <div className="app">
        <header className="topbar">
          <a href="#/" className="brand">
            Wander
          </a>
        </header>
        <main>
          <Onboarding onReady={() => ready('#/')} />
        </main>
      </div>
    );
  }

  const isTrips = hash === '#/trips';
  const tripMatch = /^#\/trip\/([A-Za-z0-9-]+)$/.exec(hash);
  if (!isTrips && !tripMatch && hash !== '#/security') return <DiscoverPage hash={hash} />;

  let content;
  if (hash === '#/security') {
    content = (
      <Security
        onSignedOut={() => {
          discover.reset();
          setSignedIn(false);
          window.location.hash = '#/';
        }}
      />
    );
  } else {
    content = tripMatch ? <TripView key={tripMatch[1]} tripId={tripMatch[1]!} /> : <Trips />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          Wander
        </a>
      </header>
      <main style={isTrips ? { paddingBottom: 112 } : undefined}>{content}</main>
      {isTrips ? (
        <div className="disc" style={{ minHeight: 0, height: 0, background: 'none' }}>
          <TabBar current="trips" pickedCount={pickedCount} />
        </div>
      ) : null}
    </div>
  );
}
