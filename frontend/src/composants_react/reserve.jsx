function ProductPresent () {
    return (
        <ul>
            {filteredProducts.map((p) => (
                <li
                key={p.id}
                className={`mb-4 border rounded-xl p-4 flex items-center gap-6 shadow-lg transition-colors duration-300
                    ${
                    p.stock === 0
                        ? 'bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-700'
                        : p.stock <= 2
                        ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-400 dark:border-yellow-600'
                        : darkMode ? "border-slate-600 bg-slate-800" : "bg-white border-gray-300"
                    }`}
                >
                {p.imageUrl ? (
                    <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-20 h-20 object-contain rounded-lg"
                    />
                ) : (
                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-300">
                    Pas d’image
                    </div>
                )}

                <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {p.name}
                    </h3>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>SKU: {p.sku}</p>
                    <p className={`font-bold ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>FCFA{p.price}</p>
                    <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Stock: {p.stock}</p>
                </div>

                {user.role === 'admin' && (
                    <div className="flex gap-4">
                    <button
                        onClick={() => handleEditProduct(p)}
                        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-semibold"
                    >
                        <FaEdit />
                    </button>
                    <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold"
                    >
                        <FaTrash />
                    </button>
                    </div>
                )}
                </li>
            ))}
            </ul>
    )
}

export default ProductPresent();