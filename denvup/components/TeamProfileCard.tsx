import { ArrowUpRight } from "lucide-react";
import { slugOf, type TeamMember } from "../lib/team";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function TeamProfileCard({ member }: { member: TeamMember }) {
  const hasPortfolio = !!member.portfolioUrl;

  // only links that really exist are shown
  const socials = [
    { label: "GitHub", url: member.github },
    { label: "LinkedIn", url: member.linkedin },
    { label: "Website", url: member.website },
  ].filter((s) => !!s.url);

  return (
    <article id={slugOf(member.name)} className="team-card">
      <div className="team-photo">
        {member.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photo} alt={`Photo of ${member.name}`} loading="lazy" />
        ) : (
          <span className="team-initials" aria-hidden="true">
            {initials(member.name)}
          </span>
        )}
      </div>

      <div className="team-body">
        <h3 className="team-name">{member.name}</h3>
        <p className="team-role">{member.role}</p>
        <p className="team-bio">{member.bio}</p>

        {member.skills && member.skills.length > 0 && (
          <ul className="team-skills" aria-label={`${member.name}'s skills`}>
            {member.skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}

        {hasPortfolio ? (
          <a
            href={member.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm team-link"
            aria-label={`View ${member.name}'s portfolio (opens in a new tab)`}
          >
            View Portfolio <ArrowUpRight size={14} />
          </a>
        ) : (
          <span className="btn btn-outline btn-sm team-link is-disabled" aria-disabled="true">
            Portfolio coming soon
          </span>
        )}

        {socials.length > 0 && (
          <div className="team-socials">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on ${s.label} (opens in a new tab)`}
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}