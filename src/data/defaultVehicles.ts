export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  type: string;
  price: number;
  image: string;
}

export const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 1,
    make: 'Toyota',
    model: 'Hilux Revo',
    year: 2021,
    type: 'Truck',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 2,
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2019,
    type: 'Sedan',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 3,
    make: 'Honda',
    model: 'CR-V',
    year: 2020,
    type: 'SUV',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&q=80&w=800'
  }
];
