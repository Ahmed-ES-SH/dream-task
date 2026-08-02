import { Outlet } from "react-router";

import Navbar from "../components/website/Navbar";
import Footer from "../components/website/Footer";

export default function WebsiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
