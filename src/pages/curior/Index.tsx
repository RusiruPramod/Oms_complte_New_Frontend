import React from 'react';
import ReturnOrdersTable from './ReturnOrdersTable';

const CuriorIndex: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Curior Dashboard</h1>
      <ReturnOrdersTable />
    </div>
  );
};

export default CuriorIndex;
