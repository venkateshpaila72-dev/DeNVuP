import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Reveal from "../../components/Reveal";
import TeamProfileCard from "../../components/TeamProfileCard";
import { team } from "../../lib/team";
import "../../components/team.css";

export const metadata: Metadata = {
  title: "Team Portfolios — DENVUP",
  description: "Meet the people behind DENVUP and explore their individual portfolios.",
};

export default function TeamPage() {
  return (
    <main className="team-page">
      <div className="container team-page-top">
        <Link href="/" className="team-back">
          <ArrowLeft size={16} /> Back to DENVUP
        </Link>

        <Link href="/" className="brand" aria-label="DENVUP home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/denvup-logo.png" alt="" className="brand-logo" />
          <span className="brand-name">DENVUP</span>
        </Link>
      </div>

      <div className="container team-page-body">
        <Reveal>
          <p className="eyebrow">Team Portfolios</p>
          <h1 className="section-title">Meet the people behind DENVUP.</h1>
          <p className="team-page-intro">
            Everyone on the team, with their skills and a link to their own portfolio.
          </p>
        </Reveal>

        <div className="team-grid">
          {team.map((m, i) => (
            <Reveal key={m.name} delay={(i % 2) * 0.1}>
              <TeamProfileCard member={m} />
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}