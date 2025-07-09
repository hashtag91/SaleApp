import React from 'react';

export default function SalesTable({ sales }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 rounded">
        <thead>
          <tr className="bg-gray-100 text-left text-sm">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Client</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Détails</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{new Date(sale.created_at).toLocaleString()}</td>
              <td className="px-4 py-2">{sale.client || 'N/A'}</td>
              <td className="px-4 py-2">{sale.total} FCFA</td>
              <td className="px-4 py-2">
                <details>
                  <summary className="text-blue-600 cursor-pointer">Voir</summary>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {(typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items).map((item, i) => (
                      <li key={i}>{item.name} x{item.quantity}</li>
                    ))}
                  </ul>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}