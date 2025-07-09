import React from 'react';

export default function ProductForm({ formData, setFormData, onSubmit, isEdit = false }) {
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({ ...formData, [name]: files ? files[0] : value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold">{isEdit ? 'Modifier' : 'Ajouter'} un produit</h2>

      <input type="text" name="name" placeholder="Nom" value={formData.name || ''} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
      <input type="text" name="sku" placeholder="SKU" value={formData.sku || ''} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
      <input type="number" name="price" placeholder="Prix de vente" value={formData.price || ''} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
      <input type="number" name="buy_price" placeholder="Prix d'achat" value={formData.buy_price || ''} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
      <input type="number" name="stock" placeholder="Stock" value={formData.stock || ''} onChange={handleChange} required className="w-full border px-3 py-2 rounded" />
      <input type="file" name="image" onChange={handleChange} className="w-full" />

      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">
        {isEdit ? 'Modifier' : 'Ajouter'}
      </button>
    </form>
  );
}
