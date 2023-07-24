import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import ws from '../services/DerivWebSocket';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Balance = () => {
  const socket = ws.openSocket();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('');

  useEffect(() => {
    socket.onopen = () => {
      // console.log('socket.onopen');
      socket.send(JSON.stringify({ authorize: ws.botToken }));
    };

    socket.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data) {
        if (data.msg_type === 'authorize') {
          socket.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        } else if (data.msg_type === 'balance') {
          // console.log('balance', { data });

          if (typeof data.balance !== 'undefined') {
            setBalance(data.balance.balance || 0);
            setCurrency(data.balance.currency);
            AsyncStorage.setItem('currency', data.balance.currency);
          }
        }
      }
    };
  }, []);

  return (
    <View>
      <Text>
        Balance: {balance} {currency}
      </Text>
    </View>
  );
};

export default Balance;
