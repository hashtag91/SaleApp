import React from 'react';

export default function LoginForm({ username, setUsername, password, setPassword, onSubmit, switchToRegister }) {
  return (
    <form onSubmit={onSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
      <h2 className="text-2xl font-bold text-center text-gray-800">Connexion</h2>
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 block w-full px-4 py-2 border rounded-md"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full px-4 py-2 border rounded-md"
        />
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md">Valider</button>
      <button type="button" onClick={switchToRegister} className="w-full mt-2 text-indigo-600 text-center">Créer un compte</button>
    </form>
  );
}