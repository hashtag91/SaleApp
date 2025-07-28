import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

export default function LoginForm({ setShowRegister, setPassword, setUsername, handleLogin, darkMode}) {
  const [forgotPassword, setForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showResetCodeField, setShowResetCodeField] = useState(false); // Pour afficher la page du champ de saisi du code unique
  const [resetCode, setResetCode] = useState('');
  const [showNewPasswordField, setShowNewPasswordField] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append('email',recoveryEmail)

      const res = await axios.post('/api/forgot_password', data)
      toast.success(res.data.success);
      setForgotPassword(false);
      setShowResetCodeField(true); // Pour aller directement sur la page de saisi du code unique
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.error || "Aucun utilisateur trouvé avec cet email.")
    }
  }

  const handleCodeConfirmation = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append('code', resetCode)

      const res = await axios.post('/api/reset_password_code', data)
      toast.success(res.data.message || 'Code valide ! Vous pouvez maintenant modifier le mot de passe')
      setShowNewPasswordField(true);
    } catch (error) {
      toast.error(error.response?.data?.error);
      console.log(error);
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const data = new FormData();
      data.append('password',newPassword)
      const res = await axios.put('/api/reset_forgot_password', data)
      toast.success(res.data.message);
      setShowNewPasswordField(false);
      setShowResetCodeField(false);
    } catch (error) {
      toast.error(res.response?.data?.error);
      console.log(error);
    }
  }
  return (
    <>
      {showResetCodeField ? 
        (
          showNewPasswordField ? 
            <>
              <form
                onSubmit={handlePasswordChange}
                className={`${darkMode ? 'bg-gray-900' : 'bg-white'} p-8 rounded-lg shadow-md w-full max-w-sm space-y-4`}
              >
                <h2 className={`${darkMode ? 'text-white' : 'text-gray-800'} text-2xl font-bold text-center`}>
                  Modifier le mot de passe
                </h2>
                <div>
                  <label htmlFor="new_password" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    id="new_password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  />
                </div>
                <div>
                  <label htmlFor="password" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    id="confirm_password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
                >
                  Valider
                </button>
              </form>
            </>
            :
            <>
              <form
                onSubmit={handleCodeConfirmation}
                className={`${darkMode ? 'bg-gray-900' : 'bg-white'} p-8 rounded-lg shadow-md w-full max-w-sm space-y-4`}
              >
                <h2 className={`${darkMode ? 'text-white' : 'text-gray-800'} text-2xl font-bold text-center`}>
                  Votre code unique
                </h2>
                <p className={darkMode ? 'text-white' : 'text-gray-800'}>Veuillez saisir le code unique à six chiffres envoyé à {recoveryEmail}</p>
                <div>
                  <input
                    type="text"
                    name="code"
                    id="code"
                    pattern="\d{6}"
                    maxLength="6"
                    required
                    placeholder='Votre code unique ici'
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  />
                </div>
                <div className='flex justify-end'>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-2 rounded-md transition cursor-pointer"
                  >
                    Valider
                  </button>
                </div>
              </form>
            </>
        )
        : (
          <>
            <form
              onSubmit={forgotPassword ? handleForgotPassword : handleLogin}
              className={`${darkMode ? 'bg-gray-900' : 'bg-white'} p-8 rounded-lg shadow-md w-full max-w-sm space-y-4`}
            >
              {forgotPassword ? 
                (
                  <>
                    <h2 className={`${darkMode ? 'text-white' : 'text-gray-800'} text-2xl font-bold text-center`}>
                      Mot de pass oublié
                    </h2>
                    <p className={darkMode ? 'text-white' : 'text-gray-800'}>Saisissez votre adresse email utilisé lors de la création de ce compte. Un code unique vous sera envoyé par email pour la reinitialisation de votre mot de passe.</p>
                    <div>
                      <label htmlFor="email" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                    </div>
                    <div className='flex justify-around'>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition cursor-pointer"
                      >
                        Envoyer
                      </button>
                      <button
                        type="button"
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition cursor-pointer"
                        onClick={(e) => setForgotPassword(false)}
                      >
                        Annuler
                      </button>
                    </div>
                  </>
                )
                :(
                  <>
                    <h2 className={`${darkMode ? 'text-white' : 'text-gray-800'} text-2xl font-bold text-center`}>
                      Connexion
                    </h2>
                    <div>
                      <label htmlFor="username" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium`}>
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        name="username"
                        id="username"
                        required
                        onChange={(e) => setUsername(e.target.value)}
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
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                    </div>
                    <div className='flex justify-start mb-2 mt-1'>
                      <button 
                        type="button"
                        className='text-blue-700 cursor-pointer hover:text-blue-800'
                        onClick={(e) => setForgotPassword(true)}
                      >
                        Mot de passe oublié
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
                    >
                      Valider
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRegister(true)}
                      className={`${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:underline'} w-full mt-2`}
                    >
                      Créer un compte
                    </button>
                  </>
                )
            }
            </form>
          </>
        ) 
      }
      <ToastContainer />
    </>
  );
}