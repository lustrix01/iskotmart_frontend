import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AiHelpChat from "../components/AiHelpChat";

export default function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7F9]">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <AiHelpChat />
    </div>
  );
}
