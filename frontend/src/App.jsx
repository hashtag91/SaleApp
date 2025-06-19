import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaShoppingCart,
  FaTrash,
  FaCheck,
  FaEdit,
  FaBox,
  FaCreditCard,
  FaSearch,
  FaChartBar
} from 'react-icons/fa';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function App() {
  const [view, setView] = useState('pos');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', buy_price: '', stock: '', image: null });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState({ name: '', price: '', buy_price: '', stock: '', sku: '', image: null });
  const [stockFilter, setStockFilter] = useState('all');

  const COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#14B8A6'];

  const loadProducts = async () => {
    const res = await axios.get('/api/products');
    setProducts(res.data);
  };

  const loadSales = async () => {
    const res = await axios.get('/api/sales');
    setSales(res.data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const t = cart.reduce((acc, p) => acc + p.price * p.qty, 0);
    setTotal(t);
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const found = prev.find(p => p.id === product.id);
      if (found) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        buy_price: product.buy_price ?? 0, // ✅ obligatoire
        qty: 1
      }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const checkout = async () => {
    if (cart.length === 0) return alert("Panier vide !");
    const sale = {
      total,
      items: JSON.stringify(cart),
      cart
    };
    await axios.post('/api/sales', sale);
    alert('Vente enregistrée');
    setCart([]);
    loadProducts();
  };

  const handleAddProduct = () => {
    setShowAddProduct(true);
  };

  const handleProductChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setNewProduct(prev => ({ ...prev, image: files[0] }));
    } else {
      setNewProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  const submitNewProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku || !newProduct.price || !newProduct.stock) {
      return alert("Remplissez tous les champs");
    }

    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('sku', newProduct.sku);
    formData.append('price', newProduct.price);
    formData.append('buy_price', newProduct.buy_price);
    formData.append('stock', newProduct.stock);
    if (newProduct.image) {
      formData.append('image', newProduct.image);
    }

    await axios.post('/api/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    alert('Produit ajouté');
    setShowAddProduct(false);
    setNewProduct({ name: '', sku: '', price: '', buy_price: '', stock: '', image: null });
    loadProducts();
  };

  const handleEditProduct = (product) => {
    setEditProduct(product.id);
    setEditedProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      buy_price: product.buy_price,
      stock: product.stock,
      sku: product.sku || '',
      image: null,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setEditedProduct((prev) => ({ ...prev, image: files[0] }));
    } else {
      setEditedProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  async function submitEditProduct(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', editedProduct.name);
    formData.append('sku', editedProduct.sku);
    formData.append('price', editedProduct.price);
    formData.append('buy_price', editedProduct.buy_price)
    formData.append('stock', editedProduct.stock);
    
    if (editedProduct.image instanceof File) {
      formData.append('image', editedProduct.image);
    }

    try {
      const response = await fetch(`/api/products/${editedProduct.id}`, {
        method: 'PUT',
        body: formData, // important : on envoie FormData, pas JSON
        // Pas besoin de Content-Type, fetch la gère automatiquement
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification du produit');
      }

      const updatedProduct = await response.json();
      // Mettre à jour l'état local ici
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setEditProduct(null);
    } catch (error) {
      alert(error.message);
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    await axios.delete(`/api/products/${id}`);
    loadProducts();
  };

  const downloadCSV = async () => {
    const res = await axios.get(`/api/sales/export?start=${startDate}&end=${endDate}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sales.csv');
    document.body.appendChild(link);
    link.click();
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStock =
      stockFilter === 'all' ? true :
      stockFilter === 'rupture' ? p.stock === 0 :
      stockFilter === 'low' ? p.stock > 0 && p.stock <= 2 :
      stockFilter === 'ok' ? p.stock > 2 : true;

    return matchSearch && matchStock;
  });

  // Group sales data by date
  const dailySales = sales.reduce((acc, s) => {
    const date = new Date(s.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + s.total;
    return acc;
  }, {});

  const dailyData = Object.entries(dailySales).map(([date, total]) => ({ name: date, total }));

  // Group items sold by SKU
  const productCount = {};
  sales.forEach(s => {
    const items = JSON.parse(s.items);
    items.forEach(i => {
      const label = i.sku ? `${i.sku} - ${i.name}` : i.name;
      productCount[label] = (productCount[label] || 0) + i.qty;
    });
  });

  const productChartData = Object.entries(productCount).map(([name, value]) => ({ name, value }));

  const increaseQty = (id) => {
    setCart(prev => prev.map(p => p.id === id ? {...p, qty: p.qty +1 } : p))
  };

  const decreaseQty = (id) => {
    setCart(prev => {
      return prev.flatMap(p => {
        if (p.id === id) {
          if (p.qty > 1) {
            return { ...p, qty: p.qty - 1 };
          } else {
            return []; // Si quantité = 1 et on décrémente → supprimer
          }
        }
        return p;
      });
    });
  };

  // Calcul des données des prix d'achat cumulé

  const dailyTotals = {}; // { "date": { vente: X, achat: Y } }
  sales.forEach((s) => {
    const date = new Date(s.date).toLocaleDateString();
    const items = typeof s.items === 'string' ? JSON.parse(s.items) : s.items;

    if (!dailyTotals[date]) {
      dailyTotals[date] = { vente: 0, achat: 0 };
    }

    items.forEach(item => {
      dailyTotals[date].vente += item.price * item.qty;
      dailyTotals[date].achat += (item.buy_price || 0) * item.qty; // buy_price doit être inclus dans l'objet cart
    });
  });

  const comparisonData = Object.entries(dailyTotals).map(([date, val]) => ({ date, ...val }));

  const ruptureStock = products.filter(p => p.stock === 0).length;
  const stockFaible = products.filter(p => p.stock > 0 && p.stock <= 2).length;
  const stockOk = products.filter(p => p.stock > 2).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl md:text-4xl font-bold text-gray-900">CAM'S FASHION</h2>
      <div className="mb-6 flex gap-3 justify-center">
        <button onClick={() => setView('pos')} className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'pos' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}>
          <FaShoppingCart /> Caisse
        </button>
        <button onClick={() => { setView('admin'); loadProducts(); }} className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'admin' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}>
          <FaBox /> Produits
        </button>
        <button onClick={() => { setView('sales'); loadSales(); }} className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'sales' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}>
          <FaCreditCard /> Ventes
        </button>
        <button
          onClick={() => {
            setView('charts');
            loadSales();
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'charts' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}
        >
          <FaChartBar /> Graphiques
        </button>
      </div>

      {['pos', 'admin'].includes(view) && (
        <div className="mb-6 max-w-md mx-auto flex items-center gap-3 border border-gray-300 rounded px-3 py-2 bg-white">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom ou SKU"
            className='flex-1 focus:outline-none'
          />
        </div>
      )}

      {view === 'pos' && (
        <div className="flex gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Produits</h2>
            <div className="grid grid-cols-2 gap-6 max-h-[650px] overflow-auto p-2">
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} className="bg-blue-600 text-white rounded-xl shadow flex" style={{ minHeight: '120px' }}>
                  {p.imageUrl && (
                    <div className="w-1/2 p-2 flex items-center justify-center bg-white rounded-l-xl">
                      <img src={p.imageUrl} alt={p.name} className="max-w-full max-h-full object-contain rounded" />
                    </div>
                  )}
                  <div className="w-1/2 p-3 flex flex-col justify-center space-y-1 text-left">
                    <span className="font-semibold text-lg truncate">{p.name}</span>
                    <span className="text-sm text-gray-100">SKU: {p.sku}</span>
                    <span>FCFA{p.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-200">Stock: {p.stock}</span>
                    <div className="mt-auto text-right">
                      <FaShoppingCart className="inline-block text-white" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '30vw', minWidth: '280px' }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaShoppingCart /> Panier
            </h2>
            <ul>
              {cart.map((p) => (
                <li key={p.id} className="mb-3 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-gray-600">
                      <button onClick={() => decreaseQty(p.id)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">−</button>
                      <span className="mx-2">{p.qty}</span>
                      <button onClick={() => increaseQty(p.id)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">+</button>
                      <span className="ml-4">= FCFA {(p.qty * p.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(p.id)} className="text-red-600 hover:text-red-800 ml-2" title="Supprimer du panier">
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
            <hr className="my-3" />
            <div className="text-lg font-bold">Total : FCFA{total.toFixed(2)}</div>
            <button onClick={checkout} className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2">
              <FaCheck /> Valider la vente
            </button>
          </div>
        </div>
      )}

      {view === 'admin' && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Produits</h2>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <button onClick={() => setShowAddProduct(true)} className="mb-6 px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
              Ajouter un produit
            </button>

            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded text-sm"
            >
              <option value="all">📦 Tous les produits</option>
              <option value="rupture">🔴 Rupture de stock</option>
              <option value="low">🟡 Stock faible (1–2)</option>
              <option value="ok">⚪ Stock suffisant</option>
            </select>

            <div className="flex gap-3 text-sm font-medium">
              <span className="flex items-center gap-1 text-red-700">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                Rupture ({ruptureStock})
              </span>
              <span className="flex items-center gap-1 text-yellow-700">
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                Faible ({stockFaible})
              </span>
              <span className="flex items-center gap-1 text-gray-700">
                <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
                OK ({stockOk})
              </span>
            </div>
          </div>

          {showAddProduct && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                  ✕
                </button>

                <h3 className="text-xl font-semibold mb-4">Ajouter un produit</h3>

                <form onSubmit={submitNewProduct} className="mb-6 border p-6 rounded-xl max-w-md bg-white shadow">
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-gray-700">Nom</label>
                    <input type="text" name="name" value={newProduct.name} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-gray-700">SKU</label>
                    <input type="text" name="sku" value={newProduct.sku} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-gray-700">Prix (FCFA)</label>
                    <input type="number" name="price" step="0.01" value={newProduct.price} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="" className="bloc mb-1 font-medium text-gray-700">Prix d'achat (FCFA)</label>
                    <input type="number" name="buy_price" value={newProduct.buy_price} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2" required/>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-gray-700">Stock</label>
                    <input type="number" name="stock" value={newProduct.stock} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-1 font-medium text-gray-700">Image</label>
                    <input type="file" name="image" accept="image/*" onChange={handleProductChange} className="w-full" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                      Ajouter le produit
                    </button>
                    <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition">
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {editProduct && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative">
                <button
                  onClick={() => setEditProduct(null)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                  ✕
                </button>

                <h3 className="text-xl font-semibold mb-3">Modifier le produit</h3>
                <form onSubmit={submitEditProduct} className="mb-4 border p-6 rounded-xl max-w-md bg-white shadow">
                  <div className="mb-2">
                    <label className="block mb-1 font-medium text-gray-700">Nom</label>
                    <input type="text" name="name" value={editedProduct.name} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 font-medium text-gray-700">SKU</label>
                    <input type="text" name="sku" value={editedProduct.sku} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 font-medium text-gray-700">Prix (FCFA)</label>
                    <input type="number" name="price" step="0.01" value={editedProduct.price} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 font-medium text-gray-700">Prix d'achat (FCFA)</label>
                    <input type="number" name="buy_price" step="0.01" value={editedProduct.buy_price} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 font-medium text-gray-700">Stock</label>
                    <input type="number" name="stock" value={editedProduct.stock} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-gray-700">Image (optionnelle)</label>
                    <input type="file" name="image" accept="image/*" onChange={handleEditChange} className="w-full" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition">
                      Enregistrer les modifications
                    </button>
                    <button type="button" onClick={() => setEditProduct(null)} className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition">
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
          )}
          <ul>
            {filteredProducts.map((p) => (
              <li key={p.id} className={`mb-4 border rounded-xl p-4 flex items-center gap-6 shadow ${
                p.stock === 0
                ? 'bg-red-100 border-red-500'
                : p.stock <= 2
                ? 'bg-yellow-100 border-yellow-400'
                : 'bg-white border-gray-300'
              }`}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-20 h-20 object-contain rounded-lg" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    Pas d’image
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {p.sku}</p>
                  <p className="text-indigo-600 font-bold">FCFA{p.price}</p>
                  <p className="text-gray-600">Stock: {p.stock}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleEditProduct(p)} className="text-yellow-600 hover:text-yellow-800 font-semibold">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:text-red-800 font-semibold">
                    <FaTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === 'sales' && (
        <div className="p-4">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">🧾 Historique des ventes</h2>

          {/* Filtres et export */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={downloadCSV}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              📥 Exporter CSV
            </button>
          </div>

          {/* Liste des ventes */}
          <div className="max-h-[600px] overflow-auto space-y-6">
            {sales.map((s) => {
              // Si s.items est un JSON stringifié
              let items = [];
              try {
                items = typeof s.items === 'string' ? JSON.parse(s.items) : s.items;
              } catch (e) {
                console.error('Erreur parsing items:', e);
              }

              return (
                <div key={s.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">🧾 Vente #{s.id}</h3>
                      <p className="text-sm text-gray-500">{new Date(s.date).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Total</span>
                      <div className="text-xl font-bold text-green-600">FCFA {s.total.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Tableau des articles */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-300 rounded-lg">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="px-4 py-2 border">Produit</th>
                          <th className="px-4 py-2 border">Sku</th>
                          <th className="px-4 py-2 border">Quantité</th>
                          <th className="px-4 py-2 border">Prix unitaire</th>
                          <th className="px-4 py-2 border">Sous-total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} className="text-gray-800">
                            <td className="px-4 py-2 border">{item.name}</td>
                            <td className="px-4 py-2 border">{item.sku}</td>
                            <td className="px-4 py-2 border text-center">{item.qty}</td>
                            <td className="px-4 py-2 border text-right">FCFA {Number(item.price).toFixed(2)}</td>
                            <td className="px-4 py-2 border text-right">FCFA {(item.price * item.qty).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {view === 'charts' && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Statistiques des Ventes</h2>
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6 mb-2">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `FCFA ${v}`} />
                <Tooltip formatter={(v) => `FCFA ${v}`} />
                <Legend />
                <Bar dataKey="vente" fill="#4F46E5" name="Vente" />
                <Bar dataKey="achat" fill="#F97316" name="Achat" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Produits les plus vendus</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {productChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}