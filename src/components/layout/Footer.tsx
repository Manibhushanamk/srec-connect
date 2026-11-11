import Link from 'next/link';
import { Shield, Award, Users, BookOpen, Calendar, MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Youtube, Github, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const FOOTER_LINKS = {
  explore: [
    { label: 'Achievements', href: '/achievements' },
    { label: 'Events', href: '/events' },
    { label: 'Faculty', href: '/faculty' },
    { label: 'Students', href: '/students' },
  ],
  resources: [
    { label: 'About SREC', href: '/about' },
    { label: 'NAAC Accreditation', href: '/about#naac' },
    { label: 'NBA Accreditation', href: '/about#nba' },
    { label: 'Autonomous Status', href: '/about#autonomous' },
    { label: 'Contact Us', href: '/contact' },
  ],
  admin: [
    { label: 'Admin Login', href: '/auth/signin' },
    { label: 'Student Portal', href: '/dashboard/student' },
    { label: 'Faculty Portal', href: '/dashboard/faculty' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com/srecnandyal', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/srecnandyal', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/school/srec-nandyal', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com/@srecnandyal', label: 'YouTube' },
  { icon: Github, href: 'https://github.com/srec-connect', label: 'GitHub' },
];

const CONTACT_INFO = [
  { icon: MapPin, label: 'Address', value: 'NH-40, Nandyal, Kurnool District, Andhra Pradesh - 518501' },
  { icon: Phone, label: 'Phone', value: '+91 8514 275 200' },
  { icon: Mail, label: 'Email', value: 'principal@srec.ac.in' },
];

export function Footer() {
  return (
    <footer className="bg-space-950 border-t border-slate-800/50" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2" aria-label="SREC Connect Home">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]">
                <Shield className="w-6 h-6 text-white" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500/30 via-cyan-500/20 to-emerald-500/30 blur-xl opacity-50 animate-pulse" />
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400">
                SREC Connect
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              Empowering Multi-Disciplinary Excellence & Campus Milestones. The official digital platform for showcasing achievements, events, and academic excellence at Santhiram Engineering College.
            </p>
            <div className="flex items-center gap-4 pt-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-space-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-brand-500/20 hover:border-brand-500/30 transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-3" role="list">
              {FOOTER_LINKS.explore.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-brand-400 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3" role="list">
              {FOOTER_LINKS.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-brand-400 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Contact</h3>
            <address className="not-italic space-y-4 text-sm text-slate-400">
              {CONTACT_INFO.map((contact) => (
                <div key={contact.label} className="flex items-start gap-3">
                  <contact.icon className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-slate-300">{contact.label}</p>
                    <p>{contact.value}</p>
                  </div>
                </div>
              ))}
            </address>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-slate-500">
              <p>
                © {new Date().getFullYear()} Santhiram Engineering College (Autonomous), Nandyal. All rights reserved.
              </p>
              <div className="flex items-center gap-3 text-slate-400">
                <Link href="/privacy" className="hover:text-white transition-colors underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-white transition-colors underline-offset-4 hover:underline">
                  Terms of Service
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span>AICTE Approved</span>
              <span>JNTUA Affiliated</span>
              <span>NAAC A+ Grade</span>
              <span>NBA Accredited</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}