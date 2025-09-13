import React from "react";
import { useState } from 'react';
import { FaTrash, FaPlus } from "react-icons/fa";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

export default function Categories({ categories, setCategories, darkMode, loadCategories }) {
  const [addPopup, setAddPopup] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" des catégories ?`)) return;

    try {
      await axios.delete(`/api/category/${id}`);
      toast.success(`"${name}" supprimé !`);

      // Supprime l'élément côté frontend sans recharger toute la liste
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      toast.error(error.response?.data?.error || "Erreur serveur");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      return toast.error("Veuillez saisir une catégorie.");
    }

    try {
      const res = await axios.post('/api/category', {category: newCategory} );
      toast.success(res.data.message);
      loadCategories();
      setAddPopup(false);
      setNewCategory('');
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.error || 'Erreur lors de l\'ajout');
    }

  }

  return (
    <div className={`relative w-full h-full flex flex-col justify-start items-center p-4 overflow-auto ${darkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
      <div className="flex w-full justify-between items-center mb-4">
        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' :'text-gray-800'}`}>Catégories</h3>
        <button 
          className={`hidden sm:flex justify-center items-center rounded-lg text-white bg-blue-600 hover:bg-blue-700 p-2`}
          onClick={() => setAddPopup(true)}
        >
            Créer une catégorie
        </button>
        <button 
          className={`flex sm:hidden justify-center items-center rounded-lg text-white bg-blue-600 hover:bg-blue-700 p-2`}
          onClick={() => setAddPopup(true)}
        >
            <FaPlus className="text-white" />
        </button>
      </div>
      <ul className={`w-full md:w-2/3 lg:w-1/2 xl:w-2/3 flex flex-col gap-4 rounded-lg p-3 ${darkMode ? 'bg-slate-800' :'bg-white'}`}>
        {categories.map((c) => (
          <li
            key={c.id}
            className={`flex items-center justify-between p-2 border-b transition-transform transform hover:scale-[1.02] ${
              darkMode
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            <p className="text-sm font-semibold">{c.category}</p>
            <button
              className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition"
              onClick={() => handleDelete(c.id, c.category)}
            >
              <FaTrash className="text-red-500" size={15} />
            </button>
          </li>
        ))}
      </ul>
      {addPopup && (
        <div
          className="fixed inset-0 bg-black/40 flex justify-center items-start p-4 z-50"
          onClick={() => setAddPopup(false)} // clic sur overlay ferme
        >
          <div
            className={`w-full max-w-md bg-white rounded-lg p-5 gap-4 shadow-lg`}
            onClick={(e) => e.stopPropagation()}
          >
            <label
              htmlFor="category"
              className="text-gray-800 font-bold mb-1"
            >
              Nouvelle catégorie
            </label>

            <input
              type="text"
              name="category"
              id="category"
              value={newCategory} // ⚡ lié au state
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Saisissez la nouvelle catégorie"
              className="p-2 rounded-lg w-full border border-gray-300 bg-gray-50 text-gray-900 
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center gap-3 mt-4">
              <button
                className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 p-2 text-white"
                onClick={handleAddCategory}
              >
                Enregistrer
              </button>
              <button
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 p-2 text-white"
                onClick={() => setAddPopup(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
