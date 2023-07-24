import React, { memo, useEffect, useState } from 'react';
import { Button, View, FlatList, Pressable } from 'react-native';
import PropTypes from 'prop-types';
import StockInfo from '../components/StockInfo';
import ws from '../services/DerivWebSocket';
import OverlapElementsContext from '../contexts/OverlapElementsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StocksScreen = ({ onStockSelection }) => {
  const socket = ws.openSocket();
  const { loader } = React.useContext(OverlapElementsContext);
  const [stockList, setStockList] = useState([]);

  const requestData = () => {
    loader.show();
    socket.send(
      JSON.stringify({
        active_symbols: 'brief',
        product_type: 'basic',
      })
    );
  };

  useEffect(() => {
    socket.onopen = () => {
      console.log('socket.onopen');
      setTimeout(() => {
        requestData();
      }, 500);
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data) {
        if (data.msg_type === 'active_symbols') {
          const only_open_markets = data.active_symbols.filter(
            (stock) => stock.exchange_is_open == 1
          );
          setStockList(only_open_markets);
          AsyncStorage.setItem('stocks', JSON.stringify(data.active_symbols));
        }
      }
      loader.hide();
    };
  }, []);

  return (
    <View>
      <Button title="Actualizar" onPress={() => requestData()} />
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

export default StocksScreen;
