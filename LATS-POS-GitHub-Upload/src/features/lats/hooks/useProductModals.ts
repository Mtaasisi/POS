import { useState } from 'react';

export const useProductModals = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const openEditModal = (productId: string) => {
    setEditingProductId(productId);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProductId(null);
  };

  return {
    // Add Modal
    showAddModal,
    openAddModal,
    closeAddModal,
    
    // Edit Modal
    showEditModal,
    editingProductId,
    openEditModal,
    closeEditModal
  };
};
