import React from 'react';

export default function CartDrawer({ cart, onRemove, onCheckout }) {
  return (
    <div className="bg-white w-full p-4 rounded-t-xl shadow-md max-h-[60vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Panier</h2>
      {cart.length === 0 ? (
        <p className="text-gray-500">Aucun article dans le panier.</p>
      ) : (
        <ul className="space-y-2">
          {cart.map((item, index) => (
            <li key={index} className="flex justify-between items-center border-b py-2">
              <div>
                <p className="font-medium">{item.name}</p>
                <small className="text-gray-500">x{item.quantity}</small>
              </div>
              <button onClick={() => onRemove(index)} className="text-red-500">Supprimer</button>
            </li>
          ))}
        </ul>
      )}
      {cart.length > 0 && (
        <button onClick={onCheckout} className="w-full mt-4 bg-green-600 text-white py-2 rounded-md">
          Valider la vente
        </button>
      )}
    </div>
  );
}