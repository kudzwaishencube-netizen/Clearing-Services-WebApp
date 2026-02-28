import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Inventory from './components/Inventory';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminInventory from './components/AdminInventory';

function MainSite() {
  return (
    <>
      <Hero />
      <Services />
      <Inventory />
      <Testimonials />
      <Contact />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white font-sans">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<MainSite />} />
            <Route path="/admin" element={<AdminInventory />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
