import Link from "next/link";
export default function Hero() {
  return (
    <div className="hero-container w-full h-screen text-white p-4 flex justify-center items-center">
      <div className="hero-content flex flex-col text-center gap-4">
        <h1 className="hero-title text-4xl">Welcome to Havenia</h1>
        <h3 className="hero-sub-heading text-md">
          <em>Your gateway to unforgettable stays, adventures, and flavors.</em>
        </h3>
        <p className="hero-description text-sm">
          Book island getaways, enjoy thrilling water activities, and taste
          local delights — all in one place.
        </p>
        <div className="hero-buttons flex flex-col justify-center items-center gap-4">
          <Link
            href="/rooms"
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition w-50 text-center"
          >
            Explore Stays
          </Link>
         
          <Link
            href="/activities"
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition w-50 text-center"
          >
            Discover Activities
          </Link>
          <Link
            href="/menu"
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition w-50 text-center"
          >
            Dive &amp; Dine
          </Link>
        </div>
      </div>
    </div>
  );
}
