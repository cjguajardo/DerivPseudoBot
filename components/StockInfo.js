import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

const StockInfo = ({ stock }) => {
  const { display_name, symbol, market_display_name, exchange_is_open } = stock;
  // console.log('StockInfo', { stock });

  const finalStyles = {
    ...styles.container,
    ...(exchange_is_open == 0 ? styles.closed_market : {}),
  };

  return (
    <View style={finalStyles}>
      {exchange_is_open == 0 && <Text styles={styles.closed}>CLOSED</Text>}
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
  closed_market: {
    backgroundColor: '#ccc',
  },
  closed: {
    color: '#f00',
    fontWeight: 'bold',
    fontSize: 20,
    position: 'absolute',
    right: 10,
    top: 10,
    flex: 1,
  },
};

StockInfo.propTypes = {
  stock: PropTypes.object.isRequired,
};

export default memo(StockInfo);
