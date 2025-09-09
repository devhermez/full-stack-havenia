import { FaInstagram, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function Company() {
    return (
        <div className="company-container bg-gray-700 text-white grid grid-cols-2 text-md p-8 gap-8 md:text-md lg:text-lg lg:flex lg:justify-between lg:pl-30 lg:pr-30 lg:pt-20 lg:pb-20">
            {/* ABOUT */}
      <div className="company-content">
        <h3 className="company-content-title font-semibold mb-3">ABOUT US</h3>
        <p className="company-contents">About Havenia</p>
        <p className="company-contents">Careers</p>
        <p className="company-contents">Press & News</p>
        <p className="company-contents">Feedback</p>
      </div>

      {/* SERVICES */}
      <div className="company-content">
        <h3 className="company-content-title font-semibold mb-3">SERVICES</h3>
        <p className="company-contents">IslandSync (Stays)</p>
        <p className="company-contents">AquaVibe (Activities)</p>
        <p className="company-contents">Dive & Dine (Food)</p>
        <p className="company-contents">Special Packages</p>
      </div>

      {/* SUPPORT */}
      <div className="company-content">
        <h3 className="company-content-title font-semibold mb-3">SUPPORT</h3>
        <p className="company-contents">FAQs</p>
        <p className="company-contents">Payments</p>
        <p className="company-contents">Reservations</p>
        <p className="company-contents">Delivery</p>
        <p className="company-contents">Customer Service</p>
      </div>

      {/* FOLLOW US */}
      <div className="company-content">
        <h3 className="company-content-title font-semibold mb-3">FOLLOW US</h3>
        <div className="flex gap-4 text-xl">
          <a
            href="https://instagram.com/havenia"
            aria-label="Instagram"
            target="_blank"
            rel="noreferrer"
          >
            <FaInstagram />
          </a>
          <a
            href="https://x.com/havenia"
            aria-label="X"
            target="_blank"
            rel="noreferrer"
          >
            <FaXTwitter />
          </a>
          <a
            href="https://facebook.com/havenia"
            aria-label="Facebook"
            target="_blank"
            rel="noreferrer"
          >
            <FaFacebook />
          </a>
        </div>
      </div>
        </div>
    )
}