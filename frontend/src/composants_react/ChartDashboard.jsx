import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ChartDashboard({ comparisonData }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Comparaison Achats/Ventes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={comparisonData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="buy_total" fill="#EF4444" name="Achats" />
          <Bar dataKey="sell_total" fill="#10B981" name="Ventes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}