import React from 'react';

const useToast = () => {
  const [toast, setToast] = React.useState({
    visible: false,
    message: '',
  });

  const show = message => {
    setToast({
      visible: true,
      message,
    });
  };

  const hide = () => {
    setToast({
      visible: false,
      message: '',
    });
  };

  return {
    visible: toast.visible,
    message: toast.message,
    show,
    hide,
  };
};

export default useToast;
