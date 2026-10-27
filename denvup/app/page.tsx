import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import About from "../components/About";
import AboutToServices from "../components/AboutToServices";
import Services from "../components/Services";
import Work from "../components/Work";
import Team from "../components/Team";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AboutToServices about={<About />} services={<Services />} />
        <Marquee />
        <Work />
        <Team />
        <Contact />
      </main>
      <Footer />
    </>
  );
}