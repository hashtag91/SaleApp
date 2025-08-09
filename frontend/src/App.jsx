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
import RegisterForm from './composants_react/RegisterForm';
import LoginForm from './composants_react/LoginForm';
import MobileDrawOpen from './composants_react/MobileDrawOpen'
import Switcher from './composants_react/Switcher'
import ReactMarkdown from 'react-markdown';
import SubUserEditForm from './composants_react/SubUserEditForm';
import AboutPage from './composants_react/About';

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
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', buy_price: '', stock: 0, alert: 5, image: null});
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState({ name: '', price: '', buy_price: '', stock: '', alert: '', sku: '', image: null });
  const [stockFilter, setStockFilter] = useState('all');
  const [analyseMarkDown, setAnalyseMarkDown] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // drawer panier mobile
  const [generateInvoice, setGenerateInvoice] = useState(false);
  const [isLoadingFacture, setIsLoadingFacture] = useState(false);
  const [clientName, setClientName] = useState('');
  const [settingsSelectedMenu, setSettingsSelectedMenu] = useState('informations');
  const [showPasswordChange, setShowPasswordChange] = useState(false); // Constante pour afficher le formulaire de changement de mot de passe
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState(''); // Constante pour stocker le nouveau mot de passe
  const [confirmPassword, setConfirmPassword] = useState('');
  const [subUsers, setSubUsers] = useState([]);
  const [subUsersFiltered, setSubUsersFiltered] = useState(subUsers);
  const [darkMode, setDarkMode] = useState(false);
  const [subUserId, setSubUserId] = useState(null);
  const [editedSubUserData, setEditedSubUserData] = useState({name: '',surname: '',username: '',phone: '',email: '',adresse: '',role: '', password: null});
  const [subUserToDelete, setSubUserToDelete] = useState(null);

  const COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#14B8A6'];

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { username, password });
      const me = await axios.get('/api/me');
      setUser(me.data.user);
      setDarkMode(me.data.user.dark_mode)
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
          setDarkMode(res.data.user.dark_mode);
          loadProducts();
          loadSubUsers();
        } else {
          handleLogout();
        }
      })
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

  const handlePasswordReset  = async (e) => {
    e.preventDefault();

    const data = new FormData();

    if (oldPassword.length < 6) {
      toast.error("Mot de passe trop court.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mot de passe trop court.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    data.append('oldPassword', oldPassword);
    data.append("newPassword", newPassword);
    data.append('confirmPassword', confirmPassword);

    try {
      const res = await axios.post('/api/reset_password', data)
      toast.success(res.data.message);
      // Reset les champs
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors du changement de mot de passe");
    }
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

    const { name, sku, price, stock, alert } = newProduct;
    if (!name || !sku || !price || !stock) return toast.warning("Tous les champs sont requis.");
    if (isNaN(price) || price <= 0) return toast.warning("Prix invalide");
    if (isNaN(stock) || stock < 0) return toast.warning("Stock invalide");
    if (isNaN(alert) || stock < 0) return toast.warning("Stock alert invalide");

    const formData = new FormData();
    Object.entries(newProduct).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        // Convertir booléens en chaîne pour Flask
        if (typeof val === 'boolean') {
          formData.append(key, val ? 'true' : 'false');
        } else {
          formData.append(key, val);
        }
      }
    });

    await axios.post('/api/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    toast.success('Produit ajouté');
    setShowAddProduct(false);
    setNewProduct({ name: '', sku: '', price: '', buy_price: '', stock: 0, alert: 0, image: null,  });
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
      alert: product.alert,
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

    const { name, sku, price, stock, buy_price} = editedProduct;
    if (!name || !sku || !price || !stock || !buy_price) return toast.warning("Champs manquants.");
    if (isNaN(price) || price <= 0) return toast.warning("Prix invalide");
    if (isNaN(stock) || stock <= 0) return toast.warning("Quantité invalide");

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
      toast.success(updatedProduct.message || "Produit modifié avec succès !");
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
      stockFilter === 'low' ? p.stock <= p.alert:
      stockFilter === 'ok' ? p.stock > p.alert : true;

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

  const handleAnalyseIA = async () => {
    setLoadingAI(true);
    try {
      const ventes = (await axios.get('/api/sales')).data;

      if (!ventes || ventes.length === 0) {
        toast.info("Aucune vente trouvée.");
        return;
      }

      const res = await axios.post('/api/ai/conseil', ventes);
      const texte = res.data.response.message;
      setUser({...user, 'tokens_conseil': res.data.response.tokens_conseil})

      setAnalyseMarkDown(texte);
    } catch (e) {
      toast.error("Limite de 3 conseils IA atteinte pour aujourd'hui.");
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

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

  const handleEditSubUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/employees/${subUserId}`, editedSubUserData);
      toast.success("Employé modifié avec succès !");
      setSubUserId(null);
      loadSubUsers(); // recharge la liste
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la modification");
    }
  };

  const handleDeleteSubUser = async (userId) => {
    try {
      await axios.delete(`/api/employees/${userId}`);
      toast.success("Utilisateur supprimé !");
      setSubUserToDelete(null);
      loadSubUsers(); // rechargement des utilisateurs
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  if (!user){
    return(
      <div
        className={`relative w-full min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center transition-colors duration-500 ${
          darkMode ? 'bg-slate-800' : 'bg-gray-50'
        }`}
        style={{
          backgroundImage: "url('/images/background.png')",
        }}
      >

        {/* Filtre semi-transparent */}
        <div className="h-full absolute inset-0 bg-white/80 dark:bg-slate-900/80"></div>

        {/* Contenu principal */}
        <div className="relative z-10 w-full max-w-md p-6 rounded-xl shadow-xl backdrop-blur-sm">
          
          {/* Logo et accroche */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/images/logo.png"
              alt="Logo"
              loading='lazy'
              className="w-20 h-20 bg-white rounded-full mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center">
              Bienvenue sur <span className="text-blue-600 dark:text-blue-400">Sale App</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm mt-2">
              Connectez-vous ou créez un compte pour commencer.
            </p>
          </div>

          {/* Formulaire Login ou Register */}
          {showRegister ? (
            <RegisterForm
              setName={setName}
              setSurname={setSurname}
              setEntreprise={setEntreprise}
              setAdress={setAdress}
              setPhone={setPhone}
              setEmail={setEmail}
              setUsername={setUsername}
              setPassword={setPassword}
              setLogo={setLogo}
              handleRegister={handleRegister}
              setShowRegister={setShowRegister}
              darkMode={darkMode}
            />
          ) : (
            <LoginForm
              setShowRegister={setShowRegister}
              setPassword={setPassword}
              setUsername={setUsername}
              handleLogin={handleLogin}
              darkMode={darkMode}
            />
          )}
        </div>
        <ToastContainer />
      </div>

    )
  }

  return (
    <div className={`${darkMode ? 'bg-slate-800' : 'bg-gray-50'} p-4 sm:p-4 bg-gray-50 min-h-screen mx-auto`}>
      <div
        className={`sticky top-0 p-4 w-full mb-3 flex justify-between items-center z-40 shadow rounded
          ${darkMode ? 'bg-slate-700' : 'bg-white'}`}
      >
        <h2 className={`text-2xl md:text-4xl font-bold 
          ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {user?.entreprise}
        </h2>
        <div className="flex items-center space-x-3">
          <Switcher darkMode={darkMode} setDarkMode={setDarkMode} className='sm:hidden'/>

          <FaUserCircle className={`hidden sm:inline-flex text-2xl
            ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />

          <span className={`font-medium hidden sm:inline-flex 
            ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {user?.name} {user?.surname}
          </span>

          <button
            onClick={() => { setView('settings'); setShowSettings(true); settingsRetrieve(); }}
            className="hidden sm:inline-flex"
            type="button"
          >
            <FaCog className={`text-2xl ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />
          </button>

          <button
            onClick={() => setMobileDrawerOpen(true)}
            className={`sm:hidden flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
          >
            <FaBars />
          </button>

          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex bg-red-600 text-white px-4 py-2 rounded ml-4"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>


      {/* Le menu sur mobile */}
      {/*  */}
      {mobileDrawerOpen && (
        <MobileDrawOpen setMobileDrawerOpen={setMobileDrawerOpen} setView={setView} loadProducts={loadProducts} loadSales={loadSales} loadingAI={loadingAI} setShowSettings={setShowSettings} settingsRetrieve={settingsRetrieve} handleLogout={handleLogout} user={user} darkMode={darkMode}/>
      )}
      <div className="hidden sm:flex flex-wrap flex-row gap-3 justify-center mb-6">
        <button onClick={() => setView('pos')} className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'pos' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}>
          <FaShoppingCart /> Caisse
        </button>
        <button onClick={() => { setView('admin'); loadProducts(); }} className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'admin' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}>
          <FaBox /> Stock
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
            onClick={() => setView('analyse')}
            disabled={loadingAI}
            className={`px-4 py-2 rounded-lg font-semibold transition ${view === 'analyse' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 hover:bg-indigo-100'}`}>
            {loadingAI ? "Analyse en cours..." : `🔮 Analyse IA (${user.tokens_conseil})`}
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
            <h2 className={`text-2xl font-bold mb-4 text-gray-800 ${darkMode ? 'text-white' : ''}`}>Produits</h2>
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
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
              <FaShoppingCart /> Panier
            </h2>
            <ul>
              {cart.map((p) => (
                <li key={p.id} className="mb-3 flex justify-between items-center">
                  <div className="flex-1">
                    <div className={`font-semibold ${darkMode ? 'text-white' :''}`}>{p.name}</div>
                    <div className="text-sm text-gray-600">
                      <button onClick={() => decreaseQty(p.id)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">−</button>
                      <span className={`mx-2 ${darkMode ? 'text-white/70' : ''}`}>{p.qty}</span>
                      <button onClick={() => increaseQty(p.id)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">+</button>
                      <span className={`ml-4 ${darkMode ? 'text-white/70' : ''}`}>= FCFA {(p.qty * p.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(p.id)} className="text-red-600 hover:text-red-800 ml-2" title="Supprimer du panier">
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
            <hr className="my-3" />
            <div className={`text-lg font-bold ${darkMode ? 'text-white/70' : ''}`}>Total : FCFA{total.toFixed(2)}</div>
            <div className="flex items-center gap-2 mt-4 flex-1">
              <input
                type="checkbox"
                id="generateInvoice"
                checked={generateInvoice}
                onChange={(e) => setGenerateInvoice(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="generateInvoice" className={`text-sm ${darkMode ? 'text-white/70' : 'text-gray-700'}`} >
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
          <h2 className={`text-2xl font-bold mb-4 text-gray-800 ${darkMode ? 'text-white' : ''}`}>Stock</h2>
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
              <span className={`flex items-center gap-1 text-gray-700 ${darkMode ? 'text-white' : ''}`}>
                <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
                OK ({stockOk})
              </span>
            </div>
          </div>

          {showAddProduct && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative overflow-y-auto max-h-full">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                  ✕
                </button>

                <h3 className="text-xl font-semibold mb-4">Ajouter un produit</h3>

                <form onSubmit={submitNewProduct} className="w-full border p-4 sm:p-6 rounded-xl bg-white shadow">
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-gray-700">Nom <span className='text-red-900'>*</span></label>
                    <input type="text" name="name" value={newProduct.name} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-4">
                    <div className='flex'>
                      <label className="block mb-1 font-medium text-gray-700 mr-2">SKU</label>
                      <div class="relative">
                        <span class="w-5 h-5 flex items-center justify-center bg-gray-300 text-gray-700 rounded-full text-xs cursor-pointer hover:opacity-100 peer">
                          ?
                        </span>
                        <div class="absolute left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity">
                          SKU est le numéro d'identifiant unique que vous attribuez à un produit dans le stock pour faciliter son identification.
                        </div>
                      </div>
                    </div>
                    <input type="text" name="sku" value={newProduct.sku} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-gray-700">Prix (FCFA) <span className='text-red-900'>*</span></label>
                    <input type="number" name="price" step="0.01" value={newProduct.price} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="" className="bloc mb-1 font-medium text-gray-700">Prix d'achat (FCFA) <span className='text-red-900'>*</span></label>
                    <input type="number" name="buy_price" value={newProduct.buy_price} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2" required/>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-gray-700">Quantité <span className='text-red-900'>*</span></label>
                    <input type="number" name="stock" value={newProduct.stock} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-4">
                    <div className='flex'>
                      <label className="block mb-1 font-medium text-gray-700 mr-2">Stock d'alert</label>
                      <div class="relative">
                        <span class="w-5 h-5 flex items-center justify-center bg-gray-300 text-gray-700 rounded-full text-xs cursor-pointer hover:opacity-100 peer">
                          ?
                        </span>
                        <div class="absolute left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity">
                          Le stock d'alert est la quantité à partir de laquelle l'application fera un rappel de réapprovisionnement
                        </div>
                      </div>
                    </div>
                    <input type="number" name="alert" value={newProduct.alert} onChange={handleProductChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
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
                    <label className="block mb-1 font-medium text-gray-700">Nom <span className='text-red-900'>*</span></label>
                    <input type="text" name="name" value={editedProduct.name} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-2">
                    <div className='flex'>
                      <label className="block mb-1 font-medium text-gray-700 mr-2">SKU</label>
                      <div class="relative">
                        <span class="w-5 h-5 flex items-center justify-center bg-gray-300 text-gray-700 rounded-full text-xs cursor-pointer hover:opacity-100 peer">
                          ?
                        </span>
                        <div class="absolute left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity">
                          SKU est le numéro d'identifiant unique que vous attribuez à un produit dans le stock pour faciliter son identification.
                        </div>
                      </div>
                    </div>
                    <input type="text" name="sku" value={editedProduct.sku} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 font-medium text-gray-700">Prix (FCFA) <span className='text-red-900'>*</span></label>
                    <input type="number" name="price" step="0.01" value={editedProduct.price} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 font-medium text-gray-700">Prix d'achat (FCFA) <span className='text-red-900'>*</span></label>
                    <input type="number" name="buy_price" step="0.01" value={editedProduct.buy_price} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 font-medium text-gray-700">Quantité <span className='text-red-900'>*</span></label>
                    <input type="number" name="stock" value={editedProduct.stock} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
                  </div>
                  <div className="mb-2">
                    <div className='flex'>
                      <label className="block mb-1 font-medium text-gray-700 mr-2">Stock d'alert</label>
                      <div class="relative">
                        <span class="w-5 h-5 flex items-center justify-center bg-gray-300 text-gray-700 rounded-full text-xs cursor-pointer hover:opacity-100 peer">
                          ?
                        </span>
                        <div class="absolute left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity">
                          Le stock d'alert est la quantité à partir de laquelle l'application fera un rappel de réapprovisionnement
                        </div>
                      </div>
                    </div>
                    <input type="number" name="alert" value={editedProduct.alert} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
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
          <table className={`min-w-full border border-gray-300 rounded-lg overflow-scroll ${darkMode ? 'text-white border-gray-700':''}`}>
            <thead className={`${darkMode ? 'bg-gray-800' :'bg-gray-100'}`}>
              <th
                className={`${darkMode ? 'px-6 py-3 text-left text-gray-200 uppercase border-b border-gray-300 border-gray-700' : 'px-6 py-3 text-left text-gray-700 uppercase border-b border-gray-300 border-gray-700'}`}
              >
                Image
              </th>
              <th 
                className={`${darkMode ? 'px-6 py-3 text-left text-gray-200 uppercase border-b border-gray-300 border-gray-700' : 'px-6 py-3 text-left text-gray-700 uppercase border-b border-gray-300 border-gray-700'}`}>
                  Nom
              </th>
              <th 
                className={`${darkMode ? 'px-6 py-3 text-left text-gray-200 uppercase border-b border-gray-300 border-gray-700' : 'px-6 py-3 text-left text-gray-700 uppercase border-b border-gray-300 border-gray-700'}`}>
                  SKU
              </th>
              <th 
                className={`${darkMode ? 'px-6 py-3 text-left text-gray-200 uppercase border-b border-gray-300 border-gray-700' : 'px-6 py-3 text-left text-gray-700 uppercase border-b border-gray-300 border-gray-700'}`}>
                  Prix d'achat
              </th>
              <th 
                className={`${darkMode ? 'px-6 py-3 text-left text-gray-200 uppercase border-b border-gray-300 border-gray-700' : 'px-6 py-3 text-left text-gray-700 uppercase border-b border-gray-300 border-gray-700'}`}>
                  Prix de vente
              </th>
              <th 
                className={`${darkMode ? 'px-6 py-3 text-left text-gray-200 uppercase border-b border-gray-300 border-gray-700' : 'px-6 py-3 text-left text-gray-700 uppercase border-b border-gray-300 border-gray-700'}`}>
                  Quantité
              </th>
              <th 
                className={`${darkMode ? 'px-6 py-3 text-left text-gray-200 uppercase border-b border-gray-300 border-gray-700' : 'px-6 py-3 text-left text-gray-700 uppercase border-b border-gray-300 border-gray-700'}`}>
                  Qty Alert
              </th>
              <th 
                className={`${darkMode ? 'px-6 py-3 text-left text-gray-200 uppercase border-b border-gray-300 border-gray-700' : 'px-6 py-3 text-left text-gray-700 uppercase border-b border-gray-300 border-gray-700'}`}
              >
                Actions
              </th>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  className={`hover:bg-gray-500 transition-colors ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  } ${
                    p.stock === 0
                      ? "bg-red-900 text-white hover:bg-red-800"
                      : p.stock <= p.alert
                      ? "bg-yellow-100 text-black hover:bg-yellow-900"
                      : ""
                  }`}
                >
                  <td className={`px-6 py-4 text-sm border-b ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                    <img src={p.imageUrl} width={40} height={40} className="rounded" />
                  </td>

                  <td className="px-6 py-4 text-sm font-bold border-b">{p.name}</td>
                  <td className="px-6 py-4 text-sm border-b">{p.sku}</td>
                  <td className="px-6 py-4 text-sm border-b">{p.price}</td>
                  <td className="px-6 py-4 text-sm border-b">{p.buy_price}</td>
                  <td className="px-6 py-4 text-sm border-b">{p.stock}</td>
                  <td className="px-6 py-4 text-sm border-b">{p.alert}</td>

                  <td className={`px-6 py-4 text-sm border-b`}>
                    <button className="px-3 py-3 bg-blue-500 rounded hover:bg-blue-600 mr-5" onClick={() => handleEditProduct(p)}>
                      <FaEdit className="text-white" />
                    </button>
                    <button className="px-3 py-3 bg-red-500 rounded hover:bg-red-600">
                      <FaTrash className="text-white" />
                    </button>
                  </td>
                </tr>


              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'sales' && (
        <div className="p-4">
          <h2 className={`text-2xl font-bold mb-4 text-gray-800 ${darkMode ? 'text-white' : ''}`}>🧾 Historique des ventes</h2>

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
                <div
                  key={s.id}
                  className={`rounded-xl p-5 shadow-sm hover:shadow-md transition ${
                    darkMode
                      ? 'border border-slate-700 bg-slate-800 text-gray-100'
                      : 'border border-gray-200 bg-white text-gray-800'
                  }`}
                >
                  {/* En-tête vente */}
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">
                        🧾 Vente #{s.id}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(s.date).toLocaleString()}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Vendeur: <span className={`${darkMode ? 'text-white' : 'text-black'} font-semibold`}>{s.seller}</span>
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</span>
                      <div className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        FCFA {s.total.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Tableau des articles */}
                  <div className="overflow-x-auto w-full">
                    <table
                      className={`min-w-full text-sm border rounded-lg ${
                        darkMode ? 'border-slate-700' : 'border-gray-300'
                      }`}
                    >
                      <thead className={`${darkMode ? 'bg-slate-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                        <tr>
                          <th className={`px-4 py-2 border ${darkMode ? 'border-slate-600' : 'border-gray-300'}`}>Produit</th>
                          <th className={`px-4 py-2 border ${darkMode ? 'border-slate-600' : 'border-gray-300'}`}>SKU</th>
                          <th className={`px-4 py-2 border ${darkMode ? 'border-slate-600' : 'border-gray-300'}`}>Quantité</th>
                          <th className={`px-4 py-2 border ${darkMode ? 'border-slate-600' : 'border-gray-300'}`}>Prix unitaire</th>
                          <th className={`px-4 py-2 border ${darkMode ? 'border-slate-600' : 'border-gray-300'}`}>Sous-total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} className={`${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            <td className={`px-4 py-2 border ${darkMode ? 'border-slate-700' : 'border-gray-300'}`}>{item.name}</td>
                            <td className={`px-4 py-2 border ${darkMode ? 'border-slate-700' : 'border-gray-300'}`}>{item.sku}</td>
                            <td className={`px-4 py-2 border text-center ${darkMode ? 'border-slate-700' : 'border-gray-300'}`}>{item.qty}</td>
                            <td className={`px-4 py-2 border text-right ${darkMode ? 'border-slate-700' : 'border-gray-300'}`}>
                              FCFA {Number(item.price).toFixed(2)}
                            </td>
                            <td className={`px-4 py-2 border text-right ${darkMode ? 'border-slate-700' : 'border-gray-300'}`}>
                              FCFA {(item.price * item.qty).toFixed(2)}
                            </td>
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
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📊 Statistiques des Ventes</h2>
          <div className={`mx-auto rounded-xl shadow p-6 mb-2 ${darkMode ? 'bg-slate-900 shadow-lg border border-gray-100' : 'bg-white'}`}>
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
          <div className={`max-w-3xl mx-auto rounded-xl shadow p-6 ${darkMode ? 'bg-slate-900 shadow-lg border border-gray-100' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : ''}`}>Produits les plus vendus</h3>
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
          <h2 className={`text-center font-2xl font-bold mb-2 ${darkMode ? 'text-white' : ''}`}>Paramètres</h2>
          <div className="flex flex-grow flex pb-20">
            <div className="flex-grow flex justify-center items-center">
              {settingsSelectedMenu === 'informations' && (
                <form
                  onSubmit={showPasswordChange ? handlePasswordReset : settingsSubmit}
                  className={`p-8 rounded-lg shadow-md w-full max-w-sm space-y-4 mt-1 mb-1 transition-colors duration-300
                    ${darkMode ? 'bg-slate-800 text-gray-100 border border-gray-100' : 'bg-white text-gray-800'}`}
                >
                  <h2 className="text-center font-bold">{showPasswordChange ? 'Changer le mot de passe' : 'Mes informations'}</h2>
                  {!showPasswordChange && (
                    <>
                      {/* Nom */}
                      <div>
                        <label
                          htmlFor="name"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Nom <span className='text-red-800'>*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          placeholder="Nom"
                          required
                          onChange={handleSettingsFieldChange}
                          value={settingsMe.name}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                      </div>

                      {/* Prénom */}
                      <div>
                        <label
                          htmlFor="surname"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Prénom <span className='text-red-800'>*</span>
                        </label>
                        <input
                          type="text"
                          name="surname"
                          id="surname"
                          placeholder="Prénom"
                          required
                          onChange={handleSettingsFieldChange}
                          value={settingsMe.surname}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                      </div>

                      {/* Entreprise */}
                      <div>
                        <label
                          htmlFor="entreprise"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Entreprise
                        </label>
                        <input
                          type="text"
                          name="entreprise"
                          id="entreprise"
                          placeholder="Nom de l'entreprise"
                          disabled={user.role !== 'admin'}
                          onChange={handleSettingsFieldChange}
                          value={settingsMe.entreprise}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                      </div>

                      {/* Adresse */}
                      <div>
                        <label
                          htmlFor="adresse"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Adresse
                        </label>
                        <input
                          type="text"
                          name="adresse"
                          id="adresse"
                          placeholder="Adresse de l'entreprise"
                          onChange={handleSettingsFieldChange}
                          value={settingsMe.adresse}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                      </div>

                      {/* Téléphone */}
                      <div>
                        <label
                          htmlFor="phone"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Téléphone
                        </label>
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          placeholder="Téléphone"
                          required
                          onChange={handleSettingsFieldChange}
                          value={settingsMe.phone}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label
                          htmlFor="email"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          placeholder="Email"
                          required
                          onChange={handleSettingsFieldChange}
                          value={settingsMe.email}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                      </div>

                      {/* Logo - admin seulement */}
                      {user.role === 'admin' && (
                        <div>
                          <label
                            htmlFor="logo"
                            className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                          >
                            Logo
                          </label>
                          <input
                            type="file"
                            name="logo"
                            id="logo"
                            accept="image/*"
                            className={`w-full ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                            onChange={handleSettingsLogoChange}
                          />
                        </div>
                      )}

                      {/* Username */}
                      <div>
                        <label
                          htmlFor="username"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Nom d'utilisateur <span className='text-red-800'>*</span>
                        </label>
                        <input
                          type="text"
                          name="username"
                          id="username"
                          required
                          onChange={handleSettingsFieldChange}
                          value={settingsMe.username}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                        />
                      </div>
                    </>
                  )}
                  {showPasswordChange && (
                    <>
                      <div>
                        <label
                          htmlFor="oldPassword"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Ancien mot de passe <span className='text-red-800'>*</span>
                        </label>
                        <input
                          type="password"
                          name="oldPassword"
                          id="oldPassword"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="newPassword"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Nouveau mot de passe <span className='text-red-800'>*</span>
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          placeholder='Minimum 6 caractères'
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Confirmer le mot de passe <span className='text-red-800'>*</span>
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`mt-1 block w-full px-4 py-2 rounded-md shadow-sm transition
                            ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                          required
                        />
                      </div>
                    </>
                  )}
                  {/* Boutons */}
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
                  >
                    Enregistrer
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className={`w-full text-sm underline font-medium ${
                      darkMode ? 'text-blue-400' : 'text-blue-700'
                    }`}
                  >
                    {showPasswordChange ? 'Annuler' : 'Changer mon mot de passe'}
                  </button>
                </form>

              )}
              {settingsSelectedMenu === 'utilisateurs' && (
                <>
                  <div className='flex flex-col'>
                    <h1 className={`text-3xl font-bold mb-6 text-gray-800 text-center ${darkMode ? 'text-white' : ''}`}>Gestion des utilisateurs</h1>

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
                              Nom <span className='text-red-600'>*</span>
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
                              Prénom <span className='text-red-600'>*</span>
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
                              Téléphone <span className='text-red-600'>*</span>
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
                              Email <span className='text-red-600'>*</span>
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              placeholder="Email"
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
                              Nom d'utilisateur <span className='text-red-600'>*</span>
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
                              Mot de passe <span className='text-red-600'>*</span>
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

                    <div
                      className={`rounded-xl shadow overflow-hidden transition ${
                        darkMode ? 'bg-slate-800 text-gray-100' : 'bg-white text-gray-800'
                      }`}
                    >
                      {/* Table mode (desktop et tablette) */}
                      <table className="w-full table-auto hidden md:table">
                        <thead className={darkMode ? 'bg-slate-700 text-gray-200' : 'bg-gray-100 text-gray-700'}>
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
                              <td
                                colSpan="8"
                                className={`text-center py-6 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}
                              >
                                Aucun utilisateur trouvé.
                              </td>
                            </tr>
                          ) : (
                            subUsersFiltered.map((subUser) => (
                              <tr key={subUser.id} className={darkMode ? 'border-t border-slate-700' : 'border-t border-gray-200'}>
                                <td className="px-4 py-3">{subUser.name}</td>
                                <td className="px-4 py-3">{subUser.surname}</td>
                                <td className="px-4 py-3">{subUser.username}</td>
                                <td className="px-4 py-3">{subUser.phone}</td>
                                <td className="px-4 py-3">{subUser.email}</td>
                                <td className="px-4 py-3">{subUser.adresse}</td>
                                <td className="px-4 py-3">{subUser.role}</td>
                                <td className="px-4 py-3 text-right space-x-3">
                                  <button 
                                    className="text-yellow-500 hover:text-yellow-400"
                                    onClick={() => {
                                      setSubUserId(subUser.id);
                                      setEditedSubUserData({
                                        name: subUser.name,
                                        surname: subUser.surname,
                                        username: subUser.username,
                                        phone: subUser.phone,
                                        email: subUser.email,
                                        adresse: subUser.adresse,
                                        role: subUser.role,
                                        password: ''
                                      })
                                    }}  
                                  >
                                    <FaEdit />
                                  </button>
                                  <button 
                                    className="text-red-500 hover:text-red-400"
                                    onClick={() => setSubUserToDelete(subUser.id)}
                                  >
                                    <FaTrash />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      {subUserToDelete && (
                        <div className={`fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50`}>
                          <div className={`p-6 rounded-lg shadow-lg w-full max-w-sm border
                            ${darkMode ? 'bg-slate-800 border-gray-100 text-white' : 'bg-white border-gray-300 text-gray-800'}`}>
                            
                            <h3 className="text-lg font-semibold mb-4 text-center">
                              Confirmer la suppression ?
                            </h3>
                            <p className="text-center mb-6 text-red-600">
                              Cette action est <strong>irréversible</strong>.
                            </p>

                            <div className="flex justify-between gap-4">
                              <button
                                onClick={() => handleDeleteSubUser(subUserToDelete)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                              >
                                Supprimer
                              </button>
                              <button
                                onClick={() => setSubUserToDelete(null)}
                                className={`flex-1 px-4 py-2 rounded font-semibold transition
                                  ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'}`}
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mobile card mode */}
                      <div className={darkMode ? 'md:hidden divide-y divide-slate-700' : 'md:hidden divide-y divide-gray-200'}>
                        {subUsersFiltered.length === 0 ? (
                          <p className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Aucun utilisateur trouvé.
                          </p>
                        ) : (
                          subUsersFiltered.map((subUser) => (
                            <div key={subUser.id} className="p-4">
                              <p>
                                <span className="font-semibold">Nom:</span> {subUser.name}
                              </p>
                              <p>
                                <span className="font-semibold">Prénom:</span> {subUser.surname}
                              </p>
                              <p>
                                <span className="font-semibold">Username:</span> {subUser.username}
                              </p>
                              <p>
                                <span className="font-semibold">Téléphone:</span> {subUser.phone}
                              </p>
                              <p>
                                <span className="font-semibold">Email:</span> {subUser.email}
                              </p>
                              <p>
                                <span className="font-semibold">Adresse:</span> {subUser.adresse}
                              </p>
                              <p>
                                <span className="font-semibold">Rôle:</span> {subUser.role}
                              </p>
                              <div className="flex justify-end space-x-3 mt-2">
                                <button 
                                  className="text-yellow-500 hover:text-yellow-400"
                                  onClick={() => {
                                    setSubUserId(subUser.id);
                                    setEditedSubUserData({
                                      name: subUser.name,
                                      surname: subUser.surname,
                                      username: subUser.username,
                                      phone: subUser.phone,
                                      email: subUser.email,
                                      adresse: subUser.adresse,
                                      role: subUser.role,
                                      password: ''
                                    })
                                  }} 
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  className="text-red-500 hover:text-red-400"
                                  onClick={() => setSubUserToDelete(subUser.id)}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                        {subUserToDelete && (
                          <div className={`fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50`}>
                            <div className={`p-6 rounded-lg shadow-lg w-full max-w-sm border
                              ${darkMode ? 'bg-slate-800 border-gray-100 text-white' : 'bg-white border-gray-300 text-gray-800'}`}>
                              
                              <h3 className="text-lg font-semibold mb-4 text-center">
                                Confirmer la suppression ?
                              </h3>
                              <p className="text-center mb-6">
                                Cette action est <strong>irréversible</strong>.
                              </p>

                              <div className="flex justify-between gap-4">
                                <button
                                  onClick={() => handleDeleteSubUser(subUserToDelete)}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                >
                                  Supprimer
                                </button>
                                <button
                                  onClick={() => setSubUserToDelete(null)}
                                  className={`flex-1 px-4 py-2 rounded font-semibold transition
                                    ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'}`}
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {subUserId && (
                      <SubUserEditForm handleEditSubUserSubmit={handleEditSubUserSubmit} darkMode={darkMode} editedSubUserData={editedSubUserData}
                        setEditedSubUserData={setEditedSubUserData} setSubUserId={setSubUserId}
                      />
                    )}
                  </div>
                </>
              )}
              {settingsSelectedMenu === 'apropos' && (
                <>
                  <AboutPage darkMode={darkMode}/>
                </>
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
      {view == 'analyse' && (
        // {analyserAvecIA}
        <div className={`p-6 max-w-3xl mx-auto`}>
          <h2 className={`text-2xl font-bold mb-4 text-center ${darkMode ? 'text-white' : 'text-indigo-700'}`}>🔍 Analyse IA des ventes</h2>
          
          <div className="text-center mb-6">
            <button 
              onClick={handleAnalyseIA}
              disabled={loadingAI}
              className={`${user.tokens_conseil == 0 ? 'bg-red-600': 'bg-purple-600'} hover:bg-purple-700 text-white px-6 py-2 rounded shadow`}>
              {loadingAI ? "Analyse en cours..." : "Lancer l’analyse"}
            </button>
          </div>

          {analyseMarkDown && (
            <div className={`prose prose-lg w-full p-4 rounded-xl shadow border overflow-auto break-words
              ${darkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white'}`
              }>
              <ReactMarkdown>{analyseMarkDown}</ReactMarkdown>
            </div>
          )}
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
          <div className={`relative z-50 w-80 max-w-full shadow-xl h-full p-4 overflow-y-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold flex items-center gap-2 text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
                <FaShoppingCart className={`${darkMode ? 'text-white' : ''}`}/> Panier
              </h2>
              <button onClick={() => setCartOpen(false)} className={`text-xl ${darkMode ? 'text-white' : 'text-gray-600'}`}>✕</button>
            </div>

            <ul>
              {cart.map((p) => (
                <li key={p.id} className="mb-3 flex justify-between items-center">
                  <div className="flex-1">
                    <div className={`font-semibold ${darkMode ? 'text-white' : ''}`}>{p.name}</div>
                    <div className={`text-sm ${darkMode ? 'text-white/70' : 'text-gray-600'}`}>
                      <button onClick={() => decreaseQty(p.id)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-black">−</button>
                      <span className="mx-2">{p.qty}</span>
                      <button onClick={() => increaseQty(p.id)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-black">+</button>
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
            <div className={`text-lg font-bold ${darkMode ? 'text-white/70' : ''}`}>Total : FCFA{total.toFixed(2)}</div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="generateInvoice"
                checked={generateInvoice}
                onChange={(e) => setGenerateInvoice(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="generateInvoice" className={`text-sm ${darkMode ? 'text-white/70' : 'text-gray-700'}`}>
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