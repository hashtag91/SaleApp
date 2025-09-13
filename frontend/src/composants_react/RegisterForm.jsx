import React from 'react';
import { ToastContainer, toast } from 'react-toastify';

export default function RegisterForm({ setName, setSurname, setEntreprise, setAdress, setPhone, setEmail, setUsername, setPassword, setLogo, handleRegister, setShowRegister, darkMode}) {
  return (
    <form
      onSubmit={handleRegister}
      className={`${darkMode ? 'bg-gray-900' : 'bg-white'} p-8 rounded-lg shadow-md w-full max-w-sm space-y-4`}
    >
      <h2 className={`${darkMode ? 'text-white' : 'text-gray-800'} text-2xl font-bold text-center`}>
        Inscription
      </h2>

      <div>
        <label htmlFor="name" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
          Prénom
        </label>
        <input 
          type="text"
          name="name"
          id="name"
          placeholder="Nom"
          required
          onChange={(e) => setName(e.target.value)} 
          className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`} 
        />
      </div>
      <div>
        <label htmlFor="surname" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
          Nom
        </label>
        <input 
          type="text"
          name="surname"
          id="surname"
          placeholder="Prénom" 
          required 
          onChange={(e) => setSurname(e.target.value)} 
          className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`} 
        />
      </div>
      <div>
        <label htmlFor="entreprise" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
          Entreprise
        </label>
        <input 
          type="text"
          name="entreprise"
          id="entreprise"
          placeholder="Nom de l'entreprise" 
          onChange={(e) => setEntreprise(e.target.value)} 
          className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`} 
        />
      </div>
      <div>
        <label htmlFor="adresse" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
          Adresse
        </label>
        <input 
          type="text"
          name="adresse"
          id="adresse"
          placeholder="Adresse de l'entreprise" 
          onChange={(e) => setAdress(e.target.value)} 
          className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`} 
        />
      </div>
      <div>
        <label htmlFor="phone" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
          Téléphone
        </label>
        <input 
          type="text"
          name="phone"
          id="phone"
          placeholder="Téléphone" 
          required 
          onChange={(e) => setPhone(e.target.value)} 
          className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`} 
        />
      </div>
      <div>
        <label htmlFor="email" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
          Email
        </label>
        <input 
          type="email"
          name="email"
          id="email"
          placeholder="Email" 
          required 
          onChange={(e) => setEmail(e.target.value)} 
          className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`} 
        />
      </div>
      <div className="mb-6">
        <label className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1 font-medium`}>
          Logo
        </label>
        <input type="file" name="logo" id='logo' accept="image/*" onChange={(e) => setLogo(e.target.files[0])} className="w-full" />
      </div>
      <div>
        <label htmlFor="username" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
          Nom d'utilisateur
        </label>
        <input
          type="text"
          name="username"
          id="username"
          required
          onChange={e => setUsername(e.target.value)}
          className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
        />
      </div>
      <div>
        <label htmlFor="password" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
          Mot de passe
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          onChange={e => setPassword(e.target.value)}
          className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
      >
        Valider
      </button>
      <button
        type="button"
        onClick={() => setShowRegister(false)}
        className={`${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:underline'} w-full mt-2`}
      >
        J'ai déjà un compte
      </button>
      <ToastContainer/>
    </form>
  );
}