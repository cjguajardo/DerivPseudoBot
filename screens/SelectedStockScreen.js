import React, { memo } from 'react';
import { View, Text, Button, Dimensions } from 'react-native';
import WebSocketContext from '../contexts/WebSocketContext';
import StockInfo from '../components/StockInfo';
import { determineTrend } from '../utils/ChartFunctions';
import { LineChart } from 'react-native-chart-kit';

import Trend from '../components/Trend';

const SelectedStockScreen = ({
  getHistory = () => {},
  getContract = () => {},
  getProposal = () => {},
  children,
}) => {
  const { selectedStock } = React.useContext(WebSocketContext);
  const [chartData, setChartData] = React.useState([]);
  const [chartLabels, setChartLabels] = React.useState([]);
  const [trend, setTrend] = React.useState('');
  const [trendCounter, setTrendCounter] = React.useState({
    ALZA: 0,
    BAJA: 0,
  });
  const [currentOperation, setCurrentOperation] = React.useState(null);

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

  React.useEffect(() => {
    getHistory();

    if (selectedStock && typeof selectedStock.history !== 'undefined') {
      // calculate the stock trend
      const _trend = determineTrend(selectedStock.history.prices);
      setTrend(_trend);
      setTrendCounter({
        ...trendCounter,
        [_trend]: trendCounter[_trend] + 1,
      });

      const _chartData = selectedStock.history.prices.map((price) => price);
      const _chartLabels = selectedStock.history.times.map((time) => time);

      // console.log({ _chartData, _chartLabels });
      setChartData(_chartData);
      setChartLabels(_chartLabels);

      if (_trend === 'INDEFINIDA') {
        if (currentOperation === null) {
          const _contract_type =
            trendCounter['ALZA'] > trendCounter['BAJA'] ? 'CALL' : 'PUT';

          // getProposal(_contract_type);
        }
      }
    }
  }, [selectedStock]);

  // console.log({ selectedStock });

  return (
    <View>
      <Text>Selected Stock Screen</Text>
      {selectedStock && (
        <>
          <StockInfo stock={selectedStock} />
          <Button title="Get Data" onPress={getHistory} />
          {chartData.length > 0 && (
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [
                  {
                    data: chartData,
                  },
                ],
              }}
              width={Dimensions.get('window').width - 32} // from react-native
              height={300}
              // yAxisLabel={'Rs'}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 5, // optional, defaults to 2dp
                color: (opacity = 1) => `rgba(186, 218, 85, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                propsForDots: {
                  r: '2',
                  strokeWidth: '1',
                  stroke: '#758C29',
                },
              }}
              withVerticalLabels={false}
              withHorizontalLines={false}
              withVerticalLines={false}
              bezier
              verticalLabelRotation={30}
              style={{
                // marginVertical: 8,
                borderRadius: 16,
              }}
            />
          )}
          <Text style={{ textAlign: 'center' }}>Stock Trend</Text>
          <Trend trend={trend} price={selectedStock.tick?.quote || ''} />

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

export default memo(SelectedStockScreen);
