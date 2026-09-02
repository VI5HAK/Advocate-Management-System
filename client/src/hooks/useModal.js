import { useState, useCallback } from "react";

/**
 * A custom hook to manage modal open/close states and modal item payloads.
 *
 * @param {boolean} initialOpen - Initial open state of the modal (default false).
 * @param {any} initialData - Initial item payload (default null).
 */
export function useModal(initialOpen = false, initialData = null) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [modalData, setModalData] = useState(initialData);

  const openModal = useCallback((data = null) => {
    setModalData(data);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setModalData(null);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    modalData,
    setModalData,
    openModal,
    closeModal,
    toggleModal,
  };
}

export default useModal;
