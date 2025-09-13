import React from 'react';
import { useState, useEffect } from 'react';
import SelectedProduct from './SelectedProduct';
import axios from 'axios';
import { FaEdit, FaTrash, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';

export default function Stock({ darkMode, user, products, stockFilter, setStockFilter, 
        categories, filteredProducts, loadProducts, setProducts, setSearchTerm, searchTerm,
        editedProduct, setEditedProduct, editProduct, setEditProduct, productPage, setProductPage}) 
    {

    const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', buy_price: '', stock: 0, alert: 5, image: null, category: ''});
    const ruptureStock = products.filter(p => p.stock === 0).length;
    const stockFaible = products.filter(p => p.stock > 0 && p.stock <= p.alert).length;
    const stockOk = products.filter(p => p.stock > p.alert).length;

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
        setNewProduct({ name: '', sku: '', price: '', buy_price: '', stock: 0, alert: 0, image: null,  });
        loadProducts();
        setProductPage('products');
    };

    const handleProductChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
        setNewProduct(prev => ({ ...prev, image: files[0] }));
        } else {
        setNewProduct(prev => ({ ...prev, [name]: value }));
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
            setProductPage('products');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEditProduct = (product) => {
        setEditProduct(product.id);
        setEditedProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        buy_price: product.buy_price,
        stock: product.stock,
        category: product.category,
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

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Supprimer ce produit ?')) return;
        await axios.delete(`/api/products/${id}`);
        loadProducts();
    };

    return (
        <div className='p-2'>
            {productPage === 'addProduct' && (
                <div className="w-full flex flex-col justify-start items-center">
                    <div className='w-full flex justify-start items-center py-2'>
                        <button
                            className='bg-transparent cursor-pointer flex items-center gap-2'
                            onClick={() => {setProductPage('products'); setEditProduct(null)}}
                        >
                            <FaArrowLeft className={darkMode ? 'text-white' :'text-gray-800'} />
                            <span className={darkMode ? 'text-white' :'text-gray-800'}>Retour</span>
                        </button>
                    </div>
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative overflow-y-auto max-h-full rounded-xl">
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
                            <div>
                            <div className='mb-4'>
                            <label htmlFor='category' className="block text-sm font-medium text-gray-700">Catégorie</label>
                            <select 
                                name="category" 
                                id="category" 
                                className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                                //onChange={(e) => setEmployeesFormData({...employeesFormData, role: e.target.value})}
                            >
                                <option value='defaut'>Defaut</option>
                                {categories.map((c) => (
                                <option value={c.category}>{c.category}</option>
                                ))}
                            </select>
                            </div>
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
                            <button type="submit" className="w-full flex-1 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                Ajouter le produit
                            </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {productPage === 'editProduct' && (
                <div className="w-full flex flex-col justify-start items-center">
                    <div className='w-full flex justify-start items-center p-2'>
                        <button
                            className='bg-transparent cursor-pointer flex items-center gap-2'
                            onClick={() => {setProductPage('products'); setEditProduct(null)}}
                        >
                            <FaArrowLeft className={darkMode ? 'text-white' :'text-gray-800'} />
                            <span className={darkMode ? 'text-white' :'text-gray-800'}>Retour</span>
                        </button>
                    </div>
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative rounded-xl">

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
                            <div className='mb-2'>
                                <label htmlFor='category' className="block text-sm font-medium text-gray-700">Catégorie</label>
                                <select 
                                    name="category" 
                                    id="category" 
                                    className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                                    onChange={handleEditChange}
                                    value={editedProduct.category}
                                >
                                    {categories.map((c) => (
                                        <option value={c.category}>{c.category}</option>
                                    ))}
                                </select>
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
                            <button type="submit" className="w-full flex-1 p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                                Enregistrer les modifications
                            </button>
                            </div>
                        </form>
                    </div>
                </div>
            
            )}
            {productPage === 'products' && (
            <>
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
                <h2 className={`text-2xl font-bold mb-4 text-gray-800 ${darkMode ? 'text-white' : ''}`}>Stock</h2>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    {user.role === 'admin' &&
                        <button onClick={() => setProductPage('addProduct')} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
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
                        <option value="low">🟡 Stock faible</option>
                        <option value="ok">⚪ Stock suffisant</option>
                        {categories.map((c) => <option value={c.category}>{c.category}</option>)}
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
                <table 
                className={`hidden sm:table min-w-full border border-gray-300 rounded-lg overflow-x-scroll 
                    ${darkMode ? "text-white border-gray-700" : ""}`}
                >
                    <thead className={`${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                        {user.role === 'admin' && (<tr>
                        {["Image", "Nom", "SKU", "Prix d'achat", "Prix vente", "Categorie", "Quantité", "Qty Alert", "Statut", "Actions"].map((head) => (
                            <th
                            key={head}
                            className={`px-6 py-3 text-left uppercase text-xs font-semibold tracking-wide
                                ${darkMode 
                                ? "text-gray-200 border-b border-gray-700" 
                                : "text-gray-700 border-b border-gray-300"}`
                            }
                            >
                            {head}
                            </th>
                        ))}
                        </tr>)}
                        {user.role !== 'admin' && (<tr>
                        {["Image", "Nom", "SKU", "Prix d'achat", "Prix de vente", "Categorie", "Quantité", "Qty Alert", "Statut"].map((head) => (
                            <th
                            key={head}
                            className={`px-6 py-3 text-left uppercase text-xs font-semibold tracking-wide
                                ${darkMode 
                                ? "text-gray-200 border-b border-gray-700" 
                                : "text-gray-700 border-b border-gray-300"}`
                            }
                            >
                            {head}
                            </th>
                        ))}
                        </tr>)}
                    </thead>

                    <tbody>
                        {filteredProducts.map((p) => (
                        <tr
                            key={p.sku}
                            className={`transition-colors ${
                            darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                            }`}
                        >
                            {/* Image */}
                            <td className={`px-6 py-4 text-sm border-b ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                            <img 
                                src={p.imageUrl || "/placeholder.png"} 
                                width={40} height={40} 
                                className="rounded object-cover" 
                                alt={p.name} 
                            />
                            </td>

                            {/* Infos produit */}
                            <td className="px-4 py-4 text-sm border-b">{p.sku}</td>
                            <td className="px-4 py-4 text-sm font-bold border-b">{p.name}</td>

                            {/* Prix */}
                            <td className="px-4 py-4 text-sm border-b">{p.buy_price} FCFA</td>
                            <td className="px-4 py-4 text-sm border-b">{p.price} FCFA</td>

                            {/* Catégorie */}
                            <td className="px-4 py-4 text-sm border-b text-center">{p.category}</td>

                            {/* Stock */}
                            <td className="px-4 py-4 text-sm border-b text-center">{p.stock}</td>
                            <td className="px-4 py-4 text-sm border-b text-center">{p.alert}</td>

                            {/* Statut */}
                            <td className="px-4 py-4 text-sm border-b">
                            {p.stock === 0 ? (
                                <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded">
                                Épuisé
                                </span>
                            ) : p.stock <= p.alert ? (
                                <span className="inline-block px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-300 rounded">
                                Stock bas
                                </span>
                            ) : (
                                <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
                                En stock
                                </span>
                            )}
                            </td>

                            {/* Actions */}
                            {user.role === 'admin' && (<td className={`px-4 py-4 text-sm border-b min-w-[100px]`}>
                            <div className="flex items-center gap-2">
                                <button 
                                className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 shadow-sm" 
                                onClick={() => {handleEditProduct(p); setProductPage('editProduct')}}
                                >
                                    <FaEdit className="text-white" />
                                </button>
                                <button 
                                className="p-2 bg-red-500 rounded-lg hover:bg-red-600 shadow-sm" 
                                onClick={() => handleDeleteProduct(p.id)}
                                >
                                    <FaTrash className="text-white" />
                                </button>
                            </div>
                            </td>)}
                        </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex flex-col sm:hidden flex-1 gap-3">
                    {filteredProducts.map((p) => (
                        <div
                        key={p.sku}
                        className={`p-3 rounded-xl shadow-md transition-all duration-200 ${darkMode ? 'bg-slate-700' :''}`}
                        onClick={() => {handleEditProduct(p); setProductPage('mobileEditProduct')}}
                        >
                        <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                            <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                            />
                            ) : (
                            <div className="w-14 h-14 flex items-center justify-center bg-gray-300 text-xs text-gray-700 rounded-lg">
                                Pas d'image
                            </div>
                            )}

                            <div className="flex-1">
                            <h3
                                className={`font-semibold text-sm text-gray-800 ${darkMode ? 'text-white/80' :''}`}
                            >
                                {p.name}
                            </h3>
                            <p className="text-xs text-gray-500">Sku: {p.sku}</p>

                            <div className="mt-1 flex justify-between items-center text-sm">
                                <p className="font-bold">Qté: {p.stock}</p>
                                <p className={`font-bold ${darkMode ? 'text-white/80' :''}`}>{p.price} FCFA</p>
                            </div>
                            </div>
                        </div>

                        {/* Badge dynamique de stock */}
                        <div className="mt-2">
                            {p.stock === 0 ? (
                            <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-700 rounded">
                                Épuisé
                            </span>
                            ) : p.stock <= p.alert ? (
                            <span className="inline-block px-2 py-1 text-xs font-semibold text-black bg-yellow-300 rounded">
                                Stock bas
                            </span>
                            ) : (
                            <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
                                En stock
                            </span>
                            )}
                        </div>
                        </div>
                    ))}
                </div>
            </>)}
            {productPage === 'mobileEditProduct' && (
                <SelectedProduct 
                    darkMode={darkMode} 
                    editedProduct={editedProduct} 
                    setEditProduct={setEditProduct} 
                    handleEditChange={handleEditChange} 
                    submitEditProduct={submitEditProduct} 
                    loadProducts={loadProducts}
                    editProduct={editProduct}
                    setProductPage={setProductPage}
                    categories={categories}
                />
            )}
            <ToastContainer />
        </div>
    )
}