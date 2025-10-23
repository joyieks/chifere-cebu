import React from 'react';
import AddProductForm from './AddProductForm';

/**
 * EditProductModal Component
 *
 * Thin wrapper around AddProductForm for editing existing products.
 * Passes editData to enable edit mode in the form.
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 * @param {Function} onSuccess - Callback on successful update
 * @param {Object} productData - Existing product data to edit
 */
const EditProductModal = ({ isOpen, onClose, onSuccess, productData }) => {
  return (
    <AddProductForm
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      editData={productData}
    />
  );
};

export default EditProductModal;
