import React from 'react';
import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    text: "Anchor Freight made the rebate process incredibly simple for me as a returning resident. Their team handled all the paperwork efficiently.",
    author: "Sarah M.",
    role: "Returning Resident",
    color: "bg-blue-50" // Light blue from example
  },
  {
    id: 2,
    text: "Professional and reliable. We use them for all our commercial imports. The clearing times are the best we've experienced.",
    author: "James T.",
    role: "Logistics Manager",
    color: "bg-orange-50" // Light orange/beige
  },
  {
    id: 3,
    text: "I bought a truck through their inventory service. The vehicle was exactly as described, and they handled the registration perfectly.",
    author: "David K.",
    role: "Business Owner",
    color: "bg-purple-50" // Light purple from example
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-accent mb-4">What they say about us</h2>
          <p className="text-gray-600">Trusted by businesses and individuals across the region.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className={`${testimonial.color} p-8 rounded-3xl relative`}
            >
              <Quote className="w-10 h-10 text-gray-400/50 mb-4" />
              <p className="text-gray-700 font-medium mb-8 leading-relaxed">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{testimonial.author}</h4>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
