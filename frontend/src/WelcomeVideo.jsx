import { useCallback, useEffect, useRef, useState } from "react";
import { requestJson } from "./api.js";

const progressUrl = "/api/video/progress";
const idleBeforeCollapse = 10_000;

function VideoPlayer({ onRetry, onSaveError, collapseScrollY }) {
  const [startAt, setStartAt] = useState(null);
  const [failure, setFailure] = useState("");
  const stallTimer = useRef(null);
  const idleTimer = useRef(null);
  const pendingSave = useRef(Promise.resolve());

  const videoRef = useRef(null);
  const tileRef = useRef(null);
  const [expanded, setExpanded] = useState(true);

  const closeDrawer = useCallback(() => {
    clearTimeout(idleTimer.current);
    videoRef.current?.pause();
    if (document.activeElement === videoRef.current) {
      // Give keyboard focus back to the button before the player folds away.
      tileRef.current?.focus({ preventScroll: true });
    }
    setExpanded(false);
  }, []);

  const restartIdleTimer = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (!expanded || !videoRef.current?.paused) return;

    idleTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) return;
      closeDrawer();
    }, idleBeforeCollapse);
  }, [expanded, closeDrawer]);

  useEffect(() => {
    if (!expanded) return;
    let lastPageY = window.scrollY;

    function onPageScroll() {
      const y = window.scrollY;
      if (y > lastPageY && y >= collapseScrollY - 1) closeDrawer();
      lastPageY = y;
    }

    function onWheel(event) {
      // At the bottom, a wheel gesture can arrive without a scroll event.
      if (event.deltaY > 0 && !event.ctrlKey && window.scrollY >= collapseScrollY - 1) {
        closeDrawer();
      }
    }

    window.addEventListener("scroll", onPageScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("scroll", onPageScroll);
      window.removeEventListener("wheel", onWheel);
    };
  }, [expanded, closeDrawer, collapseScrollY]);

  useEffect(() => {
    restartIdleTimer();
    return () => clearTimeout(idleTimer.current);
  }, [restartIdleTimer, startAt, failure]);

  function stopTimer() {
    clearTimeout(stallTimer.current);
  }

  function watchForStall() {
    stopTimer();
    stallTimer.current = setTimeout(() => {
      setFailure("The welcome video is taking too long to load.");
    }, 15000);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosition() {
      try {
        const progress = await requestJson(progressUrl, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        });

        if (!controller.signal.aborted) setStartAt(progress.positionSeconds);
      } catch {
        if (!controller.signal.aborted) {
          setFailure("Your saved video position couldn’t be loaded.");
        }
      }
    }

    loadPosition();

    return () => {
      controller.abort();
      clearTimeout(stallTimer.current);
    };
  }, []);

  function restorePosition(event) {
    const video = event.currentTarget;
    stopTimer();

    // A finished video opens at the beginning.
    if (startAt > 0 && startAt < video.duration) {
      video.currentTime = startAt;
    }
  }

  function savePosition(event) {
    const video = event.currentTarget;
    if (video.error || video.readyState === 0) return;

    const positionSeconds = video.currentTime;

    // An earlier pause mustn't overwrite a later one.
    pendingSave.current = pendingSave.current
      .then(() => requestJson(progressUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionSeconds }),
        keepalive: true,
      }))
      .catch(() => {
        onSaveError("Couldn’t save your video position. Play and pause again to retry.");
      });
  }

  return (
    <div
      onPointerMove={restartIdleTimer}
      onPointerDown={restartIdleTimer}
      onKeyDown={restartIdleTimer}
      onFocus={restartIdleTimer}
    >
      <button
        ref={tileRef}
        type="button"
        className="video-tile"
        aria-controls="welcome-player"
        aria-expanded={expanded}
        onClick={() => expanded ? closeDrawer() : setExpanded(true)}
      >
        <span>Welcome video</span>
        <span className="video-chevron" aria-hidden="true" />
      </button>

      <div
        id="welcome-player"
        className="video-drawer"
        data-expanded={expanded}
        inert={!expanded}
      >
        <div className="video-clip">
          {failure ? (
            <div className="video-fallback">
              <p role="alert">{failure}</p>
              <button onClick={onRetry}>Try again</button>
            </div>
          ) : startAt === null ? (
            <p className="video-loading" role="status">Loading welcome video…</p>
          ) : <video
            ref={videoRef}
            controls
            playsInline
            width="320"
            height="176"
            preload="metadata"
            src="/media/welcome.mp4"
            aria-label="Welcome to the reading challenge"
            onLoadStart={watchForStall}
            onLoadedMetadata={restorePosition}
            onWaiting={watchForStall}
            onCanPlay={stopTimer}
            onPlay={() => clearTimeout(idleTimer.current)}
            onSeeked={restartIdleTimer}
            onVolumeChange={restartIdleTimer}
            onPlaying={stopTimer}
            onPause={(event) => {
              stopTimer();
              savePosition(event);
              restartIdleTimer();
            }}
            onEnded={() => {
              stopTimer();
              restartIdleTimer();
            }}
            onError={() => {
              stopTimer();
              setFailure("The welcome video couldn’t be played.");
            }}
          />}
        </div>
      </div>
    </div>
  );
}

export default function WelcomeVideo({ onSaveError, collapseScrollY }) {
  const [attempt, setAttempt] = useState(0);

  return (
    <section id="welcome" className="welcome-card panel" aria-label="Welcome video">
      <VideoPlayer
        key={attempt}
        onRetry={() => setAttempt((n) => n + 1)}
        onSaveError={onSaveError}
        collapseScrollY={collapseScrollY}
      />
    </section>
  );
}
