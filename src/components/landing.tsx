"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Globe2,
  Heart,
  HeartPulse,
  Layers3,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { SiteHeader, Brand } from "./site-header";
import { QueuePreview } from "./queue-preview";
import { AnimatedShinyText } from "./ui/animated-shiny-text";
import { useLanguage } from "./providers";
const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};
export function Landing() {
  const { t } = useLanguage();
  return (
    <>
      <a className="skip-link" href="#main">
        {t.discover}
      </a>
      <SiteHeader />
      <main id="main">
        <section className="hero container">
          <motion.div className="hero-copy" {...reveal}>
            <div className="eyebrow-pill">
              <span className="status-dot" />
              <AnimatedShinyText>{t.badge}</AnimatedShinyText>
            </div>
            <h1>
              {t.hero1}
              <br />
              <span>{t.hero2}</span>
            </h1>
            <p className="hero-intro">{t.intro}</p>
            <div className="hero-actions">
              <Link className="button primary" href="/register">
                {t.create}
                <ArrowUpRight size={18} />
              </Link>
              <a className="button text-button" href="#how-it-works">
                {t.discover}
                <span className="play-icon">
                  <ArrowDown size={15} />
                </span>
              </a>
            </div>
            <div className="hero-assurances">
              <span>
                <Check size={14} />
                {t.free}
              </span>
              <span>
                <Check size={14} />
                {t.anywhere}
              </span>
            </div>
          </motion.div>
          <motion.div
            className="hero-visual"
            {...reveal}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <QueuePreview />
          </motion.div>
        </section>
        <div className="benefit-section container">
          <div className="benefit">
            <Clock3 />
            <div>
              <strong>{t.benefit1}</strong>
              <p>{t.benefit1Body}</p>
            </div>
          </div>
          <div className="benefit">
            <Layers3 />
            <div>
              <strong>{t.benefit2}</strong>
              <p>{t.benefit2Body}</p>
            </div>
          </div>
          <div className="benefit">
            <Globe2 />
            <div>
              <strong>{t.benefit3}</strong>
              <p>{t.benefit3Body}</p>
            </div>
          </div>
          <div className="benefit-signature">
            <Heart size={16} />
            <span>{t.built}</span>
          </div>
        </div>
        <section id="how-it-works" className="section container">
          <motion.div className="section-heading split-heading" {...reveal}>
            <div>
              <p className="eyebrow">{t.stepsLabel}</p>
              <h2>{t.stepsTitle}</h2>
            </div>
            <p>{t.stepsIntro}</p>
          </motion.div>
          <div className="steps-grid">
            {[
              { icon: UserRoundPlus, title: t.step1, body: t.step1Body },
              { icon: CalendarDays, title: t.step2, body: t.step2Body },
              { icon: HeartPulse, title: t.step3, body: t.step3Body },
            ].map((step, index) => (
              <motion.article
                className="step-card"
                key={index}
                {...reveal}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="step-top">
                  <span className="step-icon">
                    <step.icon size={23} />
                  </span>
                  <span className="step-number">0{index + 1}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <span
                  className={`availability ${index === 0 ? "available" : ""}`}
                >
                  <span />
                  {index === 0 ? t.available : t.roadmap}
                </span>
                {index < 2 && (
                  <span className="step-connector" aria-hidden>
                    <ArrowRight size={16} />
                  </span>
                )}
              </motion.article>
            ))}
          </div>
        </section>
        <section id="features" className="feature-section">
          <div className="container">
            <motion.div className="section-heading centered" {...reveal}>
              <p className="eyebrow">{t.featureLabel}</p>
              <h2>{t.featureTitle}</h2>
              <p>{t.featureIntro}</p>
            </motion.div>
            <div className="feature-grid">
              <motion.article
                className="feature-card large-feature"
                {...reveal}
              >
                <div className="feature-copy">
                  <span className="feature-icon">
                    <Sparkles size={20} />
                  </span>
                  <h3>{t.feature1}</h3>
                  <p>{t.feature1Body}</p>
                </div>
                <div className="journey-preview">
                  <div className="journey-header">
                    <HeartPulse size={18} />
                    <strong>{t.progress}</strong>
                    <span className="status-dot" />
                  </div>
                  <div className="journey-steps">
                    {[t.booked, t.checked, t.consultation].map((label, i) => (
                      <div key={i} className={i < 2 ? "complete" : ""}>
                        <span>
                          {i < 2 ? (
                            <Check size={14} />
                          ) : (
                            <Stethoscope size={15} />
                          )}
                        </span>
                        <p>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="journey-line">
                    <span />
                  </div>
                  <div className="journey-caption">
                    <ShieldCheck size={14} />
                    {t.sample}
                  </div>
                </div>
              </motion.article>
              <motion.article className="feature-card" {...reveal}>
                <span className="feature-icon">
                  <UsersRound size={20} />
                </span>
                <h3>{t.feature2}</h3>
                <p>{t.feature2Body}</p>
                <div className="care-illustration" aria-hidden>
                  <span>
                    <Building2 size={25} />
                  </span>
                  <i />
                  <span>
                    <Stethoscope size={25} />
                  </span>
                  <i />
                  <span>
                    <HeartPulse size={25} />
                  </span>
                </div>
              </motion.article>
              <motion.article
                className="feature-card language-feature"
                {...reveal}
              >
                <span className="feature-icon">
                  <Globe2 size={20} />
                </span>
                <h3>{t.feature3}</h3>
                <p>{t.feature3Body}</p>
                <div className="language-illustration" aria-hidden>
                  <span lang="si">ආයුබෝවන්</span>
                  <span lang="en">Hello.</span>
                  <Globe2 size={70} />
                </div>
              </motion.article>
            </div>
          </div>
        </section>
        <section id="faq" className="section container faq-section">
          <motion.div className="section-heading" {...reveal}>
            <p className="eyebrow">{t.faqLabel}</p>
            <h2>{t.faqTitle}</h2>
            <span className="faq-decoration" aria-hidden>
              ?
            </span>
          </motion.div>
          <div className="faq-list">
            {[
              [t.q1, t.a1],
              [t.q2, t.a2],
              [t.q3, t.a3],
              [t.q4, t.a4],
            ].map(([q, a], i) => (
              <details key={i} name="faq">
                <summary>
                  {q}
                  <ChevronDown size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="container">
          <motion.div className="cta-panel" {...reveal}>
            <div className="cta-art" aria-hidden>
              <HeartPulse size={96} />
            </div>
            <div>
              <p className="eyebrow">MEDIQUEUE</p>
              <h2>{t.ctaTitle}</h2>
              <p>{t.ctaBody}</p>
            </div>
            <Link href="/register" className="button dark-button">
              {t.create}
              <ArrowUpRight size={18} />
            </Link>
          </motion.div>
        </section>
      </main>
      <footer className="site-footer container">
        <div>
          <Brand />
          <p>{t.footer}</p>
        </div>
        <span>
          © {new Date().getFullYear()} {t.copyright}
        </span>
        <a href="#main" className="back-top" aria-label={t.home}>
          <ArrowUpRight size={20} />
        </a>
      </footer>
    </>
  );
}
