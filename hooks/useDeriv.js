import React, { useEffect, useState } from 'react';

const useDeriv = () => {
  const botToken = 'utpD7uT32mi0Mck';
  const app_id = 1089; // Replace with your app_id or leave as 1089 for testing.
  let socket = new WebSocket(
    `wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`
  );

  const [authorizationFor, setAuthorizationFor] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [openContract, setOpenContract] = useState(null);
  const [stockList, setStockList] = useState(null);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [takeProfitAt, setTakeProfitAt] = useState(5);
  const [selectedStock, setSelectedStock] = useState(null);

  const send = data => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      if (typeof data.ping === 'undefined')
        console.log('readyState::OPEN', data);
      // updateState(data);
      socket.send(JSON.stringify(data));
    } else {
      //reopen socket
      if (socket.readyState === WebSocket.CLOSED) {
        console.log('readyState::CLOSED');
        openSocket();
        setTimeout(() => {
          socket.send(JSON.stringify(data));
          updateState(data);
        }, 1000);
      } else if (socket.readyState === WebSocket.CLOSING) {
        console.log('readyState::CLOSING');
        setTimeout(() => {
          openSocket();
          setTimeout(() => {
            socket.send(JSON.stringify(data));
            updateState(data);
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

  const updateState = data => {
    if (typeof data.buy !== 'undefined') {
      setCurrentOperation({
        price: price,
        payout: selectedStock.proposal.payout,
        ask_price: selectedStock.proposal.ask_price,
        symbol: selectedStock.symbol,
      });
    }
  };

  socket.onmessage = async function (event) {
    if (event.data) {
      const data = JSON.parse(event.data);
      // console.log(data.msg_type, Object.keys(data));
      if (data) {
        if (data.msg_type === 'error') {
          console.log({ error: data.error });
          return;
        } else if (data.msg_type === 'authorize') {
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
              subscription: data.subscription,
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

  const getList = () => {
    console.log('>> getList');
    send({
      active_symbols: 'brief',
      product_type: 'basic',
    });
  };

  const getHistory = () => {
    //get the last 27 ticks
    send({
      ticks_history: selectedStock.symbol,
      adjust_start_time: 1,
      count: 27,
      end: 'latest',
      start: 1,
      style: 'ticks',
      subscribe: 1,
    });
    //subscribe to ticks
    // send({
    //   ticks: selectedStock.symbol,
    //   subscribe: 1,
    // });
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
    send({
      authorize: botToken,
    });
  };

  const buy = () => {
    if (!selectedStock) return;
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
  };

  const sell = () => {
    send({
      sell: openContract.contract_id,
    });
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
    if (!selectedStock) return;
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
  };

  useEffect(() => {
    getList();
    setAuthorizationFor('openContracts');

    setInterval(() => {
      ping();
    }, 30000);
  }, []);

  return {
    socket,
    send,
    getList,
    getHistory,
    getOpenContracts,
    ping,
    authorize,
    buy,
    sell,
    takeProfit,
    getProposal,
    stockList,
    currentOperation,
    openContract,
    loading,
    setLoading,
    takeProfitAt,
    setTakeProfitAt,
    selectedStock,
    setSelectedStock,
  };
};

export default useDeriv;
