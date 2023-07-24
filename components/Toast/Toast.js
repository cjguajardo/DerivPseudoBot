import React, { useEffect, useContext } from 'react';
import { View, Text, Dimensions, Pressable } from 'react-native';
import OverlapElementsContext from '../../contexts/OverlapElementsContext';

const Toast = () => {
  const { toast } = useContext(OverlapElementsContext);

  useEffect(() => {
    if (toast.visible) {
      setTimeout(() => {
        toast.hide();
      }, 3000);
    }
  }, [toast.visible]);

  return (
    <View
      style={{ display: toast.visible ? 'flex' : 'none', ...styles.container }}
    >
      <Pressable
        onPress={() => {
          toast.hide();
        }}
      >
        <Text>{toast.message}</Text>
      </Pressable>
    </View>
  );
};

const styles = {
  container: {
    position: 'absolute',
    bottom: 50,
    left: 10,
    padding: 10,
    backgroundColor: '#CCC',
    zIndex: 100,
    width: Dimensions.get('window').width - 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',

    borderBottomWidth: 3,
  },
};

export default Toast;
