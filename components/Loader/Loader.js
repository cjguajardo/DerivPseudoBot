import React, { useContext, useEffect, memo } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import OverlapElementsContext from '../../contexts/OverlapElementsContext';

const Loader = () => {
  const { loader } = useContext(OverlapElementsContext);

  useEffect(() => {
    // console.log('Loader', loader.visible);
  }, [loader.visible]);

  return (
    <>
      {loader.visible && (
        <View style={styles.activity_indicator_backdrop}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  activity_indicator_backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffffaa',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(Loader);
