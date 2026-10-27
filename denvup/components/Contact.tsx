"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import "./motion.css"; // field label turns ember while you type

type Errors = { name?: string; email?: string; message?: string };

export default function Contact() {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const next: Errors = {};
    if (name.length < 2) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email address.";
    if (message.length < 10) next.message = "Tell us a little more (at least 10 characters).";

    setErrors(next);
    setSent(false);

    if (Object.keys(next).length === 0) {
      // TODO: send { name, email, message, service } to your backend / email service here.
      setSent(true);
      form.reset();
    }
  };

  return (
    <section id="contact" className="section">
      <div className="container contact-grid">
        <Reveal>
          <p className="eyebrow">Contact</p>
          <h2 className="section-title">Let&apos;s build something great together.</h2>
          <p className="contact-note">
            Tell us about your project and we&apos;ll get back to you.
          </p>
          <p className="contact-mail">hello@yourdomain.com</p>
          <p className="placeholder-note">(placeholder email, replace with yours)</p>
        </Reveal>

        <Reveal delay={0.1}>
          <form className="form" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" autoComplete="name" aria-invalid={!!errors.name} />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="service">Service</label>
              <select id="service" name="service" defaultValue="Web Development">
                <option>Web Development</option>
                <option>UI/UX Design</option>
                <option>Branding</option>
                <option>AI Solutions</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="message">Project details</label>
              <textarea id="message" name="message" rows={5} aria-invalid={!!errors.message} />
              {errors.message && <span className="error">{errors.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary">
              Send Message <ArrowRight size={16} />
            </button>

            {sent && (
              <p className="success" role="status">
                Thank you! Your message is ready. (Connect the form to your backend to receive it.)
              </p>
            )}
          </form>
        </Reveal>
      </div>
    </section>
  );
}