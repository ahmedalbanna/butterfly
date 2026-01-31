import Link from 'next/link';
import { Mail, Phone, MapPin, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm rotate-45">
                <Sparkles className="text-white w-4 h-4 -rotate-45" />
              </div>
              <h2 className="text-2xl font-headline font-bold text-primary tracking-tighter">
                LuxeFinds
              </h2>
            </div>
            <p className="text-neutral-400 text-sm">
              Your destination for exquisite luxury accessories. Curated with elegance, delivered with care.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-serif text-primary mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-neutral-400 hover:text-primary transition-colors text-sm">
                  Browse Collection
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-400 hover:text-primary transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-neutral-400 hover:text-primary transition-colors text-sm">
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-serif text-primary mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-neutral-400 text-sm">support@luxefinds.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-neutral-400 text-sm">+1 (555) 123-4567</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-neutral-400 text-sm">
                    123 Luxury Lane<br />
                    Beverly Hills, CA 90210
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-500 text-sm">
              © {new Date().getFullYear()} LuxeFinds. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-neutral-500 hover:text-primary transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="#" className="text-neutral-500 hover:text-primary transition-colors text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
