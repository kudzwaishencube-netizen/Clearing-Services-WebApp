import React from 'react';
import { motion } from 'motion/react';
import { Anchor, Ship, Truck, FileText, CheckCircle2 } from 'lucide-react';

const SERVICES = [
  {
    title: 'Commercial Clearing',
    description: 'Expert handling of commercial goods clearance, ensuring compliance with all customs regulations and minimizing delays.',
    icon: FileText,
  },
  {
    title: 'Import & Export',
    description: 'Comprehensive logistics solutions for both importers and exporters, managing documentation and freight movement seamlessly.',
    icon: Ship,
  },
  {
    title: 'Rebates Processes',
    description: 'Specialized assistance for Civil Servants and Returning Residents to access duty rebates and exemptions efficiently.',
    icon: CheckCircle2,
  },
  {
    title: 'Commercial Cargo',
    description: 'Reliable transportation and clearance for bulk commercial cargo, tailored to meet your business supply chain needs.',
    icon: Truck,
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block p-3 rounded-full bg-secondary mb-4"
          >
            <Anchor className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-accent mb-4"
          >
            Our Services
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto text-lg"
          >
            We provide end-to-end logistics and clearing solutions designed to move your business forward.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface p-8 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 group-hover:bg-primary transition-colors duration-300">
                <service.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
