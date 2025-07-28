import React, { useEffect, useState } from 'react'
import {
  FaShoppingCart, FaBox, FaCreditCard, FaChartBar,
  FaCog, FaUserCircle
} from 'react-icons/fa'

export default function MobileDrawOpen({
  setMobileDrawerOpen, setView, loadProducts, loadSales,
  loadingAI, setShowSettings, settingsRetrieve, handleLogout,
  user, darkMode
}) {
  const [animate, setAnimate] = useState(false)

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
        <div className="p-4 border-b flex justify-between items-center border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold">Menu</h3>
          <button onClick={closeDrawer} className="text-gray-500 hover:text-black dark:hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex flex-col p-4 gap-3">
          <button onClick={() => { setView('pos'); closeDrawer() }} className="bg-indigo-600 text-white px-4 py-2 rounded">
            <FaShoppingCart className="inline-block mr-1" /> Caisse
          </button>
          <button onClick={() => { setView('admin'); loadProducts(); closeDrawer() }} className="bg-indigo-600 text-white px-4 py-2 rounded">
            <FaBox className="inline-block mr-1" /> Produits
          </button>
          <button onClick={() => { setView('sales'); loadSales(); closeDrawer() }} className="bg-indigo-600 text-white px-4 py-2 rounded">
            <FaCreditCard className="inline-block mr-1" /> Ventes
          </button>
          {user.role === 'admin' && (
            <button onClick={() => { setView('charts'); loadSales(); closeDrawer() }} className="bg-indigo-600 text-white px-4 py-2 rounded">
              <FaChartBar className="inline-block mr-1" /> Graphiques
            </button>
          )}
          {user.role === 'admin' && (
            <button
              onClick={() => { setView('analyse'); closeDrawer() }}
              disabled={loadingAI}
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              {loadingAI ? "Analyse en cours..." : "🔮 Analyse IA"}
            </button>
          )}
          <button
            onClick={() => { setView('settings'); closeDrawer(); setShowSettings(true); settingsRetrieve(); }}
            className='bg-gray-600 text-white px-4 py-2 rounded'>
            <FaCog className='inline-block mr-1' /> Paramètres
          </button>
          <button onClick={handleLogout} className='bg-red-600 text-white px-4 py-2 rounded'>
            Déconnexion
          </button>
        </div>

        {/* Footer user */}
        <div className='flex items-center justify-center p-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-slate-700'>
          <FaUserCircle className="mr-2" />
          {user?.name} {user?.surname}
        </div>
      </div>
    </div>
  )
}
