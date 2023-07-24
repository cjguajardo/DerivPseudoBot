import React from 'react';

const OverlapElementsContext = React.createContext({
  loader: {
    visible: false,
    show: () => {},
    hide: () => {},
  },
  toast: {
    visible: false,
    message: '',
    show: () => {},
    hide: () => {},
  },
  modal: {
    visible: false,
    show: () => {},
    hide: () => {},
  },
});

export default OverlapElementsContext;
