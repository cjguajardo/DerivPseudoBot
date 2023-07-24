import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Tab from '../components/Tab';
import WebSocketContext from '../contexts/WebSocketContext';
import StocksScreen from './StocksScreen';
import SelectedStockScreen from './SelectedStockScreen';
import OpenContract from '../components/OpenContract';
import ws from '../services/DerivWebSocket';

const TradingScreen = () => {
  const [activeTab, setActiveTab] = useState('stocks');
  const [selectedStock, setSelectedStock] = useState(null);
  const socket = ws.openSocket();

  const onStockSelection = async (stock) => {
    if (stock.symbol === selectedStock?.symbol) return;
    if (selectedStock) {
      console.log({ selectedStock });
      //unsubscribing from previous stock
      socket.send(JSON.stringify({ forget_all: 'candles' }));
      socket.send(JSON.stringify({ forget_all: 'ticks' }));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setSelectedStock(stock);
    setActiveTab('selectedStock');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'stocks':
        return <StocksScreen onStockSelection={onStockSelection} />;
      case 'selectedStock':
        return (
          <>
            <SelectedStockScreen>
              <OpenContract />
            </SelectedStockScreen>
          </>
        );
      case 'operations':
        return <Text>Operations Tab</Text>;
      default:
        return null;
    }
  };

  useEffect(() => {
    socket.onmessage = async function (event) {
      if (event.data) {
        const data = JSON.parse(event.data);
        // console.log(data.msg_type, Object.keys(data));
        if (data) {
          if (data.msg_type === 'error') {
            console.log({ error: data.error });
            return;
          } else if (
            data.msg_type === 'forget' ||
            data.msg_type === 'forget_all'
          ) {
            console.log({ forget: data });
            return;
          }
        }
      }
    };
  }, []);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.tabs}>
          <Tab
            active={activeTab === 'stocks'}
            label="Stocks"
            onPress={() => setActiveTab('stocks')}
          />
          <Tab
            active={activeTab === 'selectedStock'}
            label={
              selectedStock ? selectedStock.display_name : 'Selected Stock'
            }
            onPress={() => setActiveTab('selectedStock')}
          />
          <Tab
            active={activeTab === 'operations'}
            label="Operations"
            onPress={() => setActiveTab('operations')}
          />
        </View>
        <View style={styles.content}>
          <WebSocketContext.Provider
            value={{
              socket,
              selectedSymbol:
                typeof selectedStock != 'undefined' && selectedStock != null
                  ? selectedStock.symbol
                  : null,
            }}
          >
            {renderContent()}
          </WebSocketContext.Provider>
        </View>
      </View>
    </>
  );
};

const styles = {
  container: {
    flex: 1,
    // backgroundColor: '#ff3',
    width: '100%',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  content: {
    paddingHorizontal: 20,
    flex: 1,
    // maxHeight: '70%',
  },
};

export default TradingScreen;
