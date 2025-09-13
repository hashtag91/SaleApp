'use client';
import React, { useState } from 'react';
import {
  FaShoppingCart,
  FaTag,
  FaMoneyBill,
  FaChartArea,
  FaRobot,
  FaChevronRight,
  FaCog,
  FaHome,
  FaLocationArrow,
  FaHeadset,
} from 'react-icons/fa';

export default function MenuLateral({ user, setView, view, loadProducts, loadingAI, loadSales, openMenu1,  settingsRetrieve}) {

  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <>
    <div className={`${openMenu1 ? 'w-[250px]' : 'w-0'} transition-all duration-300 ease-in-out flex-shrink-0 bg-white shadow py-2 overflow-y-auto hidden sm:flex sm:flex-col`}>
        <div className="flex justify-center items-center mb-3">
        <img
            src={`/static/uploads/logo/${user.logo}`}
            alt="logo"
            className="w-[60px] h-[60px] rounded"
        />
        <div>
            <h3 className="font-bold text-sm text-black">{user?.entreprise}</h3>
            <p className="text-xs text-gray-500 flex gap-1">
            <FaLocationArrow />
            {user?.adresse}
            </p>
        </div>
        </div>
        {user.role === 'admin' &&
            <div
                className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                    view === 'dashboard' ? 'bg-gray-200' : ''
                }`}
                onClick={() => setView('dashboard')}
            >
                <FaHome className="text-gray-700" />
                <button className="text-gray-700">Tableau de bord</button>
            </div>
        }
        <div
        className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
            view === 'pos' ? 'bg-gray-200' : ''
        }`}
        onClick={() => {setView('pos')}}
        >
        <FaShoppingCart className="text-gray-700" />
        <button className="text-gray-700">Caisse</button>
        </div>
        <div className={`flex flex-col gap-1`}>

        <div
            className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer`}
            onClick={() => toggleMenu('stock')}
        >
            <FaTag className="text-gray-700" />
            <span className="flex-1 text-gray-700">Stock</span>
            <FaChevronRight
                className={`text-gray-700 text-sm transition-transform ${
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
            className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer text-gray-700 ${
                view === 'admin' ? 'bg-gray-200' : ''
            }`}
            onClick={() => { setView('admin'); loadProducts();}}
            >
            Produits
            </li>
            {user.role === 'admin' && (<li
            className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer text-gray-700 ${
                view === 'categories' ? 'bg-gray-200' : ''
            }`}
            onClick={() => {setView('categories')}}
            >
            Catégories
            </li>)}
        </ul>
        </div>
        <div
        className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
            view === 'sales' ? 'bg-gray-200' : ''
        }`}
        onClick={() => { setView('sales'); loadSales();}}
        >
        <FaMoneyBill className="text-gray-700" />
        <button className="text-gray-700">Ventes</button>
        </div>
        {user.role === 'admin' && 
            <div
            className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                view === 'charts' ? 'bg-gray-200' : ''
            }`}
            onClick={() => {
                setView('charts');
                loadSales();
            }}
            >
                <FaChartArea className="text-gray-700" />
                <button className="text-gray-700">statistique</button>
            </div>
        }
        {user.role === 'admin' &&
            <div
                className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                    view === 'analyse' ? 'bg-gray-200' : ''
                }`}
                onClick={() => {setView('analyse');}}
                disabled={loadingAI}
            >
                <FaRobot className="text-gray-700" />
                <button className="text-gray-700 flex gap-2">
                    {loadingAI ? (
                        "Analyse en cours..."
                    ) : (
                        <>
                        Analyse IA <div className='w-5 h-5 rounded-full bg-red-600 flex justify-center items-center'><span className='text-white'>{user.tokens_conseil}</span></div>
                        </>
                    )}
                </button>
            </div>
        }
        <div className={`flex flex-col gap-1`}>
        <div
            className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer`}
            onClick={() => toggleMenu('setting')}
        >
            <FaCog className="text-gray-700" />
            <span className="flex-1 text-gray-700">Pametres</span>
            <FaChevronRight
            className={`text-gray-700 text-sm transition-transform ${
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
            className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer text-gray-700 ${
                view === 'profil' ? 'bg-gray-200' : ''
            }`}
            onClick={() => {setView('profil'); settingsRetrieve()}}
            >
            Profil
            </li>
            {user.role === 'admin' &&
                <li
                className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer text-gray-700 ${
                    view === 'employees' ? 'bg-gray-200' : ''
                }`}
                onClick={() => {setView('employees')}}
                >
                    Employés
                </li>
            }
            <li
            className={`px-10 py-1 hover:bg-gray-100 text-sm cursor-pointer text-gray-700 ${
                view === 'about' ? 'bg-gray-200' : ''
            }`}
            onClick={() => {setView('about')}}
            >
            A propos
            </li>
        </ul>
        </div>
        {user.role === 'admin' &&
            <div
                className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                    view === 'support' ? 'bg-gray-200' : ''
                }`}
                onClick={() => setView('support')}
            >
                <FaHeadset className="text-gray-700" />
                <button className="text-gray-700">Service client</button>
            </div>
        }
    </div>
    </>
  );
}
