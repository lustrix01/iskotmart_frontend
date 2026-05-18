import { Link } from "react-router-dom";

const customerSupportLinks = [
  { label: "FAQ", href: "#" },
  { label: "Terms & Policies", href: "#" },
  { label: "Help Center", href: "#" },
  { label: "Report an Issue", href: "#" },
];

const quickLinks = [
  {
    label: "Bicol University Website",
    href: "https://example.com/bicol-university",
  },
  { label: "Student Portal", href: "https://example.com/student-portal" },
  { label: "BU Student Council", href: "https://example.com/student-council" },
];

function FooterLink({ link }) {
  const className = "hover:text-white transition-colors";

  if (link.href) {
    return (
      <a href={link.href} className={className} target="_blank" rel="noreferrer">
        {link.label}
      </a>
    );
  }

  return (
    <Link to={link.to || "#"} className={className}>
      {link.label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#003366] text-white pt-12 pb-6 border-t-4 border-[#FF851B]">
      <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-white/10 pb-10">
        <div className="md:col-span-5">
          <h2 className="text-2xl font-black mb-4 italic">
            <span className="text-[#0074D9]">Isko</span>
            <span className="text-[#FF851B]">Mart</span>
          </h2>
          <p className="text-[11px] text-gray-300 leading-relaxed uppercase max-w-sm font-medium">
            The official student marketplace of Bicol University. Bridging the
            gap between student innovation and the campus community through a
            secure, modern e-commerce experience.
          </p>
        </div>

        <div className="md:col-span-3">
          <h3 className="font-bold text-[#FF851B] mb-4 text-sm tracking-wide uppercase">
            Customer Support
          </h3>
          <ul className="space-y-2 text-[11px] text-gray-400 font-semibold uppercase">
            {customerSupportLinks.map((link) => (
              <li key={link.label}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <h3 className="font-bold text-[#FF851B] mb-4 text-sm tracking-wide uppercase">
            Quick Links
          </h3>
          <ul className="space-y-2 text-[11px] text-gray-400 font-semibold uppercase">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 mt-6 text-center text-[10px] text-gray-500 font-medium italic">
        &copy; 2026 IskoMart. Created by BU Information Technology Students
        (CANDL&).
      </div>
    </footer>
  );
}
