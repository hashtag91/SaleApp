import React from 'react';

export default function UserManagement({ users, onEdit, onDelete }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h2>

      <table className="min-w-full bg-white shadow-md rounded">
        <thead className="bg-gray-100 text-gray-700 text-sm">
          <tr>
            <th className="p-2">Nom</th>
            <th className="p-2">Rôle</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i} className="border-b text-sm">
              <td className="p-2">{u.name} {u.surname}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2 text-right space-x-2">
                <button onClick={() => onEdit(u)} className="text-blue-600 hover:underline">Modifier</button>
                <button onClick={() => onDelete(u)} className="text-red-600 hover:underline">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
