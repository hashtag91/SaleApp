import React from 'react';
import { FaTimes } from 'react-icons/fa';

export default function SidebarMobile({ isOpen, onClose, menuItems = [], onNavigate }) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="relative bg-white w-64 h-full shadow-lg p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Menu</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <FaTimes />
          </button>
        </div>

        <ul className="space-y-3">
          {menuItems.map((item, index) => (
            <li
              key={index}
              onClick={() => {
                onNavigate(item.value);
                onClose();
              }}
              className="cursor-pointer text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition"
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
