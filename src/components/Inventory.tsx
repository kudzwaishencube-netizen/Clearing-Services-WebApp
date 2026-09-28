import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Filter, MessageCircle, Loader2 } from 'lucide-react';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  type: string;
  price: number;
  image: string;
}

const VEHICLE_TYPES = ['All', 'Sedan', 'SUV', 'Truck'];
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under $20k', min: 0, max: 20000 },
  { label: '$20k - $35k', min: 20000, max: 35000 },
  { label: 'Over $35k', min: 35000, max: Infinity },
];

export default function Inventory() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = vehicles.filter((car) => {
    const matchesType = selectedType === 'All' || car.type === selectedType;
    const matchesPrice = car.price >= selectedPriceRange.min && car.price <= selectedPriceRange.max;
    return matchesType && matchesPrice;
  });

  const generateWhatsAppLink = (carName: string) => {
    const text = `I am interested in the ${carName} listed on your website.`;
    return `https://wa.me/263712510721?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="inventory" className="py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-accent mb-4"
          >
            Vehicle Inventory
          </motion.h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
            Browse our selection of quality imported vehicles. Filter by type or price to find your perfect match.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 justify-center items-center">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-xs border border-gray-100">
            <Filter className="w-5 h-5 text-primary ml-2" />
            <div className="flex gap-1 flex-wrap">
              {VEHICLE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPriceRange.label}
              onChange={(e) => {
                const range = PRICE_RANGES.find((r) => r.label === e.target.value);
                if (range) setSelectedPriceRange(range);
              }}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 shadow-xs"
            >
              {PRICE_RANGES.map((range) => (
                <option key={range.label} value={range.label}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-500">Loading catalog...</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence>
              {filteredCars.map((car) => (
                <motion.div
                  layout
                  key={car.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 group flex flex-col justify-between"
                >
                  <div>
                    {/* Vehicle Image with Type Badge */}
                    <div className="relative h-52 overflow-hidden bg-gray-100">
                      <img
                        src={car.image}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback placeholder image if URL fails
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        {car.type}
                      </div>
                    </div>

                    {/* Vehicle Specs */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {car.make} {car.model}
                          </h3>
                          <p className="text-gray-500 text-sm font-medium">{car.year}</p>
                        </div>
                        <p className="text-xl font-bold text-primary">${car.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Public Inquiry Button */}
                  <div className="p-6 pt-0">
                    <a
                      href={generateWhatsAppLink(`${car.year} ${car.make} ${car.model}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-300 shadow-sm"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Inquire on WhatsApp
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filteredCars.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-lg font-medium">No vehicles found matching your criteria.</p>
            <p className="text-gray-400 text-sm mt-1">Try selecting a different filter or check back soon.</p>
            <button 
              onClick={() => { setSelectedType('All'); setSelectedPriceRange(PRICE_RANGES[0]); }}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-50 text-primary font-bold text-sm hover:bg-orange-100 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
