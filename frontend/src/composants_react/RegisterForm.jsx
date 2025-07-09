import React from 'react';

export default function RegisterForm({
  name, setName, surname, setSurname, entreprise, setEntreprise,
  adress, setAdress, phone, setPhone, email, setEmail,
  username, setUsername, password, setPassword, logo, setLogo,
  onSubmit, switchToLogin, errors = {}
}) {
  return (
    <form onSubmit={onSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
      <h2 className="text-2xl font-bold text-center text-gray-800">Inscription</h2>
      <div>
        <label className="block text-sm">Prénom</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border px-3 py-2 rounded" required />
      </div>
      <div>
        <label className="block text-sm">Nom</label>
        <input type="text" value={surname} onChange={e => setSurname(e.target.value)} className="w-full border px-3 py-2 rounded" required />
      </div>
      <div>
        <label className="block text-sm">Entreprise</label>
        <input type="text" value={entreprise} onChange={e => setEntreprise(e.target.value)} className="w-full border px-3 py-2 rounded" />
      </div>
      <div>
        <label className="block text-sm">Adresse</label>
        <input type="text" value={adress} onChange={e => setAdress(e.target.value)} className="w-full border px-3 py-2 rounded" />
      </div>
      <div>
        <label className="block text-sm">Téléphone</label>
        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
      </div>
      <div>
        <label className="block text-sm">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm">Nom d'utilisateur</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
      </div>
      <div>
        <label className="block text-sm">Mot de passe</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
      </div>
      <div>
        <label className="block text-sm">Logo (optionnel)</label>
        <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} className="w-full" />
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md">Valider</button>
      <button type="button" onClick={switchToLogin} className="w-full mt-2 text-indigo-600 text-center">J'ai déjà un compte</button>
    </form>
  );
}