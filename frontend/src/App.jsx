import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import axios from 'axios';
axios.defaults.withCredentials = true; // 🔐 envoie cookies sessions automatiquement
import {
  FaShoppingCart,
  FaTrash,
  FaCheck,
  FaSearch,
  FaBars,
  FaSignOutAlt,
  FaUserCircle,
  FaBell,
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
import Dashboard from './composants_react/Dashboard';
import AboutPage from './composants_react/About';
import MenuLateral from './composants_react/MenuLateral';
import Categories from './composants_react/Categories';
import Employees from './composants_react/Employees';
import Stock from './composants_react/Stock';
import ContactPage from './composants_react/ServiceClient';
import SelectedSale from './composants_react/SelectedSale';
import { motion, AnimatePresence } from "framer-motion";

const socket = io("http://localhost:5000"); // ton backend Flask

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
  const [openMenu, setOpenMenu] = useState(true);
  const [view, setView] = useState('pos');
  const [products, setProducts] = useState([]);
  const [editedProduct, setEditedProduct] = useState({ name: '', price: '', buy_price: '', stock: '', alert: '', sku: '', category:'', image: null });
  const [editProduct, setEditProduct] = useState(null);
  const [productPage, setProductPage] = useState('products'); //Pour la navigation entre les pages de création, modification et affichage des produits
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [sales, setSales] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMe, setSettingsMe] = useState({name: "", surname: "", username: "", phone: "", email: "", entreprise: "", adresse: "", logo: null, role:''})
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [analyseMarkDown, setAnalyseMarkDown] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // drawer panier mobile
  const [generateInvoice, setGenerateInvoice] = useState(false);
  const [isLoadingFacture, setIsLoadingFacture] = useState(false);
  const [clientName, setClientName] = useState('');
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
  const [categories, setCategories] = useState([]);
  const [adminId, setAdminId] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [newNotificationsCount, setNewNotificationsCount] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null); // Utiliser pour stocker la vente choisie dans la notification

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
      loadCategories();
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

  const loadCategories = async () => {
    const res = await axios.get('/api/category');
    setCategories(res.data);
  }

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
          loadCategories();
        } else {
          handleLogout();
        }
      })
  }, []);

  const loadNotifications = async () => {
    const res = await axios.get(`/api/notifications/${user.id}`);
    setNotifications(res.data);
    const newNotifications = res.data.filter(n => !n.is_read);
    setNewNotificationsCount(newNotifications.length);
  }

  useEffect(() => {
    if (user && user.role === "admin") {
      socket.emit("join_admin", { admin_id: user.id }); //Joindre la session admin et joindre sa room
    }

    socket.on("Nouvelle vente", (data) => {
      toast.success(`Nouvelle vente de ${data.seller} - Total: ${data.total} FCFA`);
      loadNotifications();
    });

    if (user && user.role === "admin") {
      loadNotifications();
    }
    return () => {
      socket.off("Nouvelle vente");
    };
  }, [adminId, user]);

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
      setView (user.role === 'admin' ? 'dashboard' :'pos');
      loadProducts();
      loadSubUsers();
      loadCategories();
      loadSales();
      if (user.role === 'admin') {
        setAdminId(user.id);
        loadNotifications();
      }
    };
  }, []);

  useEffect(() => {
    const t = cart.reduce((acc, p) => acc + p.price * p.qty, 0);
    setTotal(t);
  }, [cart]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Stock insuffisant !');
      return
    }
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
      loadNotifications();
    } catch (err) {
      console.error("Erreur checkout:", err);
      toast.error("Erreur pendant la vente");
    } finally {
      setIsLoadingCheckout(false);
    }
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

  const posProducts = products.filter((p) => p.stock > 0);

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchStock = true;

      if (stockFilter === 'rupture') {
        matchStock = p.stock === 0;
      } else if (stockFilter === 'low') {
        matchStock = p.stock <= p.alert && p.stock > 0;
      } else if (stockFilter === 'ok') {
        matchStock = p.stock > p.alert;
      } else if (stockFilter !== 'all') {
        matchStock = p.category === stockFilter;
      }

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
      const label = i.sku ? i.sku : i.name;
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

  const notif_read = async (id) => {
    await axios.put(`/api/notification/${id}`);
    loadNotifications();
    if (notifications.filter(n => n.id === id)[0].title === 'Nouvelle vente') {
      loadSales();
      const saleId = notifications.filter(n => n.id === id)[0].sale_id;
      const sale = sales.filter(s => s.id === saleId)[0];
      setSelectedSale(sale);
      setView('showSale');
    }
    setOpenNotif(!openNotif);
  }

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
    <div className={`${darkMode ? 'bg-slate-800' : 'bg-gray-50'} flex flex-col h-screen mx-auto `}>
      <div
        className={`sticky top-0 p-4 w-full flex justify-between items-center z-50 shadow rounded h-16 ${darkMode ? 'bg-slate-700' : 'bg-white'}`}
      >
        <div className='flex gap-2'>
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className='hidden sm:flex'
          >
            <FaBars className={`text-lg ${darkMode ? 'text-white':'text-gray-900'}`} />
          </button>
          <h2 className={`text-1xl md:text-1xl font-bold 
            ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Ika Jaago
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <Switcher darkMode={darkMode} setDarkMode={setDarkMode} className='sm:hidden'/>

          <FaUserCircle className={`hidden sm:inline-flex text-2xl
            ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />

          <span className={`font-medium hidden sm:inline-flex 
            ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {user?.name} {user?.surname}
          </span>

          {user.role === 'admin' && (
            <div className="relative">
              {/* Bouton cloche */}
              <button
                onClick={() => {setOpenNotif(!openNotif); loadSales();}}
                className="relative flex items-center"
              >
                {newNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {newNotificationsCount > 9 ? "9+" : newNotificationsCount}
                  </span>
                )}
                <FaBell className={`w-6 h-6 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />
              </button>

              {/* Panel notifications */}
              {openNotif && (
                <div
                  className={`absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-lg shadow-lg z-50 p-4 ${
                    darkMode ? 'bg-slate-800 text-gray-100' : 'bg-white text-gray-800'
                  }`}
                >
                  <h3 className="font-semibold mb-2">Notifications</h3>

                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400">Aucune notification</p>
                  ) : (
                    <ul className="space-y-2">
                      {notifications.map((notif, idx) => (
                        <li
                          key={idx}
                          className={`relative p-2 rounded-lg border cursor-pointer ${
                            darkMode
                              ? 'border-slate-600 hover:bg-slate-700'
                              : 'border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => notif_read(notif.id)}
                        >
                          {notif.is_read === false && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                          <p className="text-sm">{notif.message}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

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

      <div className='flex flex-1 overflow-y-auto'>
        <MenuLateral user={user} setView={setView} view={view} loadProducts={loadProducts} loadingAI={loadingAI} loadSales={loadSales} openMenu1={openMenu} settingsRetrieve={settingsRetrieve}/>
        <div className='flex-1 overflow-y-auto py-2 px-3'>
          {/* Le menu sur mobile */}
          {/*  */}
          {mobileDrawerOpen && (
            <MobileDrawOpen setMobileDrawerOpen={setMobileDrawerOpen} setView={setView} loadProducts={loadProducts} loadSales={loadSales} loadingAI={loadingAI} setShowSettings={setShowSettings} settingsRetrieve={settingsRetrieve} handleLogout={handleLogout} user={user} darkMode={darkMode} view={view}/>
          )}

          {['pos'].includes(view) && (
            <div className="sticky top-0 mb-6 max-w-md mx-auto flex items-center gap-3 border border-gray-300 rounded px-3 py-2 bg-white z-10">
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
          {view === 'dashboard' && (
            <Dashboard sales={sales} loadSales={loadSales} products={products} darkMode={darkMode} setEditedProduct={setEditedProduct}
              setEditProduct={setEditProduct} setProductPage={setProductPage} setView={setView}/>
          )}
          {view === 'pos' && (
            <div className="flex flex-col lg:flex-row gap-6 w-full px-5">
              <div className="flex-1 h-screen">
                <h2 className={`text-2xl font-bold mb-4 text-gray-800 ${darkMode ? 'text-white' : ''}`}>Produits</h2>
                <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {posProducts.map((p) => (
                    p.stock > 0 ? (
                      <button key={p.id} onClick={() => addToCart(p)} className={`text-white rounded-xl shadow-lg flex flex-col ${darkMode ? 'bg-slate-400':''}`} style={{ minHeight: '120px' }}>
                        {p.imageUrl && (
                          <div className="p-1 flex items-center justify-center bg-white rounded-xl w-full h-full">
                            <img src={p.imageUrl} alt={p.name} className="max-w-[70%] max-h-full object-contain rounded" />
                          </div>
                        )}
                        <div className="w-full p-3 flex flex-col justify-center space-y-1 text-left">
                          <span className={`font-semibold text-gray-700 truncate ${darkMode ? 'text-white':''}`}>{p.name}</span>
                          <span className={`text-xs text-gray-500 ${darkMode ? 'text-white':''}`}>SKU: {p.sku}</span>
                          <span className={`text-sm text-gray-500 ${darkMode ? 'text-white':''}`}>Stock: <span className='font-bold'>{p.stock}</span></span>
                          <span className={`font-bold text-sm text-red-700 ${darkMode ? 'text-red-500' : ''}`}>FCFA {p.price.toFixed(0)}</span>
                        </div>
                      </button>
                    ) :''
                  ))}
                </div>
              </div>

              <div className="w-[20vw] min-w-[280px] hidden sm:block sticky top-0 h-screen">
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

                <button onClick={checkout} className="mt-4 w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2">
                  <FaCheck /> Valider la vente
                </button>
              </div>
              <ToastContainer/>
            </div>
          )}

          {view === 'admin' && (
            <Stock darkMode={darkMode} user={user} products={products} stockFilter={stockFilter}
              setStockFilter={setStockFilter} categories={categories} filteredProducts={filteredProducts}
              loadProducts={loadProducts} setProducts={setProducts} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              editedProduct={editedProduct} setEditedProduct={setEditedProduct} editProduct={editProduct} setEditProduct={setEditProduct}
              productPage={productPage} setProductPage={setProductPage}
            />
          )}

          {view === 'sales' && (
            <div className="p-4">
              <h2 className={`text-2xl font-bold mb-4 text-gray-800 ${darkMode ? 'text-white' : ''}`}>Historique des ventes</h2>

              {/* Filtres et export */}
              <div className="sticky top-0 flex flex-wrap gap-3 mb-6">
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
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Exporter CSV
                </button>
              </div>

              {/* Liste des ventes */}
              <div className="flex-1 overflow-auto space-y-6 flex-1 flex-col">
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
              <ToastContainer/>
            </div>
          )}
          {view === 'charts' && (
            <div className="p-4 sm:p-6 space-y-8">
              {/* Titre */}
              <h2
                className={`text-xl sm:text-2xl font-extrabold mb-2 sm:mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Statistiques des Ventes
              </h2>
            
              {/* Grille responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BarChart */}
                <div
                  className={`rounded-2xl p-4 sm:p-6 shadow-lg transition-colors duration-300 
                    ${darkMode 
                      ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-700" 
                      : "bg-white border border-gray-200"}`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      darkMode ? "text-gray-100" : "text-gray-700"
                    }`}
                  >
                    Comparaison Achats vs Ventes
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={darkMode ? "#4b5563" : "#e5e7eb"}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={darkMode ? "#d1d5db" : "#374151"}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickFormatter={(v) => `FCFA ${v}`}
                        stroke={darkMode ? "#d1d5db" : "#374151"}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(v) => `FCFA ${v}`} />
                      <Legend />
                      <Bar dataKey="vente" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="achat" fill="#F97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            
                {/* PieChart */}
                <div
                  className={`rounded-2xl p-4 sm:p-6 shadow-lg transition-colors duration-300 
                    ${darkMode 
                      ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-700" 
                      : "bg-white border border-gray-200"}`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      darkMode ? "text-gray-100" : "text-gray-700"
                    }`}
                  >
                    Produits les plus vendus
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={productChartData.slice(-5)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        isAnimationActive
                      >
                        {productChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} FCFA`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            
              <ToastContainer />
            </div>          
          )}
          {view === 'profil' && (
            <div className="flex-grow relative">
              <h2 className={`text-2xl font-bold mb-4 text-gray-800 ${darkMode ? 'text-white' : ''}`}>Mon profil</h2>
              <div className="flex flex-grow flex pb-20">
                <div className="flex-grow flex justify-center items-center">
                  <form
                    onSubmit={showPasswordChange ? handlePasswordReset : settingsSubmit}
                    className={`p-8 rounded-lg shadow-md w-full max-w-md space-y-4 mt-1 mb-1 transition-colors duration-300
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
                </div>
              </div>
              <ToastContainer/>
            </div>
          )}
          {view === 'employees' && (
            <Employees 
              darkMode={darkMode} filteredSubUsers={filteredSubUsers}
              subUsersFiltered={subUsersFiltered} setSubUserId={setSubUserId}
              setEditedSubUserData={setEditedSubUserData} setSubUserToDelete={setSubUserToDelete} subUserToDelete={subUserToDelete}
              handleDeleteSubUser={handleDeleteSubUser} editedSubUserData={editedSubUserData} handleEditSubUserSubmit={handleEditSubUserSubmit}
              loadSubUsers={loadSubUsers}
            />
          )}
          {view === 'about' && (
            <div className="flex-grow relative">
              <div className="flex flex-grow flex pb-20">
                <div className="flex-grow flex justify-center items-center">
                <AboutPage darkMode={darkMode}/>
                </div>
              </div>
              <ToastContainer/>
            </div>
          )}
          {view == 'analyse' && (
            // {analyserAvecIA}
            <div className="p-4 sm:p-6 w-full flex flex-col space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-3">
                <h2
                  className={`text-xl sm:text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Analyse IA des ventes
                </h2>

                <button
                  onClick={handleAnalyseIA}
                  disabled={loadingAI}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg shadow font-medium transition 
                    ${user.tokens_conseil == 0 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-blue-600 hover:bg-blue-700"} 
                    text-white disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loadingAI ? "Analyse en cours..." : "Lancer l’analyse"}
                </button>
              </div>

              {/* Notification informative permanente */}
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-sm border shadow-md 
                  ${darkMode 
                    ? "bg-slate-700 text-gray-200 border-slate-600" 
                    : "bg-blue-50 text-blue-800 border-blue-200"}`}
              >
                <span className="text-xl">ℹ️</span>
                <p>
                  L’analyse IA est basée sur les <strong>données de ventes effectuées</strong>.  
                  Si vos ventes sont limitées ou incomplètes, les résultats peuvent être moins précis.
                </p>
              </div>

              {/* Résultats IA avec animation */}
              <AnimatePresence>
                {analyseMarkDown && (
                  <motion.div
                    key="analyse-ia"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`prose prose-sm sm:prose-lg max-w-full sm:max-w-3xl w-full p-4 rounded-xl shadow border 
                      overflow-auto transition duration-300
                      ${darkMode ? "bg-slate-800 text-white border-gray-700" : "bg-white border-gray-200"}`}
                  >
                    <ReactMarkdown>{analyseMarkDown}</ReactMarkdown>
                  </motion.div>
                )}
              </AnimatePresence>

              <ToastContainer position="bottom-right" />
            </div>

          )}
          {view === 'categories' && (
            <Categories categories={categories} setCategories={setCategories} darkMode={darkMode} loadCategories={loadCategories}/>
          )}
          {view === 'support' && (
            <ContactPage darkMode={darkMode} user={user}/>
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
          {view === 'showSale' && (
            <SelectedSale darkMode={darkMode} s={selectedSale}/>
          )}
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
                  className="mt-4 w-full px-4 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  {isLoadingCheckout ? "Traitement..." : <><FaCheck /> Valider la vente</>}
                </button>
              </div>
            </div>
          )} 
        </div>
      </div>
    </div>
  );
}