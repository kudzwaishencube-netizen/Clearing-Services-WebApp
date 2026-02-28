import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Loader2, Image as ImageIcon, X, Car, Upload } from 'lucide-react';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  type: string;
  price: number;
  image: string;
}

export default function AdminInventory() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'Sedan',
    price: 0,
    image: ''
  });

  useEffect(() => {
    const auth = localStorage.getItem('anchor_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchVehicles();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'anchorteam13') {
      setIsAuthenticated(true);
      localStorage.setItem('anchor_auth', 'true');
      fetchVehicles();
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('anchor_auth');
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      console.log('Fetched vehicles:', data);
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.imageUrl) {
        setNewVehicle({ ...newVehicle, image: data.imageUrl });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-accent">Staff Login</h1>
            <p className="text-gray-500 text-sm">Enter password to manage inventory</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary outline-none transition-all ${
                  loginError ? 'border-red-500 ring-red-100' : 'border-gray-200'
                }`}
                placeholder="••••••••"
              />
              {loginError && (
                <p className="text-red-500 text-xs mt-2">Incorrect password. Please try again.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
            >
              Access Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle)
      });
      if (response.ok) {
        fetchVehicles();
        setIsAdding(false);
        setNewVehicle({
          make: '',
          model: '',
          year: new Date().getFullYear(),
          type: 'Sedan',
          price: 0,
          image: ''
        });
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    
    setDeletingId(id);
    try {
      // Try DELETE first
      let response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      
      // If DELETE is blocked or fails, try POST fallback
      if (!response.ok && response.status !== 404) {
        response = await fetch(`/api/vehicles/${id}/delete`, { method: 'POST' });
      }
      
      if (response.ok) {
        await fetchVehicles();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to delete vehicle'}`);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Network error. Please check your connection.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent">Manage Inventory</h1>
            <p className="text-gray-500">Add or remove vehicles from the public catalog.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-5 h-5" />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Add Modal */}
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-surface">
                <h2 className="text-xl font-bold text-accent">Add New Vehicle</h2>
                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                      placeholder="e.g. Toyota"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      placeholder="e.g. Hilux"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                      value={isNaN(newVehicle.year) ? '' : newVehicle.year}
                      onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-white"
                      value={newVehicle.type}
                      onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                    >
                      <option>Sedan</option>
                      <option>SUV</option>
                      <option>Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                      value={isNaN(newVehicle.price) ? '' : newVehicle.price}
                      onChange={(e) => setNewVehicle({ ...newVehicle, price: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Image</label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-all group"
                      >
                        {isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        )}
                        {isUploading ? 'Uploading...' : 'Upload from PC'}
                      </button>
                      <p className="text-[10px] text-gray-400 mt-1">Or paste a URL below</p>
                    </div>
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                      {newVehicle.image ? (
                        <img src={newVehicle.image} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                  </div>
                  <input
                    required
                    type="text"
                    className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={newVehicle.image}
                    onChange={(e) => setNewVehicle({ ...newVehicle, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                  >
                    Save Vehicle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-gray-500">Loading inventory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-gray-900">Vehicle</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-900">Type</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-900">Year</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-900">Price</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.map((car) => (
                    <tr key={car.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={car.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                          <div>
                            <div className="font-bold text-gray-900">{car.make} {car.model}</div>
                            <div className="text-xs text-gray-400">ID: #{car.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{car.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{car.year}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">${car.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteVehicle(car.id)}
                          disabled={deletingId === car.id}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {deletingId === car.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vehicles.length === 0 && (
                <div className="p-20 text-center text-gray-500">
                  No vehicles in inventory. Click "Add Vehicle" to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
