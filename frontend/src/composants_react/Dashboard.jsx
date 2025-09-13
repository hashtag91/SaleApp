import React, { useState, useEffect } from 'react';
import { FaChartBar, FaShoppingCart, FaBox, FaUser, FaCog } from 'react-icons/fa';
import axios from 'axios';
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  Area,
  AreaChart
} from "recharts";
import { toast, ToastContainer } from 'react-toastify';

export default function Dashboard({ sales, loadSales, products, darkMode, setEditedProduct, setEditProduct, setProductPage, setView }) {
  const [previsionMoyenne, setPrevisionMoyenne] = useState([]);
  const [chartData1, setChartData1] = useState([]);
  const [chartButton, setChartButton] = useState('Jours');
  const [lastSales, setLastSales] = useState([]);
  const [chiffreAffaires, setChiffreAffaires] = useState(0);
  const [dailySale, setDailySale] = useState(0);
  const [nombreProduitsReappro, setNombreProduitsReappro] = useState(products.filter((p) => p.stock <= p.alert).length);
  const [bestSeller, setBestSeller] = useState(null);

  const loadChartData = async (label='Jours') => {
    if (label === 'Jours') {
      const res = await axios.get(`/api/ventes-7-jours`);
      setChartData1(res.data);
    } else if (label === 'Semaine') {
      const res = await axios.get(`/api/weekly-sales`);
      setChartData1(res.data);
      console.log(res.data);
    } else if (label === 'Mois') {
      const res = await axios.get(`/api/monthly-sales`);
      setChartData1(res.data);
      console.log(res.data);
    } else if (label === 'Année') {
      const res = await axios.get(`/api/annual-sales`);
      setChartData1(res.data);
      console.log(res.data);
    }
  };

  const loadWeeklySales = async () => {
    const res = await axios.get(`/api/weekly-sales`);
    setChartData1(res.data);
  };

  const loadBestSeller = async () => {
    const res = await axios.get(`/api/best_seller`);
    setBestSeller(res.data);
  };

  useEffect(() => {
    const ca = sales.reduce((total, s) => {
    let items = [];
    try {
        items = typeof s.items === "string" ? JSON.parse(s.items) : s.items;
    } catch (e) {
        items = [];
    }
    return total + items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    }, 0);

    setChiffreAffaires(ca);

    const ventesDuJour = sales.reduce((total, s) => {
        const today = new Date().toLocaleDateString("fr-FR"); 
        const venteDate = new Date(s.date).toLocaleDateString("fr-FR");

        if (venteDate === today) {
            let items = [];
            try {
            items = typeof s.items === "string" ? JSON.parse(s.items) : s.items;
            } catch (e) {
            items = [];
            }
            total += items.reduce((sum, i) => sum + (i.price * i.qty), 0);
        }
        return total;
        }, 0);
    
    setDailySale(ventesDuJour);

    setLastSales(sales.slice(0,5));
    loadBestSeller();
  }, [sales])

  const kpis = [
    {
      title: "Chiffre d'affaires",
      value: `${chiffreAffaires.toFixed(0)} FCFA`,
      icon: <FaChartBar size={20} />,
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      title: "Ventes d'aujourd'hui",
      value: `${dailySale.toFixed(0)} FCFA`,
      icon: <FaShoppingCart size={20} />,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Produits à réapprovisionner",
      value: nombreProduitsReappro,
      icon: <FaBox size={20} />,
      gradient: "from-orange-400 to-red-500",
    },
    {
      title: "Top vendeur",
      value: bestSeller ? bestSeller.seller : "Aucun vendeur",
      icon: <FaUser size={20} />,
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/prevision-moyenne');
        if (res.data) {
          const chartData = Object.entries(res.data).map(([sku, qty]) => ({
            sku,
            qty
          }));
          loadChartData();
          setPrevisionMoyenne(chartData);
          loadSales();
          loadBestSeller();
        }
      } catch (err) {
        toast.error("Erreur lors de la récupération des prévisions :", err);
      }
    };

    fetchData();
    loadSales();
    loadBestSeller();
  }, []);

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
        category: product.category || '',
        image: null,
        });
    };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((card, idx) => (
          <div
            key={idx}
            className={`flex items-center p-4 rounded-2xl shadow hover:shadow-xl transition-all duration-300 border 
              ${darkMode
                ? "bg-slate-800 border-slate-700 text-gray-200"
                : "bg-white/80 border-gray-100 text-gray-800"}`}
          >
            <div className={`p-3 rounded-full bg-gradient-to-tr ${card.gradient} text-white shadow-md`}>
              {card.icon}
            </div>
            <div className="ml-4">
              <h3 className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {card.title}
              </h3>
              <h2 className="text-lg font-bold">{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Ventes quotidiennes */}
        <div
          className={`flex-1 p-4 rounded-2xl shadow border transition 
            ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between mb-4">
            <h2
              className={`text-base font-semibold mb-4 ${
                darkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Statistiques
            </h2>

            {/* Boutons période */}
            <div className="flex flex-wrap gap-2 items-center">
              {["Jours", "Semaine", "Mois", "Année"].map((label, i) => (
                <button
                  key={i}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-medium shadow-sm transition
                    ${
                      chartButton === label
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }
                  `}
                  onClick={() => {
                    setChartButton(label);
                    loadChartData(label);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={chartData1}
              margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? "#444" : "#f0f0f0"}
              />
              <XAxis
                dataKey="day"
                stroke={darkMode ? "#aaa" : "#555"}
                tick={{ fontSize: 12, fill: darkMode ? "#ddd" : "#333" }}
              />
              <YAxis
                stroke={darkMode ? "#aaa" : "#555"}
                tick={{ fontSize: 12, fill: darkMode ? "#ddd" : "#333" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? "#1e293b" : "#ffffffcc",
                  color: darkMode ? "#f1f5f9" : "#111",
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              />
              <Area
                type="monotone"
                dataKey="ventes"
                stroke="#14b8a6"
                strokeWidth={3}
                fill="url(#lineGradient)"
                dot
              />
            </AreaChart>
          </ResponsiveContainer>

        </div>

        {/* Prévision pour demain */}
        <div className={`flex-1 p-4 rounded-2xl shadow border transition 
          ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            Prévision pour demain
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={previsionMoyenne}>
              <defs>
                <linearGradient id="barGradientDynamic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#f0f0f0"} />
              <XAxis dataKey="sku" stroke={darkMode ? "#aaa" : "#555"} tick={{ fontSize: 12, fill: darkMode ? "#ddd" : "#333" }} />
              <YAxis stroke={darkMode ? "#aaa" : "#555"} tick={{ fontSize: 12, fill: darkMode ? "#ddd" : "#333" }} />
              <Tooltip contentStyle={{
                backgroundColor: darkMode ? "#1e293b" : "#ffffffcc",
                color: darkMode ? "#f1f5f9" : "#111"
              }} />
              <Bar dataKey="qty" radius={[6, 6, 0, 0]} fill="url(#barGradientDynamic)">
                <LabelList dataKey="qty" position="top" fill={darkMode ? "#ddd" : "#333"} fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ventes récentes + Produits à réapprovisionner */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Ventes récentes */}
        <div className={`flex-1 p-4 rounded-2xl shadow border max-h-[400px] overflow-auto 
          ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            Dernières ventes
          </h2>
          <table className="min-w-full text-sm sm:text-base border-collapse">
            <thead className={`${darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-50 text-gray-600"}`}>
              <tr>
                <th className="p-2 sm:p-3 border-b text-left text-sm">Date</th>
                <th className="p-2 sm:p-3 border-b text-left text-sm">Heure</th>
                <th className="p-2 sm:p-3 border-b text-left text-sm">Produit</th>
                <th className="p-2 sm:p-3 border-b text-left text-sm">Qté</th>
                <th className="p-2 sm:p-3 border-b text-left text-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {lastSales
                .flatMap((s) => {
                  let items = [];
                  try {
                    items = typeof s.items === "string" ? JSON.parse(s.items) : s.items;
                  } catch (e) {
                    console.error("Erreur parsing items:", e);
                    items = [];
                  }
                  const dateTime = new Date(s.date).toLocaleString("fr-FR");
                  const [date, heure] = dateTime.split(" ");
                  return items.map((item, idx) => ({
                    id: `${s.id}-${idx}`,
                    date,
                    heure,
                    ...item,
                  }));
                })
                .slice(0, 5)
                .map((row) => (
                  <tr key={row.id} className={`${darkMode ? "hover:bg-slate-700" : "hover:bg-gray-50"} transition`}>
                    <td className={`p-2 sm:p-3 border-b text-sm ${darkMode ? 'text-gray-300' :''}`}>{row.date}</td>
                    <td className={`p-2 sm:p-3 border-b text-sm ${darkMode ? 'text-gray-300' :''}`}>{row.heure}</td>
                    <td className={`p-2 sm:p-3 border-b text-sm ${darkMode ? 'text-gray-300' :''}`}>{row.name}</td>
                    <td className={`p-2 sm:p-3 border-b text-sm ${darkMode ? 'text-gray-300' :''}`}>{row.qty}</td>
                    <td className="p-2 sm:p-3 border-b text-sm font-medium text-teal-600">{Number(row.price).toFixed(0)} fcfa</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Produits à réapprovisionner */}
        <div className={`flex flex-col p-2 rounded-2xl shadow border overflow-x-auto max-h-[400px] overflow-auto 
          ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            Produits à réapprovisionner
          </h2>
          <div className="space-y-4">
            {products
              .filter((p) => p.stock <= p.alert)
              .map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 p-2 rounded shadow-md hover:shadow-lg transition-all duration-300 border cursor-pointer
                    ${darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-red-200"}`}
                    onClick={() => {handleEditProduct(p); setView('admin'); setProductPage('editProduct')}}
                >
                  <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h3 className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{p.name}</h3>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Stock :{" "}
                      <span className="font-bold text-red-600">{p.stock}</span> /{" "}
                      <span className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>{p.alert}</span>
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
