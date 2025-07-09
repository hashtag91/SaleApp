import React, { useState, useEffect } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true; // 🔐 envoie cookies sessions automatiquement
import {
  FaShoppingCart,
  FaTrash,
  FaCheck,
  FaEdit,
  FaBox,
  FaCreditCard,
  FaSearch,
  FaChartBar,
  FaBars,
  FaSignOutAlt,
  FaUserCircle,
  FaCog,
  FaUser,
  FaUsers,
  FaInfo,
  FaUserPlus,
  FaWindowClose
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
import soundFile from './assets/add.mp3'; // chemin relatif vers le fichier audio
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [adress, setAdress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState(null);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^[0-9]{8,15}$/.test(phone);
  const isValidUsername = (username) => /^[a-zA-Z0-9_]{4,}$/.test(username);
  const isValidPassword = (password) => password.length >= 6;

  const [employeesFormData, setEmployeesFormData] = useState({name: "", surname: "", username: "", password:"", phone: "", email: "", adresse: "", role:'autres'})

  const [view, setView] = useState('pos');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [sales, setSales] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(false)
  const [settingsMe, setSettingsMe] = useState({name: "", surname: "", username: "", phone: "", email: "", entreprise: "", adresse: "", logo: null, role:''})
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', buy_price: '', stock: '', image: null });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState({ name: '', price: '', buy_price: '', stock: '', sku: '', image: null });
  const [stockFilter, setStockFilter] = useState('all');
  const [aiResult, setAiResult] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // drawer panier mobile
  const [generateInvoice, setGenerateInvoice] = useState(false);
  const [isLoadingFacture, setIsLoadingFacture] = useState(false);
  const [clientName, setClientName] = useState('');
  const [settingsSelectedMenu, setSettingsSelectedMenu] = useState('informations');
  const [subUsers, setSubUsers] = useState([]);
  const [subUsersFiltered, setSubUsersFiltered] = useState(subUsers);

  const COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#14B8A6'];

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { username, password });
      const me = await axios.get('/api/me');
      setUser(me.data.user);
      toast.success("Connexion réussie !");
      loadProducts();
    } catch (error) {
      // On récupère le message d'erreur envoyé par Flask si dispo
      console.error(error);
      const message = error.response?.data?.error || "Échec de la connexion";
      toast.error(message);
    }
  };

  // Fonction pour la création de compte
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isValidUsername(username)) return toast.error("Nom d'utilisateur invalide (min 4 caractères).");
    if (!isValidPassword(password)) return toast.error("Mot de passe trop court (min 6).");
    if (!isValidEmail(email)) return toast.error("Email invalide.");
    if (!isValidPhone(phone)) return toast.error("Numéro invalide.");

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('name', name);
    formData.append('surname', surname);
    formData.append('entreprise',entreprise);
    formData.append('adress', adress);
    formData.append('phone', phone);
    formData.append('email', email);
    if (logo) {
      formData.append('logo', logo);
    }
    try {
      await axios.post('/api/register', formData);
      toast.success("Inscription réussie. Connectez-vous.");
      setShowRegister(false);
    }catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'inscription");
    }
  };

  const employeesFormSubmit = async (e) => {
    e.preventDefault();
    const { name, surname, username, password, phone, email } = employeesFormData;
    if (!isValidUsername(username)) return toast.error("Nom utilisateur invalide.");
    if (!isValidPassword(password)) return toast.error("Mot de passe trop court.");
    if (!isValidEmail(email)) return toast.error("Email invalide.");
    if (!isValidPhone(phone)) return toast.error("Téléphone invalide.");

    const formData = new FormData();
    Object.entries(employeesFormData).forEach(([key, val]) => formData.append(key, val));

    try {
      await axios.post('/api/employees', formData);
      toast.success("Utilisateur ajouté !");
      setEmployeeForm(false);
      loadSubUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'ajout");
    }
  }

  const handleLogout = async () => {
    await axios.post('/api/logout');
    setUser(null);
    setView('pos');  // ou une autre vue par défaut
    toast.error("Déconnecté avec succès !");
  };

  const loadProducts = async () => {
    const res = await axios.get('/api/products');
    setProducts(res.data);
  };

  const loadSales = async () => {
    const res = await axios.get('/api/sales');
    setSales(res.data);
  };

  // Vérification automatique de session au démarrage
  useEffect(() => {
    axios.get('/api/me')
      .then(res => {
        if (res.data.user) {
          setUser(res.data.user);
          loadProducts();
          loadSubUsers();
        } else {
          handleLogout();
        }
      })
      .catch((err) => {
        toast.error("Erreur session expirée", err);
        handleLogout();
      });
  }, []);

  const settingsRetrieve = () => {
    axios.get('/api/settings').then(res => {
      setSettingsMe(prev => ({
        ...prev,
        'name':res.data.name,
        'surname':res.data.surname,
        'username':res.data.username,
        'phone':res.data.phone,
        'email':res.data.email,
        'entreprise':res.data.entreprise,
        'adresse':res.data.adresse,
        'logo':''
      }));
    }, ).catch((err) => toast.error(err.response?.data?.error || "Erreur lors du chargement des informations"));
  }

  const handleSettingsFieldChange = (e) => {
    setSettingsMe({...settingsMe, [e.target.name]: e.target.value});
  }

  const handleSettingsLogoChange = (e) => {
    setSettingsMe({...settingsMe, logo:e.target.files[0]});
  }

  const settingsSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();

    data.append("name", settingsMe.name);
    data.append("surname", settingsMe.surname);
    data.append("username", settingsMe.username);
    data.append("phone", settingsMe.phone);
    data.append("email", settingsMe.email);
    data.append("entreprise", settingsMe.entreprise);
    data.append("adresse", settingsMe.adresse);
    if(settingsMe.logo) data.append("logo", settingsMe.logo);

    axios.post('/api/settings', data)
    .then((res) => {
      toast.success(res.data.message);
    })
    .catch ((err) => {
      toast.error(err.data.error);
    })
  }

  const loadSubUsers = async () => {
    const res = await axios.get('/api/employees');
    setSubUsers(res.data)
  }

  useEffect(() => {
    if (user){
      loadProducts();
      loadSubUsers();
    };
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
      // joue le son
      const audio = new Audio(soundFile);
      audio.play();
      return [...prev, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        buy_price: product.buy_price ?? 0, // ✅ obligatoire
        qty: 1,
      }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const genererFacture = async () => {
    setIsLoadingFacture(true);
    try {
      const facture = {
        'client': clientName,
        'items': JSON.stringify(cart),
        'total': total,
      };
      const res = await axios.post('/api/facture', facture, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${new Date().toISOString()}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      toast.error("Erreur génération facture");
      console.error(err);
    } finally {
      setIsLoadingFacture(false);
    }
  };

  const checkout = async () => {
    if (cart.length === 0) return toast.info("Panier vide !");
    const sale = {
      total,
      items: JSON.stringify(cart),
      cart,
      generate_invoice: generateInvoice,
      client: clientName
    };
    try {
      await axios.post('/api/sales', sale);
      if (generateInvoice) await genererFacture();
      toast.success('Vente enregistrée');
      setCart([]);
      setGenerateInvoice(false);
      loadProducts();
    } catch (err) {
      console.error("Erreur checkout:", err);
      toast.error("Erreur pendant la vente");
    } finally {
      setIsLoadingCheckout(false);
    }
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
    const { name, sku, price, stock } = newProduct;
    if (!name || !sku || !price || !stock) return toast.warning("Tous les champs sont requis.");
    if (isNaN(price) || price <= 0) return toast.warning("Prix invalide");
    if (isNaN(stock) || stock < 0) return toast.warning("Stock invalide");

    const formData = new FormData();
    Object.entries(newProduct).forEach(([key, val]) => {
      if (val) formData.append(key, val);
    });

    await axios.post('/api/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    toast.success('Produit ajouté');
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

    const { name, sku, price, stock, buy_price } = editedProduct;
    if (!name || !sku || !price || !stock) return toast.warning("Champs manquants.");
    if (isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) return toast.warning("Prix ou stock invalide");

    const formData = new FormData();
    Object.entries(editedProduct).forEach(([key, val]) => {
      if (key === 'image' && val instanceof File) formData.append(key, val);
      else if (key !== 'id') formData.append(key, val);
    });

    try {
      const response = await fetch(`/api/products/${editedProduct.id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) throw new Error('Erreur lors de la modification');

      const updatedProduct = await response.json();
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setEditProduct(null);
      loadProducts();
    } catch (error) {
      toast.error(error.message);
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

  const [loadingAI, setLoadingAI] = useState(false);

  const analyserAvecIA = async () => {
    setLoadingAI(true);
    try {
      const resSales = await axios.get("/api/sales");
      const ventes = resSales.data;

      if (!ventes || ventes.length === 0) {
        toast.default("Aucune vente à analyser.");
        setLoadingAI(false);
        return;
      }

      const res = await axios.post('/api/ai/conseil', ventes);
      setAiResult("🔮 IA :\n" + res.data.response);
    } catch (e) {
      console.error("Erreur IA :", e);
      setAiResult("Erreur IA lors de l’analyse.");
    }
    setLoadingAI(false);
  };

  {/*A changer et aussi le setSubUsers dans useEffect*/}
  const filteredSubUsers = (e) => {
    const query = e.target.value.trim().toLowerCase();
      setSubUsersFiltered(
        query === ''
        ? subUsers
        : subUsers.filter(u =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        )
      )
  } 

  useEffect(() => {
    setSubUsersFiltered(subUsers);
  }, [subUsers]);


  if (!user){
    return(
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form
          onSubmit={showRegister ? handleRegister : handleLogin}
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4"
        >
          <h2 className="text-2xl font-bold text-center text-gray-800">
            {showRegister ? "Inscription" : "Connexion"}
          </h2>

          {showRegister && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Prénom</label>
                <input 
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Nom"
                  required
                  onChange={(e) => setName(e.target.value)} 
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                />
              </div>
              <div>
                <label htmlFor="surname" className="block text-sm font-medium text-gray-700">Nom</label>
                <input 
                  type="text"
                  name="surname"
                  id="surname"
                  placeholder="Prénom" 
                  required 
                  onChange={(e) => setSurname(e.target.value)} 
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="entreprise" className="block text-sm font-medium text-gray-700">Entreprise</label>
                <input 
                  type="text"
                  name="entreprise"
                  id="entreprise"
                  placeholder="Nom de l'entreprise" 
                  onChange={(e) => setEntreprise(e.target.value)} 
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">Adresse</label>
                <input 
                  type="text"
                  name="adresse"
                  id="adresse"
                  placeholder="Adresse de l'entreprise" 
                  onChange={(e) => setAdress(e.target.value)} 
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input 
                  type="text"
                  name="phone"
                  id="phone"
                  placeholder="Téléphone" 
                  required 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email" 
                  required 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="mb-6">
                <label className="block mb-1 font-medium text-gray-700">Logo</label>
                <input type="file" name="logo" id='logo' accept="image/*" onChange={(e) => setLogo(e.target.files[0])} className="w-full" />
              </div>
            </>
          )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
            <input
              type="text"
              name="username"
              id="username"
              required
              onChange={e => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              name="password"
              id="password"
              required
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            Valider
          </button>
          <button
            type="button"
            onClick={() => setShowRegister(!showRegister)}
            className="w-full mt-2 text-indigo-600 hover:underline"
          >
            {showRegister ? "J'ai déjà un compte" : "Créer un compte"}
          </button>
        </form>
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-4 bg-gray-50 min-h-screen mx-auto">
      <div className="sticky top-0 p-4 bg-gray-50 w-100 mb-3 flex justify-between items-center z-100">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900">{user?.entreprise}</h2>
        <div className="flex items-center space-x-3">
          <FaUserCircle className="hidden sm:inline-flex text-2xl text-gray-700" />
          <span className="font-medium hidden sm:inline-flex">{user?.name} {user?.surname}</span>
          <button
            onClick={() => {setView('settings'); setShowSettings(true); settingsRetrieve();}}
            className='hidden sm:inline-flex'
            type='button'>
            <FaCog className="text-2xl text-gray-700"/>
          </button>
          <button onClick={() => setMobileDrawerOpen(true)}className="sm:hidden flex items-center text-gray-700">
            <FaBars />
          </button>
          <button onClick={handleLogout}
            className="hidden sm:inline-flex bg-red-600 text-white px-4 py-2 rounded ml-4">
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      {/* Le menu sur mobile */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={() => setMobileDrawerOpen(false)}
          ></div>

          {/* Drawer */}
          <div className="relative z-50 w-64 max-w-full bg-white shadow-lg h-full transform transition-transform duration-300 ease-in-out translate-x-0">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Menu</h3>
              <button onClick={() => setMobileDrawerOpen(false)} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>
            <div className="flex flex-col p-4 gap-3">
              <button onClick={() => { setView('pos'); setMobileDrawerOpen(false); }} className="bg-indigo-600 text-white px-4 py-2 rounded">
                <FaShoppingCart className="inline-block mr-1" /> Caisse
              </button>
              <button onClick={() => { setView('admin'); loadProducts(); setMobileDrawerOpen(false); }} className="bg-indigo-600 text-white px-4 py-2 rounded">
                <FaBox className="inline-block mr-1" /> Produits
              </button>
              <button onClick={() => { setView('sales'); loadSales(); setMobileDrawerOpen(false); }} className="bg-indigo-600 text-white px-4 py-2 rounded">
                <FaCreditCard className="inline-block mr-1" /> Ventes
              </button>
              {user.role === 'admin' && 
                <button onClick={() => { setView('charts'); loadSales(); setMobileDrawerOpen(false); }} className="bg-indigo-600 text-white px-4 py-2 rounded">
                  <FaChartBar className="inline-block mr-1" /> Graphiques
                </button>
              }
              {user.role === 'admin' &&
                <button onClick={() => { 
                  analyserAvecIA; setMobileDrawerOpen(false); }}
                  disabled={loadingAI}
                  className="bg-purple-600 text-white px-4 py-2 rounded">
                  {loadingAI ? "Analyse en cours..." : "🔮 Analyse IA"}
                </button>
              }
              <button
                onClick={() => {setView('settings'); setMobileDrawerOpen(false); setShowSettings(true); settingsRetrieve();}}
                className='bg-gray-600 text-white px-4 py-2 rounded'>
                <FaCog className='inline-block mr-1'/>Parametres
              </button>
              <button onClick={handleLogout}
                className='bg-red-600 text-white px-4 py-2 rounded'>
                Deconnecter
              </button>
            </div>
            <div className='flex'>
              <FaUserCircle className="hidden sm:inline-flex text-2xl text-gray-700" />
              <span className="font-medium hidden sm:inline-flex">{user?.name} {user?.surname}</span>
            </div>
          </div>
        </div>
      )}
      <div className="hidden sm:flex flex-wrap flex-row gap-3 justify-center mb-6">
        <button onClick={() => setView('pos')} className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'pos' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}>
          <FaShoppingCart /> Caisse
        </button>
        <button onClick={() => { setView('admin'); loadProducts(); }} className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'admin' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}>
          <FaBox /> Produits
        </button>
        <button onClick={() => { setView('sales'); loadSales(); }} className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'sales' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}>
          <FaCreditCard /> Ventes
        </button>
        {user.role === 'admin' && 
          <button
            onClick={() => {
              setView('charts');
              loadSales();
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'charts' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}
          >
            <FaChartBar /> Graphiques
          </button>
        }
        {user.role === 'admin' && 
          <button 
            onClick={analyserAvecIA} 
            disabled={loadingAI}
            className="bg-purple-600 text-white px-4 py-2 rounded">
            {loadingAI ? "Analyse en cours..." : "🔮 Analyse IA"}
          </button>
        }
      </div>

      {['pos', 'admin'].includes(view) && (
        <div className="sticky mb-6 max-w-md mx-auto flex items-center gap-3 border border-gray-300 rounded px-3 py-2 bg-white">
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
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Produits</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} className="bg-blue-600 text-white rounded-xl shadow flex" style={{ minHeight: '120px' }}>
                  {p.imageUrl && (
                    <div className="w-1/2 p-1 flex items-center justify-center bg-white rounded-l-xl">
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

          <div className="hidden sm:block" style={{ width: '30vw', minWidth: '280px' }}>
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
            <div className="flex items-center gap-2 mt-4 flex-1">
              <input
                type="checkbox"
                id="generateInvoice"
                checked={generateInvoice}
                onChange={(e) => setGenerateInvoice(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="generateInvoice" className="text-sm text-gray-700">
                Générer une facture PDF
              </label>
              {generateInvoice && (
                <input
                  type="text"
                  placeholder="Nom du client"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              )}
            </div>

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
            {user.role === 'admin' &&
              <button onClick={() => setShowAddProduct(true)} className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                Ajouter un produit
              </button>
            }
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

                <form onSubmit={submitNewProduct} className="w-full border p-4 sm:p-6 rounded-xl bg-white shadow">
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
                {user.role === 'admin' && 
                  <div className="flex gap-4">
                    <button onClick={() => handleEditProduct(p)} className="text-yellow-600 hover:text-yellow-800 font-semibold">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:text-red-800 font-semibold">
                      <FaTrash />
                    </button>
                  </div>
                }
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
                items = [];
              }

              return (
                <div key={s.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">🧾 Vente #{s.id}</h3>
                      <p className="text-sm text-gray-500">{new Date(s.date).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Vendeur: <strong>{s.seller}</strong></p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Total</span>
                      <div className="text-xl font-bold text-green-600">FCFA {s.total.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Tableau des articles */}
                  <div className="overflow-x-auto w-full">
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
          <div className="mx-auto bg-white rounded-xl shadow p-6 mb-2">
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
                  {productChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {view === 'settings' && (
        <div className="flex-grow relative">
          <h2 className="text-center font-2xl font-bold mb-2">Paramètres</h2>
          <div className="flex-grow flex pb-20">
            <div className="flex-grow flex justify-center items-center">
              {settingsSelectedMenu === 'informations' && (
                <form 
                  onSubmit={settingsSubmit}
                  className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4 mt-1 mb-1"
                >
                  <h2 className="text-center text-1xl font-bold">
                    Mes informations
                  </h2>
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nom
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      placeholder="Nom"
                      required
                      onChange={(e) => {handleSettingsFieldChange(e)}}
                      value={settingsMe.name}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="surname"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="surname"
                      id="surname"
                      placeholder="Prénom"
                      required
                      onChange={(e) => {handleSettingsFieldChange(e)}}
                      value={settingsMe.surname}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="entreprise"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Entreprise
                    </label>
                    <input
                      type="text"
                      name="entreprise"
                      id="entreprise"
                      placeholder="Nom de l'entreprise"
                      disabled={user.role !== 'admin'}
                      onChange={(e) => {handleSettingsFieldChange(e)}}
                      value={settingsMe.entreprise}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="adresse"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Adresse
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      id="adresse"
                      placeholder="Adresse de l'entreprise"
                      onChange={(e) => {handleSettingsFieldChange(e)}}
                      value={settingsMe.adresse}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Téléphone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      placeholder="Téléphone"
                      required
                      onChange={(e) => {handleSettingsFieldChange(e)}}
                      value={settingsMe.phone}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Email"
                      required
                      onChange={(e) => {handleSettingsFieldChange(e)}}
                      value={settingsMe.email}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  {user.role === 'admin' &&
                    <div className="mb-6">
                      <label className="block mb-1 font-medium text-gray-700">
                        Logo
                      </label>
                      <input
                        type="file"
                        name="logo"
                        id="logo"
                        accept="image/*"
                        className="w-full"
                        onChange={(e) => {handleSettingsLogoChange(e)}}
                      />
                    </div>
                  }
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      required
                      onChange={(e) => {handleSettingsFieldChange(e)}}
                      value={settingsMe.username}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
                  >
                    Enregistrer
                  </button>
                  <button 
                    type="button"
                    className="w-full text-blue-700"
                  >
                    Changer mon mot de passe
                  </button>
                </form>
              )}
              {settingsSelectedMenu === 'utilisateurs' && (
                <>
                  <div className='flex flex-col'>
                    <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Gestion des utilisateurs</h1>

                    <div className="flex justify-end gap-4 mb-6">
                      <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher par nom ou email"
                          onChange={(e) => filteredSubUsers(e)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>

                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        onClick={() => setEmployeeForm(true)}
                      >
                        <FaUserPlus /> Ajouter
                      </button>
                    </div>

                    <div className='flex justify-center items-center mb-2'>
                      {employeeForm && 
                        <form 
                          className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4 mt-1 mb-1"
                          onSubmit={employeesFormSubmit}
                        >
                          <div className='flex justify-end items-center'>
                            <button 
                              type="button"
                              onClick={() => setEmployeeForm(false)}
                            >
                              <FaWindowClose className='text-red-500'/>
                            </button>
                          </div>
                          <h2 className="text-center text-1xl font-bold">
                            Ajout un employé
                          </h2>
                          <div>
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Nom
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              placeholder="Nom"
                              required
                              onChange={(e) => setEmployeesFormData({...employeesFormData, name: e.target.value})}
                              value={employeesFormData.name}
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="surname"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Prénom
                            </label>
                            <input
                              type="text"
                              name="surname"
                              id="surname"
                              placeholder="Prénom"
                              required
                              onChange={(e) => setEmployeesFormData({...employeesFormData, surname: e.target.value})}
                              value={employeesFormData.surname}
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="adresse"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Adresse
                            </label>
                            <input
                              type="text"
                              name="adresse"
                              id="adresse"
                              placeholder="Adresse de l'entreprise"
                              onChange={(e) => setEmployeesFormData({...employeesFormData, adresse: e.target.value})}
                              value={employeesFormData.adresse}
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Téléphone
                            </label>
                            <input
                              type="text"
                              name="phone"
                              id="phone"
                              placeholder="Téléphone"
                              required
                              onChange={(e) => setEmployeesFormData({...employeesFormData, phone: e.target.value})}
                              value={employeesFormData.phone}
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              placeholder="Email"
                              required
                              onChange={(e) => setEmployeesFormData({...employeesFormData, email: e.target.value})}
                              value={employeesFormData.email}
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="username"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Nom d'utilisateur
                            </label>
                            <input
                              type="text"
                              name="username"
                              id="username"
                              required
                              onChange={(e) => setEmployeesFormData({...employeesFormData, username: e.target.value})}
                              value={employeesFormData.username}
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label htmlFor='role' className="block text-sm font-medium text-gray-700">Role</label>
                            <select 
                              name="role" 
                              id="role" 
                              className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                              onChange={(e) => setEmployeesFormData({...employeesFormData, role: e.target.value})}
                            >
                              <option value="admin">Admin</option>
                              <option value="autres">Autres</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="password"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Mot de passe
                            </label>
                            <input
                              type="password"
                              name="password"
                              id="password"
                              required
                              onChange={(e) => setEmployeesFormData({...employeesFormData, password: e.target.value})}
                              value={employeesFormData.password}
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
                          >
                            Enregistrer
                          </button>
                          <button 
                            type="button"
                            className="w-full text-blue-700"
                          >
                            Changer mon mot de passe
                          </button>
                        </form>
                      }
                    </div>

                    <div className="bg-white rounded-xl shadow overflow-hidden">
                      <table className="w-full table-auto">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left px-4 py-3">Nom</th>
                            <th className="text-left px-4 py-3">Prenom</th>
                            <th className="text-left px-4 py-3">Username</th>
                            <th className="text-left px-4 py-3">Phone</th>
                            <th className="text-left px-4 py-3">Email</th>
                            <th className="text-left px-4 py-3">Adresse</th>
                            <th className="text-left px-4 py-3">Rôle</th>
                            <th className="text-right px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subUsersFiltered.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center py-6 text-gray-500">
                                Aucun utilisateur trouvé.
                              </td>
                            </tr>
                          ) : (
                            subUsersFiltered.map(subUser => (
                              <tr key={subUser.id} className="border-t">
                                <td className="px-4 py-3">{subUser.name}</td>
                                <td className="px-4 py-3">{subUser.surname}</td>
                                <td className="px-4 py-3">{subUser.username}</td>
                                <td className="px-4 py-3">{subUser.phone}</td>
                                <td className="px-4 py-3">{subUser.email}</td>
                                <td className="px-4 py-3">{subUser.adresse}</td>
                                <td className="px-4 py-3">{subUser.role}</td>
                                <td className="px-4 py-3 text-right space-x-3">
                                  <button className="text-yellow-600 hover:text-yellow-800">
                                    <FaEdit />
                                  </button>
                                  <button className="text-red-600 hover:text-red-800">
                                    <FaTrash />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              {settingsSelectedMenu === 'apropos' && (
                <h1 className="text-2xl font-bold">A Propos</h1>
              )}
            </div>
          </div>
          {/*Parametre menu navigant */}
          <div className="fixed bottom-0 left-0 w-full flex p-2 flex items-start justify-center rounded shadow">
            <ul className="w-full flex justify-center gap-3 bg-violet-300 py-2 rounded-full">
              <li
                className={`py-2 px-3 rounded cursor-pointer w-10 flex justify-center items-center rounded-full
                  ${
                    settingsSelectedMenu === 'informations'
                      ? 'bg-violet-400'
                      : 'h-10 bg-white/70 hover:bg-white/90'
                  }`}
                onClick={() => setSettingsSelectedMenu('informations')}
              >
                <FaUser />
              </li>
              {user.role === 'admin' && 
                <li
                  className={`py-2 px-3 rounded cursor-pointer w-10 h-10 flex justify-center items-center rounded-full
                    ${
                      settingsSelectedMenu === 'utilisateurs'
                        ? 'bg-violet-400'
                        : 'h-10 bg-white/70 hover:bg-white/90'
                    }`}
                  onClick={() => setSettingsSelectedMenu('utilisateurs')}
                >
                  <FaUsers/>
                </li>
              }
              <li
                className={`py-2 px-3 rounded cursor-pointer w-10 h-10 flex justify-center items-center rounded-full
                  ${
                    settingsSelectedMenu === 'apropos'
                      ? 'bg-violet-400'
                      : 'h-10 bg-white/70 hover:bg-white/90'
                  }`}
                onClick={() => setSettingsSelectedMenu('apropos')}
              >
                <FaInfo/>
              </li>
            </ul>
          </div>
        </div>
      )}
      {aiResult && (
        <div className="mt-4 p-4 bg-white rounded shadow text-sm whitespace-pre-wrap">
          {aiResult}
        </div>
      )}
      {/* Bouton panier mobile */}
      {view !== 'settings' && 
        <button onClick={() => setCartOpen(true)}
          className="fixed bottom-4 right-4 bg-amber-600 border border-transparent text-center text-white text-lg text-slate-800 transition-all px-5 py-3 rounded-full shadow-lg sm:hidden z-50 flex-1 justify-center"
          style={{width: '100px', height: '100px'}}>
          <span className='flex justify-center'><FaShoppingCart className='text-xl'/></span>
          <span>Panier ({cart.length})</span>
        </button>
      }
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end sm:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={() => setCartOpen(false)}
          ></div>

          {/* Drawer panier */}
          <div className="relative z-50 w-80 max-w-full bg-white shadow-xl h-full p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaShoppingCart /> Panier
              </h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-600 text-xl">✕</button>
            </div>

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
                  <button onClick={() => removeFromCart(p.id)} className="text-red-600 hover:text-red-800 ml-2">
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>

            <hr className="my-3" />
            <div className="text-lg font-bold">Total : FCFA{total.toFixed(2)}</div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="generateInvoice"
                checked={generateInvoice}
                onChange={(e) => setGenerateInvoice(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="generateInvoice" className="text-sm text-gray-700">
                Générer une facture PDF
              </label>
              {generateInvoice && (
                <input
                  type="text"
                  placeholder="Nom du client"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              )}
            </div>
            <button
              onClick={checkout}
              disabled={isLoadingCheckout}
              className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
            >
              {isLoadingCheckout ? "Traitement..." : <><FaCheck /> Valider la vente</>}
            </button>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}