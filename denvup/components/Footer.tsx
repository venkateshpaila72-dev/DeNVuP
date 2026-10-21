export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <a href="#home" className="brand" aria-label="DENVUP home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/denvup-logo.png" alt="" className="brand-logo" />
          <span className="brand-name">DENVUP</span>
        </a>

        <nav className="footer-links" aria-label="Footer navigation">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#projects">Projects</a>
          <a href="#team">Team Portfolios</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="footer-social">
          {/* Replace "#" with your real social links */}
          <a href="#">Instagram</a>
          <a href="#">LinkedIn</a>
          <a href="#">GitHub</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>©2026 DENVUP. All rights reserved.</span>
      </div>
    </footer>
  );
}