import React, { useState } from 'react';
import { MapPin, Mail, Phone, Facebook, Instagram, Twitter, Youtube, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const Footer = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <footer className="bg-gradient-to-r from-green-800 to-green-500 text-white py-8 sm:py-12 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Accordion */}
        <div className="md:hidden space-y-2">
          {/* About Section */}
          <div className="border-b border-white/20 pb-2">
            <button 
              onClick={() => toggleSection('about')}
              className="w-full flex justify-between items-center text-left py-3 px-2 font-bold text-lg"
            >
              About BoxCric
              {expandedSection === 'about' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSection === 'about' && (
              <div className="px-2 pb-4 space-y-4">
                <p className="text-sm leading-relaxed">
                  BoxCric is your one-stop platform to discover, compare, and book the best box cricket grounds near you. 
                  Enjoy seamless booking, verified reviews, and exclusive offers for your next cricket match!
                </p>
                <div className="flex space-x-3 pt-2">
                  {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                    <a 
                      key={index} 
                      href="#" 
                      className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors duration-200"
                      aria-label={['Facebook', 'Instagram', 'Twitter', 'YouTube'][index]}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Services Section */}
          <div className="border-b border-white/20 pb-2">
            <button 
              onClick={() => toggleSection('services')}
              className="w-full flex justify-between items-center text-left py-3 px-2 font-bold text-lg"
            >
              Our Services
              {expandedSection === 'services' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSection === 'services' && (
              <ul className="px-2 pb-4 space-y-2">
                {['🏏 Ground Booking', '👥 Team Management', '📅 Match Scheduling', '💳 Online Payments', '📊 Player Stats & Leaderboards', '🏆 Tournaments'].map((item, index) => (
                  <li key={index} className="text-sm py-1 hover:text-green-200 transition-colors">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Links Section */}
          <div className="border-b border-white/20 pb-2">
            <button 
              onClick={() => toggleSection('links')}
              className="w-full flex justify-between items-center text-left py-3 px-2 font-bold text-lg"
            >
              Quick Links
              {expandedSection === 'links' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSection === 'links' && (
              <ul className="px-2 pb-4 space-y-2">
                {[
                  { text: 'About Us', path: '/about' },
                  { text: 'Help & Support', path: '/help' },
                  { text: 'My Bookings', path: '/profile' },
                  { text: 'Settings', path: '/settings' },
                  { text: 'Home', path: '/' },
                  { text: 'Tournaments', path: '/tournaments' }
                ].map((item, index) => (
                  <li key={index}>
                    <a 
                      href={item.path} 
                      className="text-sm py-1 hover:text-green-200 transition-colors flex items-center group"
                    >
                      {item.text}
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contact Section */}
          <div className="border-b border-white/20 pb-2">
            <button 
              onClick={() => toggleSection('contact')}
              className="w-full flex justify-between items-center text-left py-3 px-2 font-bold text-lg"
            >
              Contact Us
              {expandedSection === 'contact' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSection === 'contact' && (
              <div className="px-2 pb-4 space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">+91 98765 43210</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">support@boxcric.com</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Ahmedabad, Gujarat, India</span>
                  </li>
                </ul>
                
                <div className="pt-2">
                  <h4 className="text-sm font-semibold mb-2">Stay Updated</h4>
                  <div className="flex">
                    <input
                      type="email"
                      placeholder="Your email"
                      className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-l text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                    />
                    <button className="px-4 py-2 bg-white/20 hover:bg-white/30 transition-colors rounded-r text-sm font-medium">
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-2xl font-bold mb-2">About BoxCric</h3>
            <div className="w-16 h-1 bg-white mb-4" />
            <p className="text-sm mb-6 leading-relaxed">BoxCric is your one-stop platform to discover, compare, and book the best box cricket grounds near you. Enjoy seamless booking, verified reviews, and exclusive offers for your next cricket match!</p>
            <div className="flex space-x-3">
              <a href="#" className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors duration-200" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors duration-200" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors duration-200" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors duration-200" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Our Services */}
          <div>
            <h3 className="text-xl font-bold mb-2">Our Services</h3>
            <div className="w-12 h-1 bg-white mb-4" />
            <ul className="space-y-2 text-sm">
              {['🏏 Ground Booking', '👥 Team Management', '📅 Match Scheduling', '💳 Online Payments', '📊 Player Stats & Leaderboards', '🏆 Tournaments'].map((item, index) => (
                <li key={index} className="hover:text-green-200 transition-colors cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-2">Quick Links</h3>
            <div className="w-12 h-1 bg-white mb-4" />
            <ul className="space-y-2 text-sm">
              {[
                { text: 'About Us', path: '/about' },
                { text: 'Help & Support', path: '/help' },
                { text: 'My Bookings', path: '/profile' },
                { text: 'Settings', path: '/settings' },
                { text: 'Home', path: '/' },
                { text: 'Tournaments', path: '/tournaments' }
              ].map((item, index) => (
                <li key={index}>
                  <a 
                    href={item.path} 
                    className="hover:text-green-200 transition-colors flex items-center group"
                  >
                    {item.text}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact Us */}
          <div>
            <h3 className="text-xl font-bold mb-2">Contact Us</h3>
            <div className="w-12 h-1 bg-white mb-4" />
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>support@boxcric.com</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Ahmedabad, Gujarat, India</span>
              </li>
            </ul>
            
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Stay Updated</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-l text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                />
                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 transition-colors rounded-r text-sm font-medium">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 mt-8 pt-6 text-center text-sm">
          <p> 2024 BoxCric. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:underline">Terms of Service</a>
            <span>•</span>
            <a href="/cookies" className="hover:underline">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;