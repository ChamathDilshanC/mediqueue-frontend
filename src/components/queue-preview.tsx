"use client";
import {
  BellRing,
  Building2,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Ellipsis,
  HeartPulse,
} from "lucide-react";
import { useLanguage } from "./providers";
export function QueuePreview({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className={`queue-scene ${compact ? "compact" : ""}`}>
      <div className="scene-grid" aria-hidden />
      <div className="scene-orbit orbit-one" aria-hidden />
      <div className="scene-orbit orbit-two" aria-hidden />
      <div className="scene-caption">
        <span className="tiny-cross">+</span>
        {t.preview}
        <span className="tiny-cross">+</span>
      </div>
      <div className="queue-card">
        <div className="queue-card-header">
          <span className="hospital-icon">
            <Building2 size={22} />
          </span>
          <div>
            <strong>{t.outpatient}</strong>
            <span>{t.branch}</span>
          </div>
          <Ellipsis size={20} className="muted" aria-hidden />
        </div>
        <div className="queue-card-body">
          <div className="queue-status">
            <span className="status-dot" />
            {t.queue}
            <HeartPulse size={17} />
          </div>
          <div className="token-grid">
            <div>
              <span className="token-label">{t.token}</span>
              <strong className="your-token">A–024</strong>
            </div>
            <div className="serving">
              <span className="token-label">{t.serving}</span>
              <strong>A–021</strong>
            </div>
          </div>
          <div className="queue-divider">
            <i />
            <i />
          </div>
          <div className="queue-people">
            <div className="people-icons" aria-hidden>
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <span
                  className={
                    n < 3
                      ? "person filled"
                      : n === 3
                        ? "person current"
                        : "person"
                  }
                  key={n}
                >
                  <i />
                  <b />
                </span>
              ))}
            </div>
            <p>
              <strong className="latin">3</strong> {t.ahead}
            </p>
          </div>
          <div className="wait-box">
            <Clock3 size={19} />
            <div>
              <span>{t.estimate}</span>
              <strong>
                <span className="latin">12–15</span> {t.minutes}
              </strong>
            </div>
            <span className="wait-bars" aria-hidden>
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
          <p className="time-note">{t.timeNote}</p>
        </div>
        <div className="queue-card-footer">
          <span>
            <CheckCheck size={16} />
            {t.confirmed}
          </span>
          <ChevronRight size={15} />
        </div>
      </div>
      {!compact && (
        <>
          <div className="floating-note confirmation-note">
            <span className="round-check">
              <Check size={16} />
            </span>
            <div>
              <strong>{t.confirmed}</strong>
              <span>{t.ready}</span>
            </div>
            <span className="note-dot" />
          </div>
          <div className="floating-note notification-note">
            <span className="bell-icon">
              <BellRing size={19} />
            </span>
            <div>
              <strong>{t.notification}</strong>
              <span>{t.notificationBody}</span>
            </div>
          </div>
        </>
      )}
      <span className="sample-label">{t.sample}</span>
    </div>
  );
}
