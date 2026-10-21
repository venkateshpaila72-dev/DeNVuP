import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import SectionWords from "./SectionWords";

const services = [
  {
    n: "01",
    title: "Web Development",
    text: "Fast, scalable websites and web apps built with modern frameworks.",
  },
  {
    n: "02",
    title: "UI/UX Design",
    text: "Clear, beautiful interfaces designed around how people actually use them.",
  },
  {
    n: "03",
    title: "Branding",
    text: "Logos, color systems and visual identities that make brands memorable.",
  },
  {
    n: "04",
    title: "AI Solutions",
    text: "Practical AI features and tools that save time and add real value.",
  },
];

export default function Services() {
  return (
    <section id="services" className="section sw-host">
      <SectionWords words={["OUR", "SERVICES"]} tone="dark" />

      <div className="container">
        <Reveal>
          <p className="eyebrow">What we do</p>
          <h2 className="section-title">Services built to help brands grow.</h2>
        </Reveal>

        <div className="service-list">
          {services.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <article className="service">
                <span className="service-num">{s.n}</span>
                <h3 className="service-title">{s.title}</h3>
                <p className="service-text">{s.text}</p>
                <ArrowUpRight className="service-arrow" size={28} aria-hidden="true" />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}