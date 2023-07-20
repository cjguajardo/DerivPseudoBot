import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

const StockInfo = ({ stock }) => {
  const { display_name, symbol, market_display_name } = stock;
  // console.log('StockInfo', { display_name, symbol, market_display_name });

  return (
    <View style={styles.container}>
      <Text style={styles.display_name}>{display_name}</Text>
      <Text>{symbol}</Text>
      <Text>{market_display_name}</Text>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    padding: 5,
    minHeight: 70,
  },
  display_name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
};

StockInfo.propTypes = {
  stock: PropTypes.object.isRequired,
};

export default StockInfo;
