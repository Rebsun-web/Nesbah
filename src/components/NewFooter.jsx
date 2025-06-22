import { Link } from '@/components/link'
import { Logo } from './logo'

function SocialIconX(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M12.6 0h2.454l-5.36 6.778L16 16h-4.937l-3.867-5.594L2.771 16H.316l5.733-7.25L0 0h5.063l3.495 5.114L12.6 0zm-.86 14.376h1.36L4.323 1.539H2.865l8.875 12.837z" />
    </svg>
  )
}

function SocialIconFacebook(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 8.05C16 3.603 12.418 0 8 0S0 3.604 0 8.05c0 4.016 2.926 7.346 6.75 7.95v-5.624H4.718V8.05H6.75V6.276c0-2.017 1.194-3.131 3.022-3.131.875 0 1.79.157 1.79.157v1.98h-1.008c-.994 0-1.304.62-1.304 1.257v1.51h2.219l-.355 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.95z"
      />
    </svg>
  )
}

function SocialIconLinkedIn(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M14.82 0H1.18A1.169 1.169 0 000 1.154v13.694A1.168 1.168 0 001.18 16h13.64A1.17 1.17 0 0016 14.845V1.15A1.171 1.171 0 0014.82 0zM4.744 13.64H2.369V5.996h2.375v7.644zm-1.18-8.684a1.377 1.377 0 11.52-.106 1.377 1.377 0 01-.527.103l.007.003zm10.075 8.683h-2.375V9.921c0-.885-.015-2.025-1.234-2.025-1.218 0-1.425.966-1.425 1.968v3.775H6.233V5.997H8.51v1.05h.032c.317-.601 1.09-1.235 2.246-1.235 2.405-.005 2.851 1.578 2.851 3.63v4.197z" />
    </svg>
  )
}

export function NewFooter() {
  return (
    <footer className="bg-[#1E1851]">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

          {/* First Column - Logo, Address, and Contact Info */}
          <div>
            <img src="/logo/BnwLogo.png" alt="Your Company Logo" className="h-10" />
            <p className="mt-4 text-sm text-white">
              King fahad road 509, Riyadh, Saudi Arabia
            </p>
            <p className="mt-2 text-sm text-white">
               admin@nesbah.com.sa
            </p>
          </div>

          {/* Second Column - Company */}
          <div className= "lg:pr-16">
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-6 space-y-4">
              <li><a href="#" className="text-sm text-white hover:text-white">About</a></li>
              <li><a href="#" className="text-sm text-white hover:text-white">Blog</a></li>
              <li><a href="#" className="text-sm text-white hover:text-white">Jobs</a></li>
              <li><a href="#" className="text-sm text-white hover:text-white">Press</a></li>
            </ul>
          </div>

          {/* Third Column - Legal */}
          <div className="lg:pl-16">
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-6 space-y-4">
              <li><a href="#" className="text-sm text-white hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-white hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-white hover:text-white">License</a></li>
            </ul>
          </div>

          {/* Fourth Column - Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-white">Subscribe to our newsletter</h3>
            <p className="mt-2 text-sm text-gray-300">
              The latest news, articles, and resources, sent to your inbox weekly.
            </p>
            <form className="mt-6">
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-md bg-white px-3 py-1.5 text-base text-black placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 focus:ring-2 focus:ring-indigo-500"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Footer Bottom Section */}
        <div className="mt-16 border-t border-white/10 pt-8 flex flex-col md:flex-row md:justify-between">
          <p className="text-sm text-white">
            © 2025 نسبة</p>
          <div className="flex gap-x-6 mt-4 md:mt-0">
            <Link
              href="https://x.com/NesbahSA?t=oEpXel6Qda5YZfrLKn5VaQ&s=09"
              target="_blank"
              aria-label="Visit us on X"
              className="text-white data-[hover]:text-white/75"
            >
              <SocialIconX className="size-4" />
            </Link>
            <Link
              href="https://www.linkedin.com/company/nesbah/"
              target="_blank"
              aria-label="Visit us on LinkedIn"
              className="text-white data-[hover]:text-white/75"
            >
              <SocialIconLinkedIn className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
