import React, { useEffect, useState } from 'react'
import {
  FaShoppingCart, FaCog, FaLocationArrow, FaHome, FaTag, FaChevronRight, FaMoneyBill, FaChartArea, FaRobot
} from 'react-icons/fa'

export default function MobileDrawOpen({
  setMobileDrawerOpen, setView, loadProducts, loadSales,
  loadingAI, setShowSettings, settingsRetrieve, handleLogout,
  user, darkMode, view
}) {
  const [animate, setAnimate] = useState(false)
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  useEffect(() => {
    // Démarre l’animation d’ouverture après le montage
    setTimeout(() => setAnimate(true), 10)
  }, [])

  const closeDrawer = () => {
    // Lance l’animation de sortie
    setAnimate(false)
    setTimeout(() => setMobileDrawerOpen(false), 300)
  }

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeDrawer}
      />

      {/* Drawer animé */}
      <div className={`
        fixed right-0 top-0 z-50 w-64 h-full
        transform transition-transform duration-300 ease-in-out
        ${animate ? 'translate-x-0' : 'translate-x-full'}
        ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'}
        shadow-lg
      `}>
        <div className="p-4 border-b flex flex-col justify-top h-full items-left">
          <div className='flex justify-center items-center mb-3 gap-3'>
            <img
              src={`/static/uploads/logo/${user.logo}`}
              alt="logo"
              className="w-[45px] max-h-[45px] rounded"
            />
            <div>
              <h3 className={`font-bold text-sm text-black ${darkMode ? 'text-white' : ''}`}>{user?.entreprise}</h3>
              <p className="text-xs text-gray-500 flex gap-1">
                <FaLocationArrow />
                {user?.adresse}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
              view === 'dashboard' ? 'bg-gray-200 text-gray-700' : ''
            } ${darkMode ? 'text-gray-50' : 'text-gray-700'}`}
            onClick={() => { setView('dashboard'); closeDrawer() }}
          >
            <FaHome />
            <button >Tableau de bord</button>
          </div>
          <div
            className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
              view === 'pos' ? 'bg-gray-200 text-gray-700' : ''
            } ${darkMode ? 'text-gray-50' : 'text-gray-700'}`}
            onClick={() => { setView('pos'); closeDrawer() }}
          >
            <FaShoppingCart />
            <button >Caisse</button>
          </div>
          <div className={`flex flex-col gap-1 ${darkMode ? 'text-gray-50' : 'text-gray-700'}`}>
            <div
              className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${openMenu === 'stock' ? 'text-gray-700' : ''}`}
              onClick={() => toggleMenu('stock')}
            >
              <FaTag />
              <span className="flex-1">Stock</span>
              <FaChevronRight
                className={`text-sm transition-transform ${
                  openMenu === 'stock' ? 'rotate-90' : ''
                }`}
              />
            </div>

            <ul
              className={`overflow-hidden transition-all duration-300 max-h-0 opacity-0 pointer-events-none ${
                openMenu === 'stock'
                  ? 'max-h-40 opacity-100 pointer-events-auto'
                  : ''
              }`}
            >
              <li
                className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer ${
                  view === 'admin' ? 'bg-gray-200 text-gray-700' : ''
                }`}
                onClick={() => { setView('admin'); loadProducts(); closeDrawer() }}
              >
                Produits
              </li>
              <li
                className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer ${
                  view === 'category' ? 'bg-gray-200 text-gray-700' : ''
                }`}
                onClick={() => setView('category')}
              >
                Catégorie
              </li>
            </ul>
          </div>
          <div
            className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
              view === 'sales' ? 'bg-gray-200 text-gray-700' : ''
            } ${darkMode ? 'text-gray-50' : 'text-gray-700'}`}
            onClick={() => { setView('sales'); loadSales(); closeDrawer() }}
          >
            <FaMoneyBill />
            <button >Ventes</button>
          </div>
          {user.role === 'admin' && (
            <div
              className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                view === 'charts' ? 'bg-gray-200 text-gray-700' : ''
              } ${darkMode ? 'text-gray-50' : 'text-gray-700'}`}
              onClick={() => { setView('charts'); loadSales(); closeDrawer() }}
            >
              <FaChartArea />
              <button >statistique</button>
            </div>
          )}
          {user.role === 'admin' && (
            <div
              className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                view === 'analyse' ? 'bg-gray-200 text-gray-700' : ''
              } ${darkMode ? 'text-gray-50' : 'text-gray-700'}`}
              onClick={() => { setView('analyse'); closeDrawer() }}
              disabled={loadingAI}
            >
              <FaRobot />
              <button >
                {loadingAI ? "Analyse en cours..." : "Conseil IA"}
              </button>
            </div>
          )}

          <div className={`flex flex-col gap-1 ${darkMode ? 'text-gray-50' : 'text-gray-700'}`}>
            <div
                className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${openMenu === 'setting' ? 'text-gray-700' : ''}`}
                onClick={() => toggleMenu('setting')}
            >
                <FaCog />
                <span className="flex-1">Pametres</span>
                <FaChevronRight
                className={`text-sm transition-transform ${
                    openMenu === 'setting' ? 'rotate-90' : ''
                }`}
                />
            </div>
    
            <ul
                className={`overflow-hidden transition-all duration-300 max-h-0 opacity-0 pointer-events-none ${
                openMenu === 'setting'
                    ? 'max-h-40 opacity-100 pointer-events-auto'
                    : ''
                }`}
            >
                <li
                className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer ${
                    view === 'profil' ? 'bg-gray-200 text-gray-700' : ''
                }`}
                onClick={() => { setView('profil'); closeDrawer(); setShowSettings(true); settingsRetrieve(); }}
                >
                Profil
                </li>
                {user.role === 'admin' &&
                    <li
                    className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer ${
                        view === 'employe' ? 'bg-gray-200 text-gray-700' : ''
                    }`}
                    onClick={() => {setView('employees'); closeDrawer(); setShowSettings(true); settingsRetrieve();}}
                    >
                    Employés
                    </li>
                }
                <li
                className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer ${
                    view === 'about' ? 'bg-gray-200 text-gray-700' : ''
                }`}
                onClick={() => setView('about')}
                >
                A propos
                </li>
            </ul>
          </div>
          <button onClick={handleLogout} className='bg-red-600 text-white px-4 py-2 rounded'>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  )
}
