import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function SignupPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#001a33] via-[#003366] to-[#004080] flex items-center justify-center p-4 lg:p-8">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FF851B] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#0074D9] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center w-full max-w-6xl">
        <div className="flex justify-center group">
          <img
            src={logo}
            alt="IskoMart Logo"
            className="w-48 h-auto md:w-64 lg:w-80 drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-transform duration-700 hover:scale-105"
          />
        </div>

        <div className="flex justify-center">
          <div className="bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md border border-white/20">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black mb-3 tracking-tight">
                {/* Original exact colors restored here */}
                <span className="text-[#0074D9]">Isko</span>
                <span className="text-[#FF851B]">Mart</span>
              </h1>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Join the Community
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Choose how you want to use IskoMart today.
              </p>
            </div>

            <div className="space-y-5">
              <Link
                to="/signup/customer"
                className="group relative flex items-center p-4 sm:p-5 bg-white border-2 border-gray-100 rounded-2xl hover:border-[#FF851B] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(255,133,27,0.15)] hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF851B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative flex-shrink-0 w-14 h-14 bg-[#FFF0E6] text-[#FF851B] rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF851B] group-hover:text-white transition-all duration-300 shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-7 h-7"
                  >
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 3c0-.55.45-1 1-1h1l3.6 7.59-1.35 2.44C4.52 13.53 5.12 15 6.5 15h12c.55 0 1-.45 1-1s-.45-1-1-1H6.5l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0019.52 2H5.21l-.94-2H2c-.55 0-1 .45-1 1s.45 1 1 1z" />
                  </svg>
                </div>

                <div className="relative ml-5 flex-grow text-left">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#FF851B] transition-colors">
                    Customer
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Shop and discover local items
                  </p>
                </div>

                <div className="relative text-gray-300 group-hover:text-[#FF851B] group-hover:translate-x-1 transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </Link>

              <Link
                to="/signup/merchant"
                className="group relative flex items-center p-4 sm:p-5 bg-white border-2 border-gray-100 rounded-2xl hover:border-[#1EA1F2] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(30,161,242,0.15)] hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#1EA1F2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative flex-shrink-0 w-14 h-14 bg-[#E1F3FE] text-[#1EA1F2] rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-[#1EA1F2] group-hover:text-white transition-all duration-300 shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-7 h-7"
                  >
                    <path d="M21.9 8.89l-1.05-4.37c-.22-.9-1-1.52-1.91-1.52H5.05c-.9 0-1.69.63-1.9 1.52L2.1 8.89c-.24 1.02.02 2.06.67 2.82.11.12.22.24.36.34v8.95c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8.95c.13-.1.25-.22.36-.34.65-.76.91-1.8.67-2.82zM15 11c-1.1 0-2-.9-2-2h-2c0 1.1-.9 2-2 2s-2-.9-2-2H5l1-4h12l1 4h-2c0 1.1-.9 2-2 2zM5 21v-8.04c.33.03.66.04 1 .04s.67-.01 1-.04V21H5zm14 0h-2v-8.04c.33.03.66.04 1 .04s.67-.01 1-.04V21h-2z" />
                  </svg>
                </div>

                <div className="relative ml-5 flex-grow text-left">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#1EA1F2] transition-colors">
                    Merchant
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Set up shop and start selling
                  </p>
                </div>

                <div className="relative text-gray-300 group-hover:text-[#1EA1F2] group-hover:translate-x-1 transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </Link>
            </div>

            <div className="text-center text-sm text-gray-500 mt-10">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-[#0074D9] hover:text-[#003366] transition-colors"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
