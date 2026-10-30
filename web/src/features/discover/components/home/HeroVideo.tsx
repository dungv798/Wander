import { useEffect, useRef, useState } from 'react';
import { HERO_VIDEO } from '../../model/heroVideo.const.ts';
import { useHeroVideo } from './useHeroVideo.ts';

/** Giữ ảnh dưới video khi tải/lỗi; nhớ lựa chọn tạm dừng qua các lần chuyển tab. */
function VideoPlayer({ onError }: { readonly onError: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const element = video.current;
    /** Tab ẩn luôn dừng; chỉ phát lại nếu người xem chưa tự dừng. */
    function visibility() {
      if (document.hidden) element?.pause();
      else if (!userPaused.current) void element?.play().catch(() => {});
    }
    document.addEventListener('visibilitychange', visibility);
    visibility();
    return () => { document.removeEventListener('visibilitychange', visibility); element?.pause(); };
  }, []);
  /** Không báo trạng thái phát thành công trước khi trình duyệt thực sự phát được. */
  function toggle() {
    const element = video.current;
    if (!element) return;
    userPaused.current = !element.paused;
    if (userPaused.current) element.pause();
    else void element.play().catch(() => {});
  }
  return <>
    <video ref={video} className={`home-hero-video${started ? ' is-playing' : ''}`} src={HERO_VIDEO.src} poster={HERO_VIDEO.poster} muted loop playsInline autoPlay preload="none" aria-hidden="true" onPlaying={() => { if (document.hidden) video.current?.pause(); else { setStarted(true); setPaused(false); } }} onPause={() => setPaused(true)} onError={onError} />
    <button className="home-video-toggle" type="button" aria-label={paused ? HERO_VIDEO.play : HERO_VIDEO.pause} onClick={toggle}>{paused ? HERO_VIDEO.playSymbol : HERO_VIDEO.pauseSymbol}</button>
  </>;
}

/** Bộ lọc và bộ phát chỉ tải sau load/idle; ảnh hero vẫn nằm sẵn dưới media. */
export default function HeroVideo() {
  const { host, ready } = useHeroVideo();
  const [failed, setFailed] = useState(false);
  return <div ref={host} className="home-video-host">{ready && !failed ? <VideoPlayer onError={() => setFailed(true)} /> : null}</div>;
}

