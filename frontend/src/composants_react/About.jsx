import React from "react";
import { FaMapPin, FaPhone, FaVoicemail } from "react-icons/fa";
import { motion } from "framer-motion";

export default function AboutPage ({darkMode}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-900 p-10 rounded-2xl shadow-xl max-w-4xl mx-auto my-12 text-gray-800 dark:text-gray-100 space-y-10"
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-extrabold text-center text-gray-900 dark:text-white"
      >
        À propos de <span className="text-blue-600 dark:text-blue-400">Sale App</span>
      </motion.h1>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-lg">
          Bienvenue sur <strong className="text-blue-600 dark:text-blue-400">Sale App</strong>,
          votre solution tout-en-un pour gérer vos ventes, vos produits, vos employés, et vos performances commerciales.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">🚀 Fonctionnalités principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["📊 Gérez vos ventes", "Suivi quotidien et exportation des données."],
            ["🧾 Factures automatiques", "PDF générés automatiquement après chaque vente."],
            ["📦 Gestion de stock", "Ajout, modification et suivi des produits."],
            ["👥 Comptes employés", "Création d’accès et suivi des performances."],
            ["🤖 Conseils IA", "Suggestions de réapprovisionnement intelligentes."],
            ["🎨 Interface personnalisable", "Logo, couleurs, coordonnées, dark mode."],
          ].map(([title, description], index) => (
            <motion.div
              key={index}
              className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <strong>{title}</strong>
              <br />
              {description}
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">👤 Pour qui ?</h2>
        <ul className="list-disc list-inside pl-4 space-y-1">
          <li>Commerçants indépendants</li>
          <li>Supérettes et épiceries</li>
          <li>Boutiques de détail</li>
          <li>Points de vente de proximité</li>
          <li>Petites entreprises</li>
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">🛠️ Besoin d’aide ?</h2>
        <p>
          Réinitialisez votre mot de passe à tout moment depuis votre email, ou mettez à jour vos informations dans la section <strong>"Mon profil"</strong>.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">📞 Contact</h2>
        <ul className="space-y-2 text-lg">
          <li className="flex items-center gap-2"><FaPhone className="text-blue-500" /> +223 91 51 48 39</li>
          <li className="flex items-center gap-2"><FaVoicemail className="text-blue-500" /> <a href="mailto:camarayacouba91@gmail.com" className="underline">camarayacouba91@gmail.com</a></li>
          <li className="flex items-center gap-2"><FaMapPin className="text-blue-500" /> Bamako (Mali), Sebenikoro</li>
        </ul>
      </motion.section>
    </motion.div>
  );
};