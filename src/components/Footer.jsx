import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#003366] text-white pt-12 pb-6 border-t-4 border-[#FF851B]">
      <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-white/10 pb-10">
        {/* Branding Section */}
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

        {/* Customer Support Links */}
        <div className="md:col-span-3">
          <h3 className="font-bold text-[#FF851B] mb-4 text-sm tracking-wide uppercase">
            Customer Support
          </h3>
          <ul className="space-y-2 text-[11px] text-gray-400 font-semibold uppercase">
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                Term & Policies
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                Help Center
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                Report an Issue
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Links Section */}
        <div className="md:col-span-4">
          <h3 className="font-bold text-[#FF851B] mb-4 text-sm tracking-wide uppercase">
            Quick Links
          </h3>
          <ul className="space-y-2 text-[11px] text-gray-400 font-semibold uppercase">
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                Bicol University Website
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                Student Portal
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-white transition-colors">
                BU Student Council
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 mt-6 text-center text-[10px] text-gray-500 font-medium italic">
        © 2026 IskoMart. Created by BU Information Technology Students (CANDL&).
      </div>
    </footer>
  );
}
