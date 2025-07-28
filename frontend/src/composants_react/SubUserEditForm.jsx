import React from "react";

export default function SubUserEditForm ({handleEditSubUserSubmit, darkMode, editedSubUserData, setEditedSubUserData, setSubUserId}) {
    return (
        <div className='flex-grow flex justify-center items-center w-full'>
            <form
                onSubmit={(e) => handleEditSubUserSubmit(e)}
                className={`p-6 rounded-lg shadow-md w-full max-w-sm mx-auto my-6 space-y-4 border
                ${darkMode ? 'bg-slate-800 text-white border-gray-100' : 'bg-white text-gray-800 border-gray-300'}`}
            >
                <h2 className="text-xl font-semibold text-center">Modifier l'utilisateur</h2>

                {['name', 'surname', 'username', 'phone', 'email', 'adresse'].map((field) => (
                <div key={field}>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {field === 'surname' ? 'Prénom' : field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                    type="text"
                    name={field}
                    id={field}
                    value={editedSubUserData[field]}
                    onChange={(e) => setEditedSubUserData({ ...editedSubUserData, [field]: e.target.value })}
                    className={`w-full border px-3 py-2 rounded transition
                        ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                    />
                </div>
                ))}

                {/* Rôle */}
                <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Rôle
                </label>
                <select
                    value={editedSubUserData.role}
                    onChange={(e) => setEditedSubUserData({ ...editedSubUserData, role: e.target.value })}
                    className={`w-full border px-3 py-2 rounded transition
                    ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                >
                    <option value="admin">Admin</option>
                    <option value="autres">Autres</option>
                </select>
                </div>

                {/* Mot de passe */}
                <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Mot de passe
                </label>
                <input
                    type="password"
                    value={editedSubUserData.password}
                    onChange={(e) => setEditedSubUserData({ ...editedSubUserData, password: e.target.value })}
                    className={`w-full border px-3 py-2 rounded transition
                    ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}
                />
                </div>

                {/* Boutons */}
                <div className="flex gap-4">
                <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Enregistrer
                </button>
                <button
                    type="button"
                    className={`flex-1 px-4 py-2 rounded transition font-semibold
                    ${darkMode ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
                    onClick={() => setSubUserId(null)}
                >
                    Annuler
                </button>
                </div>
            </form>
        </div>
    )
}