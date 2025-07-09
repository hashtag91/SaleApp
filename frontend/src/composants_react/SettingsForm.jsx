import React from 'react';

export default function SettingsForm({ formData, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Paramètres de l'entreprise</h2>

      <input type="text" name="name" placeholder="Nom" value={formData.name} onChange={onChange} required className="w-full border px-3 py-2 rounded" />
      <input type="text" name="adress" placeholder="Adresse" value={formData.adress} onChange={onChange} className="w-full border px-3 py-2 rounded" />
      <input type="text" name="phone" placeholder="Téléphone" value={formData.phone} onChange={onChange} className="w-full border px-3 py-2 rounded" />
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={onChange} className="w-full border px-3 py-2 rounded" />
      <input type="file" name="logo" onChange={onChange} className="w-full" />

      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">Enregistrer</button>
    </form>
  );
}
