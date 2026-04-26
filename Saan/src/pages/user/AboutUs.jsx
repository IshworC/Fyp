import React from "react";
import { 
  FaUsers, 
  FaCalendarCheck, 
  FaStar, 
  FaMapMarkerAlt, 
  FaAward,
  FaHandshake,
  FaHeart,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter
} from "react-icons/fa";
import Navigation from "../../components/Navigation";

function AboutUs() {
  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: "Ishwor Chalise",
      position: "Chief Executive Officer",
      image: "src/assets/me.png",
      description: "Visionary leader with 10+ years in event management",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "#"
      }
    },
    {
      id: 2,
      name: "Ishwor Chalise",
      position: "Chief Technology Officer",
     image: "src/assets/me.png",
      description: "Tech innovator driving digital transformation",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "#"
      }
    },
    {
      id: 3,
      name: "Ishwor Chalise",
      position: "Head of Operations",
      image: "src/assets/me.png",
      description: "Operations expert ensuring seamless event execution",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "#"
      }
    },
    {
      id: 4,
      name: "Ishwor Chalise",
      position: "Marketing Director",
      image: "src/assets/me.png",
      description: "Creative strategist building brand presence",
      social: {
        linkedin: "#",
        twitter: "#",
        email: "#"
      }
    }
  ];

  // Milestones
  const milestones = [
    { year: "2018", title: "Founded", description: "Started with a vision to revolutionize venue booking" },
    { year: "2019", title: "First 1000 Bookings", description: "Achieved milestone of 1000 successful bookings" },
    { year: "2020", title: "Expansion", description: "Expanded to 50+ cities across Nepal" },
    { year: "2021", title: "Award", description: "Received National Innovation Award" },
    { year: "2022", title: "Tech Platform", description: "Launched AI-powered recommendation system" },
    { year: "2023", title: "Partnerships", description: "Partnered with 500+ premium venues" },
    { year: "2024", title: "Mobile App", description: "Launched mobile app with 50k+ downloads" },
  ];

  // Values
  const values = [
    {
      icon: <FaHandshake className="w-8 h-8" />,
      title: "Trust & Reliability",
      description: "We build lasting relationships based on trust and deliver on our promises."
    },
    {
      icon: <FaHeart className="w-8 h-8" />,
      title: "Customer First",
      description: "Your satisfaction is our priority. We go above and beyond to exceed expectations."
    },
    {
      icon: <FaStar className="w-8 h-8" />,
      title: "Excellence",
      description: "We strive for excellence in every detail, from venue selection to customer service."
    },
    {
      icon: <FaUsers className="w-8 h-8" />,
      title: "Collaboration",
      description: "We work together with venues and clients to create unforgettable experiences."
    }
  ];

  // Stats
  const stats = [
    { icon: <FaUsers />, value: "50,000+", label: "Happy Customers" },
    { icon: <FaCalendarCheck />, value: "25,000+", label: "Events Hosted" },
    { icon: <FaStar />, value: "4.9/5", label: "Customer Rating" },
    { icon: <FaMapMarkerAlt />, value: "500+", label: "Premium Venues" },
    { icon: <FaAward />, value: "15+", label: "Awards Won" }
  ];

  return (
    <div className="min-h-screen bg-sand-tan">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-night-blue to-night-blue-shadow text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About <span className="text-sand-tan">SAAN</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              Redefining Event Experiences Since 2018
            </p>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Founded and led by <span className="font-bold text-sand-tan">Ishwor Chalise</span>, 
              SAAN has grown from a simple idea into Nepal's premier venue booking platform, 
              connecting thousands of customers with their perfect event spaces.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-night-blue/10 text-night-blue px-4 py-2 rounded-full font-semibold">
                <FaAward className="w-5 h-5" />
                Our Mission
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                To Make Every Event <span className="text-night-blue">Memorable</span>
              </h2>
              <p className="text-gray-600 text-lg">
                We believe every celebration deserves the perfect setting. Our mission is to simplify 
                venue discovery and booking, ensuring stress-free planning for weddings, corporate 
                events, and special occasions across Nepal.
              </p>
              <div className="pt-6 border-t border-gray-200">
                <p className="text-gray-700 font-medium">
                  <span className="text-night-blue font-bold">Ishwor Chalise</span>, Founder & CEO
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-night-blue/10 text-night-blue px-4 py-2 rounded-full font-semibold">
                <FaStar className="w-5 h-5" />
                Our Vision
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Leading <span className="text-night-blue">Digital Transformation</span> in Events
              </h2>
              <p className="text-gray-600 text-lg">
                We envision becoming South Asia's most trusted event platform, leveraging technology 
                to create seamless experiences while preserving the cultural richness of Nepalese 
                celebrations and traditions.
              </p>
              <div className="bg-sand-tan/20 p-6 rounded-2xl">
                <p className="text-gray-700 italic">
                  "Our success is measured by the smiles we help create and the memories we help preserve."
                </p>
                <p className="mt-4 font-semibold text-night-blue">
                  — Ishwor Chalise, Chief Technology Officer
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-night-blue to-night-blue-shadow text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4 text-3xl">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story Timeline */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-night-blue">Journey</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From humble beginnings to becoming Nepal's leading venue platform
            </p>
          </div>
          
          {/* Timeline */}
          <div className="relative">
            {/* Center line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200 hidden md:block"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex flex-col md:flex-row items-center ${
                    index % 2 === 0 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Content */}
                  <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-night-blue text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl">
                          {milestone.year}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                          <p className="text-gray-600">{milestone.description}</p>
                        </div>
                      </div>
                      {index === 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-gray-700">
                            Founded by <span className="font-bold text-night-blue">Ishwor Chalise</span> 
                            with a vision to transform how Nepal books venues
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Dot on timeline */}
                  <div className="hidden md:block w-8 h-8 bg-night-blue rounded-full border-4 border-sand-tan shadow-lg relative z-10 mx-4"></div>
                  
                  {/* Empty space for alternating layout */}
                  <div className="w-full md:w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our <span className="text-night-blue">Values</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide every decision we make
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              >
                <div className="text-night-blue mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leadership Team */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our <span className="text-night-blue">Leadership</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Led by visionary professionals dedicated to excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                {/* Team Member Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Team Member Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-night-blue font-semibold mb-3">{member.position}</p>
                  <p className="text-gray-600 text-sm mb-6">{member.description}</p>
                  
                  {/* Social Links */}
                  <div className="flex space-x-4">
                    <a
                      href={member.social.linkedin}
                      className="w-10 h-10 bg-sand-tan/20 text-night-blue rounded-full flex items-center justify-center hover:bg-night-blue hover:text-white transition-colors"
                      aria-label="LinkedIn"
                    >
                      <FaLinkedinIn className="w-5 h-5" />
                    </a>
                    <a
                      href={member.social.twitter}
                      className="w-10 h-10 bg-sand-tan/20 text-night-blue rounded-full flex items-center justify-center hover:bg-night-blue hover:text-white transition-colors"
                      aria-label="Twitter"
                    >
                      <FaTwitter className="w-5 h-5" />
                    </a>
                    <a
                      href={member.social.email}
                      className="w-10 h-10 bg-sand-tan/20 text-night-blue rounded-full flex items-center justify-center hover:bg-night-blue hover:text-white transition-colors"
                      aria-label="Email"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Team Note */}
          <div className="mt-16 text-center">
            <div className="bg-sand-tan/10 p-8 rounded-2xl max-w-3xl mx-auto">
              <p className="text-lg text-gray-700 mb-4">
                "Our team, led by <span className="font-bold text-night-blue">Ishwor Chalise</span> in every key position, 
                works tirelessly to ensure that every event booked through SAAN becomes a cherished memory. 
                We combine traditional hospitality values with modern technology to serve you better."
              </p>
              <p className="font-semibold text-night-blue">
                — Ishwor Chalise, Head of Operations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-24 bg-gradient-to-r from-night-blue to-night-blue-shadow text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create Unforgettable Memories?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join thousands who trust SAAN for their most important celebrations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-night-blue px-8 py-3 rounded-xl font-semibold hover:bg-sand-tan transition-all duration-300 shadow-lg">
              Browse Venues
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
              Contact Team
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-night-blue-shadow text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <img
                  src="src/assets/logo.png"
                  alt="SAN Logo"
                  className="w-12 h-12 object-contain"
                />
                <span className="text-xl font-bold">SAAN</span>
              </div>
              <p className="text-white/75 mb-6">
                Nepal's premier venue booking platform, creating unforgettable event experiences since 2018.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaFacebookF />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaInstagram />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaTwitter />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaLinkedinIn />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-white hover:text-sand-tan transition-colors">Browse Venues</a></li>
                <li><a href="#" className="text-white hover:text-sand-tan transition-colors">How It Works</a></li>
                <li><a href="#" className="text-white hover:text-sand-tan transition-colors">Success Stories</a></li>
                <li><a href="#" className="text-white hover:text-sand-tan transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-lg mb-6">Contact Us</h4>
              <ul className="space-y-3 text-white/75">
                <li>Kathmandu, Nepal</li>
                <li>contact@saan.com</li>
                <li>+977 9800000000</li>
                <li>Mon-Fri: 9AM-6PM</li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-bold text-lg mb-6">Stay Updated</h4>
              <p className="text-white/75 mb-4">
                Get tips and venue updates
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none"
                />
                <button className="bg-night-blue px-6 py-3 rounded-r-lg hover:bg-night-blue-shadow transition-colors text-white font-semibold">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/60">
            <p>&copy; {new Date().getFullYear()} SAAN Venues. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Founded and led by <span className="font-bold text-white">Ishwor Chalise</span>
            </p>
            <div className="mt-4 text-sm">
              <a href="#" className="text-white/60 hover:text-white transition-colors mx-4">Privacy Policy</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors mx-4">Terms of Service</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors mx-4">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AboutUs;