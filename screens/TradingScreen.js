import React, { useState, Context } from 'react';
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
  const [stockList, setStockList] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [authorizationFor, setAuthorizationFor] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [currentOperation, setCurrentOperation] = useState(null);
  const [openContract, setOpenContract] = useState(null);

  const app_id = 1089; // Replace with your app_id or leave as 1089 for testing.
  let socket = new WebSocket(
    `wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`
  );

  const send = (data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      if (typeof data.ping === 'undefined')
        console.log('readyState::OPEN', data);
      socket.send(JSON.stringify(data));
    } else {
      //reopen socket
      if (socket.readyState === WebSocket.CLOSED) {
        console.log('readyState::CLOSED');
        openSocket();
        setTimeout(() => {
          socket.send(JSON.stringify(data));
        }, 1000);
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
        }, 1000);
      }
    }
  };

  socket.onmessage = async function (event) {
    if (event.data) {
      const data = JSON.parse(event.data);
      // console.log(data.msg_type, Object.keys(data));
      if (data) {
        if (data.error) {
          console.log({ error: data.error });
          return;
        }

        if (data.msg_type === 'authorize') {
          setCurrency(data.authorize.currency);
          console.log({ authorizationFor, data });
          if (authorizationFor === 'buy') {
            buy();
          } else if (authorizationFor === 'openContracts') {
            getOpenContracts();
          }

          setAuthorizationFor(null);
          return;
        } else if (data.msg_type === 'forget') {
          console.log({ forget: data });
          return;
        } else if (data.msg_type === 'active_symbols') {
          setStockList(data.active_symbols);
        } else if (data.msg_type === 'history') {
          setSelectedStock({
            ...selectedStock,
            history: data.history,
            subscription: data.subscription,
          });
        } else if (data.msg_type === 'tick') {
          if (selectedStock && typeof selectedStock.history !== 'undefined') {
            const _history = selectedStock.history;
            // remove the first element
            _history.prices?.shift();
            _history.times?.shift();
            // add the new element
            _history.prices.push(data.tick.quote);
            _history.times.push(data.tick.epoch);
            setSelectedStock({
              ...selectedStock,
              history: _history,
              tick: data.tick,
            });
          }
        } else if (data.msg_type === 'contracts_for') {
          setSelectedStock({
            ...selectedStock,
            contract: data.contracts_for,
          });
        } else if (data.msg_type === 'proposal') {
          setSelectedStock({ ...selectedStock, proposal: data.proposal });
          setTimeout(() => {
            setAuthorizationFor('buy');
          }, 200);
        } else if (data.msg_type === 'buy') {
          console.log({ buy: data.buy });
          setCurrentOperation({ ...currentOperation, contract: data.buy });
        } else if (data.msg_type === 'sell') {
          console.log({ buy: data.sell });
          setCurrentOperation({ ...currentOperation, contract: data.sell });
        } else if (data.msg_type === 'proposal_open_contract') {
          setOpenContract(data.proposal_open_contract);
          if (
            ['won', 'lost', 'sold'].indexOf(
              data.proposal_open_contract.status
            ) >= 0
          ) {
            setOpenContract(null);
          } else {
            if (parseInt(data.proposal_open_contract.profit) >= takeProfitAt) {
              takeProfit(takeProfitAt, data.proposal_open_contract.contract_id);
            }
          }
        }
      }
    }
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      consloe.log(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
      );
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
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

  const onStockSelection = async (stock) => {
    if (stock.symbol === selectedStock?.symbol) return;
    if (selectedStock) {
      // if (socket.readyState === WebSocket.CLOSED) {
      //   openSocket();
      // }
      console.log({ selectedStock });
      //unsubscribing from previous stock
      send({ forget: selectedStock.subscription.id });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // setSelectedStock(null);
    }
    setSelectedStock(stock);
    setActiveTab('selectedStock');
  };

  const getList = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      send({
        active_symbols: 'brief',
        product_type: 'basic',
      });
    }
  };

  const getHistory = () => {
    if (selectedStock && socket && socket.readyState === WebSocket.OPEN) {
      send({
        ticks_history: selectedStock.symbol,
        adjust_start_time: 1,
        count: 27,
        end: 'latest',
        start: 1,
        style: 'ticks',
        subscribe: 1,
      });
    }
  };

  const getOpenContracts = () => {
    send({
      proposal_open_contract: 1,
      subscribe: 1,
    });
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

  const buy = () => {
    if (selectedStock && socket && socket.readyState === WebSocket.OPEN) {
      const price = (
        selectedStock.proposal.ask_price * selectedStock.proposal.payout
      ).toFixed(2);
      send({
        buy: 1,
        parameters: {
          amount: 10,
          basis: 'payout',
          contract_type: 'CALL',
          symbol: selectedStock.symbol,
          currency: currency,
          duration: 30,
          duration_unit: 'm',
        },
        price: price,
        subscribe: 1,
      });
      setCurrentOperation({
        price: price,
        payout: selectedStock.proposal.payout,
        ask_price: selectedStock.proposal.ask_price,
        symbol: selectedStock.symbol,
      });
    }
  };

  const sell = () => {
    if (currentOperation && socket && socket.readyState === WebSocket.OPEN) {
      send({
        sell: openContract.contract_id,
      });
    }
  };

  const takeProfit = (profit, contract_id) => {
    send({
      contract_update: 1,
      contract_id: contract_id,
      limit_order: {
        take_profit: profit,
      },
    });
  };

  const getProposal = (contract_type = 'CALL') => {
    if (socket.readyState !== WebSocket.OPEN) {
      openSocket();
    }
    if (selectedStock && socket && socket.readyState === WebSocket.OPEN) {
      send({
        proposal: 1,
        amount: 10,
        basis: 'stake',
        contract_type: contract_type,
        currency: 'USD',
        duration: 30,
        duration_unit: 'm',
        symbol: selectedStock.symbol,
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'stocks':
        return (
          <StocksScreen
            onStockSelection={onStockSelection}
            refreshData={getList}
          />
        );
      case 'selectedStock':
        return (
          <>
            <SelectedStockScreen
              getHistory={getHistory}
              getProposal={getProposal}
            >
              {openContract && (
                <OpenContract
                  openContract={openContract}
                  currency={currency}
                  takeProfitAt={takeProfitAt}
                />
              )}
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
    getList();
    setAuthorizationFor('openContracts');

    setInterval(() => {
      ping();
    }, 30000);
  }, []);

  React.useEffect(() => {
    console.log({ authorizationFor, openContract });
    if (['openContracts', 'buy'].indexOf(authorizationFor) >= 0) {
      authorize();
    }
  }, [authorizationFor]);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Tab
          active={activeTab === 'stocks'}
          label="Stocks"
          onPress={() => setActiveTab('stocks')}
        />
        <Tab
          active={activeTab === 'selectedStock'}
          label={selectedStock ? selectedStock.display_name : 'Selected Stock'}
          onPress={() => setActiveTab('selectedStock')}
        />
        <Tab
          active={activeTab === 'operations'}
          label="Operations"
          onPress={() => setActiveTab('operations')}
        />
      </View>
      <View style={styles.content}>
        <WebSocketContext.Provider value={{ socket, stockList, selectedStock }}>
          {renderContent()}
        </WebSocketContext.Provider>
      </View>
    </View>
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
