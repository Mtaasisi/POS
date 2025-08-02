import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AddCustomerModal from '../components/forms/AddCustomerModal';
import { ArrowLeft } from 'lucide-react';

const NewCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(true);

  const handleCustomerCreated = (customer: any) => {
    // Navigate to the new customer's detail page
    navigate(`/customers/${customer.id}`);
  };

  const handleClose = () => {
    setModalOpen(false);
    navigate('/customers');
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <Link to="/customers" className="mr-4 text-gray-700 hover:text-gray-900">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
      </div>
      <AddCustomerModal
        isOpen={modalOpen}
        onClose={handleClose}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
};

export default NewCustomerPage;