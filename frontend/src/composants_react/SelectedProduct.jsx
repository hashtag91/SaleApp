import React from "react";
import { useState, useEffect } from 'react';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SelectedProduct({darkMode, editedProduct, setEditProduct, handleEditChange, submitEditProduct, setView, loadProducts, editProduct}) {
    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Supprimer ce produit ?')) return;
        await axios.delete(`/api/products/${id}`);
        loadProducts();
        setView('admin');
        setEditProduct(null);
        toast.success("Produit supprimé !")
    };
    return (
        <div className={`flex-1 flex-col justify-center items-center p-4 ${darkMode ? 'bg-slate-800' :''}`}>
            <div
                className="w-full flex justify-between items-center"
            >
                <button
                    className="bg-transparent"
                    onClick={() => {setView('admin'), setEditProduct(null)}}
                >
                    <FaArrowLeft className={`${darkMode ? 'text-white' :'text-gray-800'}`} size={20}/>
                </button>
                <button
                    className="bg-transparent"
                    onClick={() => {handleDeleteProduct(editProduct)}}
                >
                    <FaTrash color="red" size={20}/>
                </button>
            </div>

            <h3 className={`text-xl font-semibold my-3 ${darkMode ? 'text-white' :''}`}>Modifier le produit</h3>
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
                <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition"
                >
                    Enregistrer les modifications
                </button>
                </div>
            </form>
            <ToastContainer />
        </div>
    )
}