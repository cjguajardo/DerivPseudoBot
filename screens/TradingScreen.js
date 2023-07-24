import React, { useState, useContext } from 'react';
import { View, Text } from 'react-native';
import Tab from '../components/Tab';
import WebSocketContext from '../contexts/WebSocketContext';
import StocksScreen from './StocksScreen';
import SelectedStockScreen from './SelectedStockScreen';
import OpenContract from '../components/OpenContract';

const botToken = 'utpD7uT32mi0Mck';
const takeProfitAt = 5;

const TradingScreen = () => {
  const [activeTab, setActiveTab] = useState('stocks');
  const [selectedStock, setSelectedStock] = useState(null);
  const [authorizationFor, setAuthorizationFor] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [currentOperation, setCurrentOperation] = useState(null);
  const [openContract, setOpenContract] = useState(null);
  const [subscriptions, setSubscriptions] = useState({});

  const app_id = 1089; // Replace with your app_id or leave as 1089 for testing.
  let socket = new WebSocket(
    `wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`
  );

  const send = data => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      if (typeof data.subscribe !== 'undefined') {
        //Check if the subscription is already active
        const _keys = Object.keys(data);
        const _isSubsscribed = Object.keys(subscriptions).filter(
          key => _keys.indexOf(key) >= 0
        );
        if (_isSubsscribed.length > 0) {
          if (subscriptions[_isSubsscribed[0]] !== null) {
            console.log('>> Already subscribed to ' + _isSubsscribed[0]);
            return;
          }
        }
      }
      if (typeof data.ping === 'undefined') {
        console.log('readyState::OPEN', data);
      }
      socket.send(JSON.stringify(data));
    } else {
      //reopen socket
      if (socket.readyState === WebSocket.CLOSED) {
        console.log('readyState::CLOSED');
        openSocket();
        setTimeout(() => {
          socket.send(JSON.stringify(data));
        }, 2000);
      } else if (socket.readyState === WebSocket.CLOSING) {
        console.log('readyState::CLOSING');
        setTimeout(() => {
          openSocket();
          setTimeout(() => {
            socket.send(JSON.stringify(data));
          }, 1000);
        }, 2000);
      } else if (socket.readyState === WebSocket.CONNECTING) {
        console.log('readyState::CONNECTING');
        setTimeout(() => {
          socket.send(JSON.stringify(data));
        }, 2000);
      }
    }
  };

  const askedForAuthorization = permission => {
    if (typeof authorizationFor === 'undefined') return false;
    if (typeof authorizationFor === 'string') {
      if (authorizationFor === permission) return true;
    } else if (typeof authorizationFor === 'object') {
      if (authorizationFor.indexOf(permission) >= 0) return true;
    }
    return false;
  };

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
        } else if (data.msg_type === 'contracts_for') {
          setSelectedStock({
            ...selectedStock,
            contract: data.contracts_for,
          });
        } else if (data.msg_type === 'buy') {
          console.log({ buy: data.buy });
          setCurrentOperation({ ...currentOperation, contract: data.buy });
        } else if (data.msg_type === 'sell') {
          console.log({ buy: data.sell });
          setCurrentOperation({ ...currentOperation, contract: data.sell });
        }
      }
    }
  };

  socket.onerror = function (error) {
    console.log(`[error]`, { error });
  };

  const openSocket = () => {
    socket = new WebSocket(
      `wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`
    );
  };

  const onStockSelection = async stock => {
    if (stock.symbol === selectedStock?.symbol) return;
    if (selectedStock) {
      // if (socket.readyState === WebSocket.CLOSED) {
      //   openSocket();
      // }
      console.log({ selectedStock });
      //unsubscribing from previous stock
      // send({ forget: selectedStock.subscription.id });
      send({ forget_all: 'ticks' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      // setSelectedStock(null);
    }
    setSelectedStock(stock);
    setActiveTab('selectedStock');
  };

  const ping = () => {
    send({ ping: 1 });
  };

  const authorize = () => {
    console.log('AUTHORIZE');
    send({
      authorize: botToken,
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'stocks':
        return <StocksScreen onStockSelection={onStockSelection} />;
      case 'selectedStock':
        return (
          <>
            <SelectedStockScreen>
              <OpenContract takeProfitAt={takeProfitAt} />
            </SelectedStockScreen>
          </>
        );
      case 'operations':
        return <Text>Operations Tab</Text>;
      default:
        return null;
    }
  };

  React.useEffect(() => {
    ping();
    // toast.show('Welcome to Binary Bot');

    setTimeout(() => {
      // setAuthorizationFor(['proposal_open_contract', 'balance']);
    }, 1000);

    setInterval(() => {
      ping();
    }, 30000);
  }, []);

  React.useEffect(() => {
    const authorizables = ['proposal_open_contract', 'buy', 'sell', 'balance'];
    console.log({ authorizationFor });
    if (!authorizationFor) return;
    if (typeof authorizationFor === 'string') {
      if (authorizables.indexOf(authorizationFor) >= 0) {
        authorize();
      }
    } else if (typeof authorizationFor === 'object') {
      authorizables.forEach(auth => {
        if (authorizationFor.indexOf(auth) >= 0) {
          authorize();
        }
      });
    }
  }, [authorizationFor]);

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
