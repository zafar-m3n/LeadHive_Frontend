import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  overlayClass = "",
  modalClass = "",
  closeButton = true,
  footer = null,
  disableEscapeClose = false,
  closeOnOverlayClick = true,
  centered = false,
}) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="font-dm-sans">
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={disableEscapeClose ? () => {} : onClose}>
          {/* Overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className={`fixed inset-0 bg-gray-900/60 ${overlayClass}`}
              onClick={closeOnOverlayClick ? onClose : null}
            />
          </Transition.Child>

          <div
            className={`fixed inset-0 flex ${centered ? "items-center" : "items-start pt-[60px]"} justify-center px-4`}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`relative bg-white rounded-lg shadow-xl overflow-hidden w-full ${sizeClasses[size]} ${modalClass}`}
              >
                {closeButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-800 hover:text-gray-700 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>✕
                  </button>
                )}

                {title && (
                  <Dialog.Title className="font-dm-sans text-lg font-medium text-gray-900 px-6 py-4 border-b border-gray-300">
                    {title}
                  </Dialog.Title>
                )}
                <div className="px-6 py-4 font-dm-sans text-gray-800">{children}</div>
                {footer && (
                  <div className="px-6 py-4 border-t border-gray-300 font-dm-sans text-gray-800">{footer}</div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Modal;
