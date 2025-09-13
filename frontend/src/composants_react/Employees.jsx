import React from 'react';
import { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaWindowClose, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import SubUserEditForm from './SubUserEditForm';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

export default function Employees({ darkMode, filteredSubUsers, subUsersFiltered, 
        setSubUserId, setEditedSubUserData, setSubUserToDelete,
        subUserToDelete, handleDeleteSubUser, editedSubUserData, handleEditSubUserSubmit,
        loadSubUsers
    }){
    
    const [employeeForm, setEmployeeForm] = useState(false)
    const [employeesFormData, setEmployeesFormData] = useState({name: "", surname: "", username: "", password:"", phone: "", email: "", adresse: "", role:'autres'})
    const [subUserPage, setSubUserPage] = useState('employees');
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (phone) => /^[0-9]{8,15}$/.test(phone);
    const isValidUsername = (username) => /^[a-zA-Z0-9_]{4,}$/.test(username);
    const isValidPassword = (password) => password.length >= 6;

    const employeesFormSubmit = async (e) => {
        e.preventDefault();
        const { name, surname, username, password, phone, email } = employeesFormData;
        if (!isValidUsername(username)) return toast.error("Nom utilisateur invalide.");
        if (!isValidPassword(password)) return toast.error("Mot de passe trop court.");
        if (!isValidEmail(email)) return toast.error("Email invalide.");
        if (!isValidPhone(phone)) return toast.error("Téléphone invalide.");

        const formData = new FormData();
        Object.entries(employeesFormData).forEach(([key, val]) => formData.append(key, val));

        try {
            await axios.post('/api/employees', formData);
            toast.success("Utilisateur ajouté !");
            setEmployeeForm(false);
            loadSubUsers();
            setSubUserPage('employees');
        } catch (err) {
        toast.error(err.response?.data?.error || "Erreur lors de l'ajout");
        }
    }
        return (
        <div className="flex-grow flex-col justify-center items-center w-full p-3">
            {subUserPage === 'employees' &&(
                <>
                <div className="sticky max-w-md mx-auto flex items-center w-sm my-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 p-2 bg-white gap-2">
                    <FaSearch className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email"
                        onChange={(e) => filteredSubUsers(e)}
                        className="w-full flex-1 focus:outline-none"
                    />
                </div>
                <div className='sticky flex justify-between items-center mt-4'>
                    <h1 className={`text-2xl font-bold text-gray-800 ${darkMode ? 'text-white' : ''}`}>Gestion des utilisateurs</h1>
                    <button 
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hidden sm:flex"
                        onClick={() => {setEmployeeForm(true); setSubUserPage('addEmployee')}}
                    >
                        Ajouter un employé
                    </button>
                    <button 
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex sm:hidden"
                        onClick={() => {setEmployeeForm(true); setSubUserPage('addEmployee')}}
                    >
                        <FaPlus className="text-white"/>
                    </button>
                </div>
                <div className="flex flex-grow w-full flex justify-center items-start mt-4 pb-20">
                    <div className='flex flex-col w-full justify-start items-center'>
                        <div
                        className={`rounded-xl shadow overflow-hidden transition flex justify-center items-start w-full ${
                            darkMode ? 'bg-slate-800 text-gray-100' : 'bg-white text-gray-800'
                        }`}
                        >
                        {/* Table mode (desktop et tablette) */}
                        <table className={`table-auto hidden md:table bg-white shadow rounded w-full ${darkMode ? 'bg-slate-800 text-gray-100' : 'bg-white text-gray-800'}`}>
                            <thead className={darkMode ? 'bg-slate-700 text-gray-200' : 'bg-gray-100 text-gray-700'}>
                            <tr>
                                <th className="text-left px-4 py-3">Nom</th>
                                <th className="text-left px-4 py-3">Prenom</th>
                                <th className="text-left px-4 py-3">Username</th>
                                <th className="text-left px-4 py-3">Phone</th>
                                <th className="text-left px-4 py-3">Email</th>
                                <th className="text-left px-4 py-3">Adresse</th>
                                <th className="text-left px-4 py-3">Rôle</th>
                                <th className="text-right px-4 py-3">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {subUsersFiltered.length === 0 ? (
                                <tr>
                                <td
                                    colSpan="8"
                                    className={`text-center py-6 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                >
                                    Aucun utilisateur trouvé.
                                </td>
                                </tr>
                            ) : (
                                subUsersFiltered.map((subUser) => (
                                <tr key={subUser.id} className={darkMode ? 'border-t border-slate-700 bg-slate-800' : 'border-t border-gray-200'}>
                                    <td className="px-4 py-3">{subUser.name}</td>
                                    <td className="px-4 py-3">{subUser.surname}</td>
                                    <td className="px-4 py-3">{subUser.username}</td>
                                    <td className="px-4 py-3">{subUser.phone}</td>
                                    <td className="px-4 py-3">{subUser.email}</td>
                                    <td className="px-4 py-3">{subUser.adresse}</td>
                                    <td className="px-4 py-3">{subUser.role}</td>
                                    <td className="px-4 py-3 text-right space-x-3">
                                    <button 
                                        className="text-yellow-500 hover:text-yellow-400"
                                        onClick={() => {
                                        setSubUserId(subUser.id);
                                        setEditedSubUserData({
                                            name: subUser.name,
                                            surname: subUser.surname,
                                            username: subUser.username,
                                            phone: subUser.phone,
                                            email: subUser.email,
                                            adresse: subUser.adresse,
                                            role: subUser.role,
                                            password: ''
                                        });
                                        setSubUserPage('editEmployee');
                                        }}  
                                    >
                                        <FaEdit />
                                    </button>
                                    <button 
                                        className="text-red-500 hover:text-red-400"
                                        onClick={() => setSubUserToDelete(subUser.id)}
                                    >
                                        <FaTrash />
                                    </button>
                                    </td>
                                </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                        {subUserToDelete && (
                            <div className={`fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50`}>
                            <div className={`p-6 rounded-lg shadow-lg w-full max-w-sm border
                                ${darkMode ? 'bg-slate-800 border-gray-100 text-white' : 'bg-white border-gray-300 text-gray-800'}`}>
                                
                                <h3 className="text-lg font-semibold mb-4 text-center">
                                Confirmer la suppression ?
                                </h3>
                                <p className="text-center mb-6 text-red-600">
                                Cette action est <strong>irréversible</strong>.
                                </p>

                                <div className="flex justify-between gap-4">
                                <button
                                    onClick={() => handleDeleteSubUser(subUserToDelete)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                >
                                    Supprimer
                                </button>
                                <button
                                    onClick={() => setSubUserToDelete(null)}
                                    className={`flex-1 px-4 py-2 rounded font-semibold transition
                                    ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'}`}
                                >
                                    Annuler
                                </button>
                                </div>
                            </div>
                            </div>
                        )}

                        {/* Mobile card mode */}
                        <div className={darkMode ? 'md:hidden divide-y divide-slate-700 w-full' : 'md:hidden divide-y divide-gray-200 w-full'}>
                            {subUsersFiltered.length === 0 ? (
                            <p className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Aucun utilisateur trouvé.
                            </p>
                            ) : (
                            subUsersFiltered.map((subUser) => (
                                <div key={subUser.id} className="p-4 w-full shadow-lg">
                                <p>
                                    <span className="font-semibold">Nom:</span> {subUser.name}
                                </p>
                                <p>
                                    <span className="font-semibold">Prénom:</span> {subUser.surname}
                                </p>
                                <p>
                                    <span className="font-semibold">Username:</span> {subUser.username}
                                </p>
                                <p>
                                    <span className="font-semibold">Téléphone:</span> {subUser.phone}
                                </p>
                                <p>
                                    <span className="font-semibold">Email:</span> {subUser.email}
                                </p>
                                <p>
                                    <span className="font-semibold">Adresse:</span> {subUser.adresse}
                                </p>
                                <p>
                                    <span className="font-semibold">Rôle:</span> {subUser.role}
                                </p>
                                <div className="flex justify-end space-x-3 mt-2">
                                    <button 
                                    className="text-yellow-500 hover:text-yellow-400"
                                    onClick={() => {
                                        setSubUserId(subUser.id);
                                        setEditedSubUserData({
                                        name: subUser.name,
                                        surname: subUser.surname,
                                        username: subUser.username,
                                        phone: subUser.phone,
                                        email: subUser.email,
                                        adresse: subUser.adresse,
                                        role: subUser.role,
                                        password: ''
                                        });
                                        setSubUserPage('editEmployee');
                                    }} 
                                    >
                                    <FaEdit />
                                    </button>
                                    <button 
                                    className="text-red-500 hover:text-red-400"
                                    onClick={() => setSubUserToDelete(subUser.id)}
                                    >
                                    <FaTrash />
                                    </button>
                                </div>
                                </div>
                            ))
                            )}
                            {subUserToDelete && (
                            <div className={`fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50`}>
                                <div className={`p-6 rounded-lg shadow-lg w-full max-w-sm border
                                ${darkMode ? 'bg-slate-800 border-gray-100 text-white' : 'bg-white border-gray-300 text-gray-800'}`}>
                                
                                <h3 className="text-lg font-semibold mb-4 text-center">
                                    Confirmer la suppression ?
                                </h3>
                                <p className="text-center mb-6 text-red-800">
                                    Cette action est <strong>irréversible</strong>.
                                </p>

                                <div className="flex justify-between gap-4">
                                    <button
                                    onClick={() => handleDeleteSubUser(subUserToDelete)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                    >
                                    Supprimer
                                    </button>
                                    <button
                                    onClick={() => setSubUserToDelete(null)}
                                    className={`flex-1 px-4 py-2 rounded font-semibold transition
                                        ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'}`}
                                    >
                                    Annuler
                                    </button>
                                </div>
                                </div>
                            </div>
                            )}
                        </div>
                        </div>
                    </div>
                </div>
                </>
            )}
            {subUserPage === 'editEmployee' && (
                <>
                    <div className='w-full flex justify-start items-center'>
                        <button
                            className={`bg-transparent cursor-pointer flex items-center gap-2`}
                            onClick={() => setSubUserPage('employees')}
                        >
                            <FaArrowLeft className={darkMode ? 'text-white' :'text-gray-800'} size={15}/>
                            <span className={darkMode ? 'text-white' :'text-gray-800'}>Retour</span>
                        </button>
                    </div>
                    <SubUserEditForm handleEditSubUserSubmit={handleEditSubUserSubmit} darkMode={darkMode} editedSubUserData={editedSubUserData}
                        setEditedSubUserData={setEditedSubUserData} setSubUserId={setSubUserId}
                    />
                </>
            )}
            {subUserPage === 'addEmployee' && (
                <>
                    <div className='w-full flex justify-start items-center p-3'>
                        <button
                            className={`bg-transparent cursor-pointer flex items-center gap-2`}
                            onClick={() => setSubUserPage('employees')}
                        >
                            <FaArrowLeft className={darkMode ? 'text-white' :'text-gray-800'} size={15}/>
                            <span className={darkMode ? 'text-white' :'text-gray-800'}>Retour</span>
                        </button>
                    </div>
                    <div className='flex justify-center items-center mb-2'>
                        {employeeForm && 
                            <form 
                            className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4 mt-1 mb-1"
                            onSubmit={employeesFormSubmit}
                            >
                            <h2 className="text-center text-1xl font-bold">
                                Ajout un employé
                            </h2>
                            <div>
                                <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                                >
                                Nom <span className='text-red-600'>*</span>
                                </label>
                                <input
                                type="text"
                                name="name"
                                id="name"
                                placeholder="Nom"
                                required
                                onChange={(e) => setEmployeesFormData({...employeesFormData, name: e.target.value})}
                                value={employeesFormData.name}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label
                                htmlFor="surname"
                                className="block text-sm font-medium text-gray-700"
                                >
                                Prénom <span className='text-red-600'>*</span>
                                </label>
                                <input
                                type="text"
                                name="surname"
                                id="surname"
                                placeholder="Prénom"
                                required
                                onChange={(e) => setEmployeesFormData({...employeesFormData, surname: e.target.value})}
                                value={employeesFormData.surname}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label
                                htmlFor="adresse"
                                className="block text-sm font-medium text-gray-700"
                                >
                                Adresse
                                </label>
                                <input
                                type="text"
                                name="adresse"
                                id="adresse"
                                placeholder="Adresse de l'entreprise"
                                onChange={(e) => setEmployeesFormData({...employeesFormData, adresse: e.target.value})}
                                value={employeesFormData.adresse}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-gray-700"
                                >
                                Téléphone <span className='text-red-600'>*</span>
                                </label>
                                <input
                                type="text"
                                name="phone"
                                id="phone"
                                placeholder="Téléphone"
                                required
                                onChange={(e) => setEmployeesFormData({...employeesFormData, phone: e.target.value})}
                                value={employeesFormData.phone}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                                >
                                Email <span className='text-red-600'>*</span>
                                </label>
                                <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="Email"
                                onChange={(e) => setEmployeesFormData({...employeesFormData, email: e.target.value})}
                                value={employeesFormData.email}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700"
                                >
                                Nom d'utilisateur <span className='text-red-600'>*</span>
                                </label>
                                <input
                                type="text"
                                name="username"
                                id="username"
                                required
                                onChange={(e) => setEmployeesFormData({...employeesFormData, username: e.target.value})}
                                value={employeesFormData.username}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label htmlFor='role' className="block text-sm font-medium text-gray-700">Role</label>
                                <select 
                                name="role" 
                                id="role" 
                                className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                                onChange={(e) => setEmployeesFormData({...employeesFormData, role: e.target.value})}
                                >
                                <option value="autres">Autres</option>
                                </select>
                            </div>
                            <div>
                                <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                                >
                                Mot de passe <span className='text-red-600'>*</span>
                                </label>
                                <input
                                type="password"
                                name="password"
                                id="password"
                                required
                                onChange={(e) => setEmployeesFormData({...employeesFormData, password: e.target.value})}
                                value={employeesFormData.password}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
                            >
                                Enregistrer
                            </button>
                            <button 
                                type="button"
                                className="w-full text-blue-700"
                            >
                                Changer mon mot de passe
                            </button>
                            </form>
                        }
                    </div>
                </>
            )}
            <ToastContainer />
        </div>
        
    )
}