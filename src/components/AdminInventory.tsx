import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Image as ImageIcon, 
  X, 
  Car, 
  Upload, 
  AlertTriangle, 
  CheckCircle 
} from 'lucide-react';
import { inventoryService } from '../lib/inventoryService';
import { Vehicle } from '../data/defaultVehicles';

export default function AdminInventory() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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
      const data = await inventoryService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
      showToast('Could not load vehicles', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Client-side image compression that works seamlessly on device uploads
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file (JPG, PNG, WebP).'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read image file from your device.'));
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not load image preview.'));
        img.onload = () => {
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 750;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas processing not supported.'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to efficient JPEG dataURL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(dataUrl);
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const dataUrl = await compressImageFile(file);
      setNewVehicle((prev) => ({ ...prev, image: dataUrl }));
      showToast('Photo uploaded from your device successfully!');
    } catch (error: any) {
      console.error('Error processing image:', error);
      showToast(error.message || 'Failed to process image from device.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await inventoryService.addVehicle(newVehicle);
      if (res.success) {
        await fetchVehicles();
        setIsAdding(false);
        showToast('Vehicle added successfully!');
        setNewVehicle({
          make: '',
          model: '',
          year: new Date().getFullYear(),
          type: 'Sedan',
          price: 0,
          image: ''
        });
      } else {
        showToast(res.error || 'Failed to add vehicle', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error adding vehicle', 'error');
    }
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    const id = vehicleToDelete.id;
    const vehicleInfo = `${vehicleToDelete.year} ${vehicleToDelete.make} ${vehicleToDelete.model}`;
    setDeletingId(id);
    try {
      const res = await inventoryService.deleteVehicle(id);
      if (res.success) {
        // Optimistic UI update: remove from screen immediately
        setVehicles((prev) => prev.filter((v) => String(v.id) !== String(id)));
        setVehicleToDelete(null);
        showToast(`"${vehicleInfo}" removed.`);
        await fetchVehicles();
      } else {
        setVehicleToDelete(null);
        showToast(res.error || 'Failed to delete vehicle', 'error');
      }
    } catch (err: any) {
      setVehicleToDelete(null);
      showToast(err.message || 'Error deleting vehicle', 'error');
    } finally {
      setDeletingId(null);
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

  return (
    <div className="min-h-screen bg-surface pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Clean, Professional Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent">Manage Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">
              Add or remove vehicles in your inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Logout
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
                      placeholder="e.g. Hilux Revo"
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
                      onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || 0 })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (Optional)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                      value={newVehicle.price === 0 ? '' : newVehicle.price}
                      onChange={(e) => setNewVehicle({ ...newVehicle, price: parseInt(e.target.value) || 0 })}
                      placeholder="e.g. 25000"
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
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-all group"
                      >
                        {isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        )}
                        {isUploading ? 'Compressing from device...' : 'Upload from PC / Phone'}
                      </button>
                      <p className="text-[11px] text-gray-400 mt-1">Or paste a photo web URL below</p>
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
                    placeholder="https://images.unsplash.com/... or uploaded photo"
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

        {/* Vehicles Table List */}
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
                          <img 
                            src={car.image} 
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100" 
                            alt="" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800';
                            }}
                          />
                          <div>
                            <div className="font-bold text-gray-900">{car.make} {car.model}</div>
                            <div className="text-xs text-gray-400">ID: #{car.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{car.type}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-700">
                        {car.price > 0 ? `$${car.price.toLocaleString()}` : <span className="text-gray-400 font-normal italic">On Inquiry</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setVehicleToDelete(car)}
                          disabled={deletingId === car.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove vehicle"
                        >
                          {deletingId === car.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-red-500" />
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

      {/* In-App Delete Confirmation Modal */}
      <AnimatePresence>
        {vehicleToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Remove from Inventory?
                </h3>
                <p className="text-gray-500 text-sm text-center mb-6">
                  Are you sure you want to remove <span className="font-semibold text-gray-800">{vehicleToDelete.year} {vehicleToDelete.make} {vehicleToDelete.model}</span>? This will immediately remove it from both the staff dashboard and the public website.
                </p>

                <div className="bg-gray-50 rounded-xl p-3 mb-6 flex items-center gap-3 border border-gray-100">
                  <img src={vehicleToDelete.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{vehicleToDelete.make} {vehicleToDelete.model}</div>
                    <div className="text-sm font-semibold text-primary">
                      {vehicleToDelete.price > 0 ? `$${vehicleToDelete.price.toLocaleString()}` : 'Price on Inquiry'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setVehicleToDelete(null)}
                    disabled={deletingId !== null}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteVehicle}
                    disabled={deletingId !== null}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {deletingId !== null ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Yes, Remove</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating In-App Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 z-[80] px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold text-white ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-white" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
