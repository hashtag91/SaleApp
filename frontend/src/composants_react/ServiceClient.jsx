import React, { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import axios from 'axios';

const ContactPage = ({ darkMode, user }) => {
  const [formData, setFormData] = useState({
    name: `${user.surname} ${user.name}`,
    email: user.email,
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ici, vous pouvez envoyer les données à votre backend ou API
    try {
        const res = await axios.post('/api/contact', formData);
        toast.success(res.data.message);
    } catch (err) {
        toast.error("Message non envoyé. Veuillez appeler au 22391514839")
    }
    setFormData({ name: `${user.surname} ${user.name}`, email: user.email, message: "" });
  };

  return (
    <div className={`${darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-900"} h-full flex items-center justify-center p-6`}>
      <div className="w-full max-w-md rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Contactez-nous</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="Nom"
            value={formData.name}
            onChange={handleChange}
            className={`p-3 rounded border ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className={`p-3 rounded border ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
            required
          />
          <textarea
            name="message"
            placeholder="Votre message..."
            value={formData.message}
            onChange={handleChange}
            rows="5"
            className={`p-3 rounded border ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
            required
          ></textarea>

          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded transition-colors"
          >
            Envoyer
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="https://wa.me/22391514839" // Remplacez par votre numéro WhatsApp
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 hover:bg-green-600 text-white py-2 px-4 
                rounded transition-colors flex justify-center items-center"
          >
            <FaWhatsapp className="font-bold"/> WhatsApp
          </a>
        </div>
      </div>
      <ToastContainer/>
    </div>
  );
};

export default ContactPage;
