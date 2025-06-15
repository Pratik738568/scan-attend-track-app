
import { Link } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import logo from "/placeholder.svg";

const Index = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-tr from-indigo-50 via-white to-indigo-100">
    <img src={logo} alt="QR Attendance App Logo" className="w-28 h-28 mb-4 rounded-full shadow-xl ring-2 ring-indigo-400"/>
    <h1 className="text-3xl font-extrabold text-indigo-700 mb-2 animate-fade-in">QR Attendance App</h1>
    <p className="text-lg text-gray-600 mb-8 text-center max-w-lg">Modern, effortless attendance tracking for Students, Faculty &amp; HOD. Scan. Generate. Oversee—All in one mobile experience.</p>
    <Link to="/auth" className="inline-flex items-center px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover-scale transition-all duration-200 text-lg">
      Get Started
      <ArrowDown size={22} className="ml-2 animate-bounce" />
    </Link>
    <div className="mt-10 text-sm text-gray-400">Powered by Lovable & Capacitor</div>
  </div>
);

export default Index;
