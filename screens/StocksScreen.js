import React, { memo } from 'react';
import WebSocketContext from '../contexts/WebSocketContext';
import { Button, View, Text, FlatList, Pressable } from 'react-native';
import PropTypes from 'prop-types';
import StockInfo from '../components/StockInfo';

const StocksScreen = ({ onStockSelection, refreshData }) => {
  const { stockList } = React.useContext(WebSocketContext);

  return (
    <View>
      <Text>Stocks Screen</Text>
      <Button title="Actualizar" onPress={refreshData} />
      <FlatList
        data={stockList}
        renderItem={({ item }) => (
          <Pressable onPress={() => onStockSelection(item)}>
            <StockInfo stock={item} />
          </Pressable>
        )}
      />
    </View>
  );
};

StocksScreen.propTypes = {
  onStockSelection: PropTypes.func.isRequired,
};

export default memo(StocksScreen);
