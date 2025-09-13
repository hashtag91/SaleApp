import React from "react";
import { ToastContainer } from "react-toastify";

export default function SelectedSale({s, darkMode}) {

    // Si s.items est un JSON stringifié
    let items = [];
    try {
        items = typeof s.items === 'string' ? JSON.parse(s.items) : s.items;
    } catch (e) {
        console.error('Erreur parsing items:', e);
        items = [];
    }

    return (
        <div className="flex-1 overflow-auto space-y-6 flex-1 flex-col">
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
            <ToastContainer />
        </div>
    )
}