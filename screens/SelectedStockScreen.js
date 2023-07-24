import React, { memo, useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  Button,
  Dimensions,
  Pressable,
  StyleSheet,
} from 'react-native';
import WebSocketContext from '../contexts/WebSocketContext';
import StockInfo from '../components/StockInfo';
import { determineTrend } from '../utils/ChartFunctions';
// import { LineChart } from 'react-native-chart-kit';
import { CandlestickChart, LineChart } from 'react-native-wagmi-charts';
import ws from '../services/DerivWebSocket';
import OverlapElementsContext from '../contexts/OverlapElementsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

import Trend from '../components/Trend';

const maxZoomOut = 100;
const maxZoomIn = 30;

const SelectedStockScreen = ({ children }) => {
  const socket = ws.openSocket();
  const { loader } = useContext(OverlapElementsContext);
  const { selectedSymbol } = useContext(WebSocketContext);

  const [selectedStock, setSelectedStock] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [candleChartData, setCandleChartData] = useState([]);
  const [periods, setPeriods] = useState(60);
  const [trend, setTrend] = useState('');
  const [lastTick, setLastTick] = useState({});
  const [trendCounter, setTrendCounter] = useState({
    ALZA: 0,
    BAJA: 0,
  });
  const [currentOperation, setCurrentOperation] = useState(null);

  const getTrendCounterDownPercentaje = () => {
    const _total = trendCounter['ALZA'] + trendCounter['BAJA'];
    const _percentaje = (trendCounter['BAJA'] / _total) * 100;
    if (isNaN(_percentaje)) return '0%';
    return `${_percentaje.toFixed(1)}%`;
  };

  const getTrendCounterUpPercentaje = () => {
    const _total = trendCounter['ALZA'] + trendCounter['BAJA'];
    const _percentaje = (trendCounter['ALZA'] / _total) * 100;
    if (isNaN(_percentaje)) return '0%';
    return `${_percentaje.toFixed(1)}%`;
  };

  const getHistory = async () => {
    loader.show();
    const stocks = await AsyncStorage.getItem('stocks');
    const _stocks = JSON.parse(stocks);
    const _selectedStock = _stocks.find(
      stock => stock.symbol === selectedSymbol
    );

    setSelectedStock(_selectedStock);

    socket.send(
      JSON.stringify({
        ticks_history: selectedSymbol,
        adjust_start_time: 1,
        count: 200,
        end: 'latest',
        start: 1,
        style: 'candles',
        passthrough: {
          get: 'history',
        },
      })
    );
  };

  const getOHLC = () => {
    socket.send(
      JSON.stringify({
        ticks_history: selectedSymbol,
        adjust_start_time: 1,
        count: 1,
        end: 'latest',
        start: 1,
        style: 'candles',
        passthrough: {
          get: 'candles',
        },
        subscribe: 1,
      })
    );
  };

  const trimChartData = () => {
    //returns a new array with the last 60 elements
    if (candleChartData.length > periods) {
      return candleChartData.slice(
        candleChartData.length - periods,
        candleChartData.length
      );
    }
    return candleChartData;
  };

  const getProposal = (contract_type = 'CALL') => {
    socket.send(
      JSON.stringify({
        proposal: 1,
        amount: 10,
        basis: 'stake',
        contract_type: contract_type,
        currency: 'USD',
        duration: contract_type === 'CALL' ? 30 : 5,
        duration_unit: contract_type === 'CALL' ? 'm' : 'h',
        symbol: selectedSymbol,
      })
    );
  };

  const zoomInChart = () => {
    if (periods > maxZoomIn) {
      setPeriods(periods - 10);
    }
  };
  const zoomOutChart = () => {
    if (periods < maxZoomOut) {
      setPeriods(periods + 10);
    }
  };

  const getLinealData = () => {
    const _data = trimChartData();
    if (_data.length === 0) return [];
    const _linealData = _data.map((value, index) => {
      return {
        timestamp: value.timestamp,
        value: value.close,
      };
    });
    return _linealData;
  };

  const buy = () => {
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
  };

  const sell = () => {
    socket.send({
      sell: openContract.contract_id,
    });
    setCurrentOperation({
      price: price,
      payout: selectedStock.proposal.payout,
      ask_price: selectedStock.proposal.ask_price,
      symbol: selectedStock.symbol,
    });
  };

  React.useEffect(() => {
    if (stockHistory != null && typeof stockHistory !== 'undefined') {
      // calculate the stock trend
      const _trend = determineTrend(stockHistory);
      setTrend(_trend);
      setTrendCounter({
        ...trendCounter,
        [_trend]: trendCounter[_trend] + 1,
      });

      if (_trend === 'INDEFINIDA') {
        if (currentOperation === null) {
          const _contract_type =
            trendCounter['ALZA'] > trendCounter['BAJA'] ? 'CALL' : 'PUT';

          // getProposal(_contract_type);
        }
      }
    }
  }, [stockHistory]);

  useEffect(() => {
    socket.onopen = () => {
      socket.send(JSON.stringify({ forget_all: 'candles' }));
      // console.log('socket.onopen');
      getHistory();
    };

    socket.onmessage = async e => {
      const data = JSON.parse(e.data);
      if (data) {
        // console.log({ data });
        if (data.msg_type === 'proposal') {
          console.log('PROPOSAL', { data });
          if (typeof data.error != 'undefined') {
            console.log('PROPOSAL ERROR', { data });
            return;
          }
          setSelectedStock({ ...selectedStock, proposal: data.proposal });
          setTimeout(() => {
            setAuthorizationFor(
              data.echo_req.contract_type === 'CALL' ? 'buy' : 'sell'
            );
          }, 200);
        } else if (data.msg_type === 'candles') {
          if (data.passthrough.get === 'history') {
            const _history = data.candles.map((candle, index) => {
              return candle.close;
            });

            const _candleData = data.candles.map((candle, index) => {
              return {
                timestamp: candle.epoch,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                value: candle.close,
              };
            });

            setStockHistory(_history);
            setCandleChartData(_candleData);
            setLastTick(data.candles[data.candles.length - 1]);

            await AsyncStorage.setItem(
              'candleChartData',
              JSON.stringify(_candleData)
            );
            await AsyncStorage.setItem(
              'stockHistory',
              JSON.stringify(_history)
            );

            setTimeout(() => {
              // getOHLC();
            }, 1000);
          }
        } else if (data.msg_type === 'ohlc') {
          console.log('OHLC', { data });
          if (lastTick.epoch !== data.ohlc.epoch) {
            setLastTick(data.ohlc);
          }

          let _candleChartData = [...candleChartData];

          if (_candleChartData.length === 0) {
            let _candleData = await AsyncStorage.getItem('candleChartData');
            if (_candleData) {
              _candleData = JSON.parse(_candleData);
              _candleChartData = _candleData;
            }
          }
          if (_candleChartData.length >= 60) {
            _candleChartData.shift();
          }

          const candleIndex = _candleChartData.findIndex(
            candle => candle.timestamp === data.ohlc.epoch
          );

          if (candleIndex === -1) {
            _candleChartData.push({
              timestamp: data.ohlc.epoch,
              open: data.ohlc.open,
              high: data.ohlc.high,
              low: data.ohlc.low,
              close: data.ohlc.close,
              value: data.ohlc.close,
            });
          } else {
            if (_candleChartData[candleIndex].close !== data.ohlc.close) {
              _candleChartData[candleIndex] = {
                timestamp: data.ohlc.epoch,
                open: data.ohlc.open,
                high: data.ohlc.high,
                low: data.ohlc.low,
                close: data.ohlc.close,
                value: data.ohlc.close,
              };
            }
          }

          const _history = _candleChartData.map(candle => candle.close);

          setCandleChartData(_candleChartData);
          setStockHistory(_history);
        }
      }
      loader.hide();
    };
  }, []);

  return (
    <View>
      {selectedStock && (
        <>
          <StockInfo stock={selectedStock} />

          <View style={styles.chartContainer}>
            <View style={styles.buttons}>
              <Pressable title="Get Data" onPress={getHistory}>
                <FontAwesome name="refresh" size={24} color="#671B8C" />
              </Pressable>
              <Pressable
                onPress={zoomOutChart}
                disabled={periods >= maxZoomOut}
              >
                <FontAwesome
                  name="search-minus"
                  size={24}
                  color={periods >= maxZoomOut ? '#90A4AE' : '#671B8C'}
                />
              </Pressable>

              <Pressable onPress={zoomInChart} disabled={periods <= maxZoomIn}>
                <FontAwesome
                  name="search-plus"
                  size={24}
                  color={periods <= maxZoomIn ? '#90A4AE' : '#671B8C'}
                />
              </Pressable>
            </View>

            <CandlestickChart.Provider data={trimChartData()}>
              <CandlestickChart
                width={Dimensions.get('screen').width * 0.9}
                height={Dimensions.get('screen').height * 0.4}
              >
                <CandlestickChart.Candles />
              </CandlestickChart>
            </CandlestickChart.Provider>
          </View>

          <Text style={{ textAlign: 'center' }}>Stock Trend</Text>
          <Trend trend={trend} price={lastTick.close} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginTop: 20,
            }}
          >
            <Trend
              trend="BAJA"
              percentaje={getTrendCounterDownPercentaje()}
              size="sm"
            />
            <Trend
              trend="ALZA"
              percentaje={getTrendCounterUpPercentaje()}
              size="sm"
            />
          </View>
          {currentOperation && (
            <View>
              <Text>Current Operation</Text>
              <Text>Operation: {currentOperation.operation}</Text>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginTop: 20,
            }}
          >
            <Button title="PUT" onPress={() => getProposal('PUT')} />
            <Button title="CALL" onPress={() => getProposal('CALL')} />
          </View>
        </>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'columns',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    backgroundColor: '#E0E0E099',
    height: 24 * 5,
    width: 24 * 1.5,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#E0E0E0',
    zIndex: 10,
  },
  chartContainer: {
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default SelectedStockScreen;
