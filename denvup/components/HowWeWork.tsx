import Reveal from "./Reveal";
import "./how-we-work.css";

// "How we work" used to sit at the bottom of About. The About screen now dissolves into Services,
// so these steps live right after Services instead, on the dark background.
const steps = [
  { n: "01", title: "Discovery", text: "We learn about your business, goals and audience." },
  { n: "02", title: "Strategy", text: "We plan the structure, features and the roadmap." },
  { n: "03", title: "Design", text: "We craft the look, feel and user experience." },
  { n: "04", title: "Development", text: "We build it fast, clean and ready to scale." },
  { n: "05", title: "Launch", text: "We test, launch and support you after going live." },
];

export default function HowWeWork() {
  return (
    <section className="hww">
      <div className="container">
        <Reveal>
          <p className="eyebrow">How we work</p>
          <h2 className="section-title">From idea to launch, step by step.</h2>
        </Reveal>
        <div className="process-grid">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="step">
                <span className="step-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}