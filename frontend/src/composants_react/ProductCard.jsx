import React from 'react';

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center">
      {product.image && (
        <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded mb-2" />
      )}
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-gray-500">Prix : {product.price} FCFA</p>
      <button
        onClick={() => onAddToCart(product)}
        className="mt-2 bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
      >
        Ajouter
      </button>
    </div>
  );
}