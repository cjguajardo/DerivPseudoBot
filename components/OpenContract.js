import React, { useState, useEffect, useContext, memo } from 'react';
import { View, Text } from 'react-native';
import ws from '../services/DerivWebSocket';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import WebSocketContext from '../contexts/WebSocketContext';
import { getFormatedDate } from '../utils/DateFunctions';
import OverlapElementsContext from '../contexts/OverlapElementsContext';

const OpenContract = ({ takeProfitAt = null }) => {
  const socket = ws.openSocket();
  const { toast } = useContext(OverlapElementsContext);
  // const { selectedSymbol } = useContext(WebSocketContext);
  const [openContract, setOpenContract] = useState(null);
  const [currency, setCurrency] = useState('');
  const [limitOrder, setLimitOrder] = useState({
    take_profit: 0,
    stop_loss: 0,
  });
  const [canUpdateContract, setCanUpdateContract] = useState(false);
  const [updateContractTries, setUpdateContractTries] = useState(0);

  const updateContract = (profit, contract_id) => {
    const setStopLoss = openContract && openContract.profit > 0;

    const data = {
      contract_update: 1,
      contract_id: contract_id,
      limit_order: {
        take_profit: profit,
      },
    };

    if (setStopLoss) {
      const stop_loss = parseFloat((openContract.profit * 0.9).toFixed(2));
      if (limitOrder.stop_loss < stop_loss) {
        data.limit_order = {
          take_profit: parseFloat((profit * 100).toFixed(2)),
          stop_loss: stop_loss,
        };
      }
    }

    console.log('updateContract', { data });

    socket.send(JSON.stringify(data));
  };

  useEffect(() => {
    socket.onopen = () => {
      // console.log('socket.onopen');
      socket.send(
        JSON.stringify({
          authorize: ws.botToken,
          passthrough: { authorize: 'proposal_open_contract' },
        })
      );
    };

    socket.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data) {
        if (data.msg_type === 'authorize') {
          console.log('authorize', { authorize: data.passthrough?.authorize });
          if (data.passthrough.authorize === 'proposal_open_contract') {
            socket.send(
              JSON.stringify({ proposal_open_contract: 1, subscribe: 1 })
            );
          } else if (data.passthrough.authorize === 'update_contract') {
            updateContract(openContract.profit * 2, openContract.contract_id);
          }
        } else if (data.msg_type === 'proposal_open_contract') {
          // console.log('proposal_open_contract', { data });
          if (typeof data.proposal_open_contract === 'undefined') return;
          if (Object.keys(data.proposal_open_contract).length === 0) return;

          setOpenContract(data.proposal_open_contract);

          setTimeout(() => {
            const status = data.proposal_open_contract?.status || '';
            if (['won', 'lost', 'sold'].indexOf(status) >= 0) {
              setOpenContract(null);
              toast.show(`Contract  ${status.toUpperCase()}`);
            } else {
              if (canUpdateContract || true) {
                if (
                  typeof data.proposal_open_contract.profit !== 'undefined' &&
                  parseInt(data.proposal_open_contract.profit) >= 0
                ) {
                  socket.send(
                    JSON.stringify({
                      authorize: ws.botToken,
                      passthrough: { authorize: 'update_contract' },
                    })
                  );
                }
              }
            }
          }, 1000);
        } else if (data.msg_type === 'contract_update') {
          console.log('contract_update', { data });
          setOpenContract(data.contract_update);
          if (data.error) {
            console.log('contract_update', {
              error: data.error,
              canUpdateContract,
            });
            setLimitOrder({ take_profit: 0, stop_loss: 0 });
            setCanUpdateContract(false);
            setUpdateContractTries(1);
          } else {
            setLimitOrder({
              take_profit: data.contract_update.take_profit.order_amount,
              stop_loss: data.contract_update.stop_loss.order_amount,
            });
            setUpdateContractTries(updateContractTries + 1);
          }
        }
      }
    };

    AsyncStorage.getItem('currency').then(value => {
      setCurrency(value);
    });
  }, []);

  useEffect(() => {
    const tryUpdateContract =
      openContract != null &&
      typeof openContract.contract_id != 'undefined' &&
      openContract.profit > 0;

    // console.log({ tryUpdateContract, updateContractTries, canUpdateContract });

    if (tryUpdateContract && updateContractTries <= 1) {
      // console.log({ openContract });
      setTimeout(() => {
        socket.send(
          JSON.stringify({
            authorize: ws.botToken,
            passthrough: { authorize: 'update_contract' },
          })
        );
      }, 1000);
    }
  }, [openContract]);

  return (
    <>
      {openContract && (
        <View style={styles.openContracts}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Open Contract
          </Text>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
            {openContract.display_name}
          </Text>
          <Text
            style={{
              textAlign: 'center',
              color: openContract.profit < 0 ? 'red' : 'green',
            }}
          >
            {openContract.profit} {currency}
          </Text>
          <Text style={{ textAlign: 'center' }}>
            {openContract.contract_type} {openContract.entry_spot}
          </Text>
          {limitOrder.take_profit > 0 && (
            <>
              <Text style={{ textAlign: 'center' }}>
                Take profit at: {limitOrder.take_profit} {currency}
              </Text>
              <Text style={{ textAlign: 'center' }}>
                Stop loss at: {limitOrder.stop_loss} {currency}
              </Text>
            </>
          )}
          <Text style={{ textAlign: 'center' }}>
            {getFormatedDate(openContract.expiry_date)}
          </Text>
        </View>
      )}
    </>
  );
};

const styles = {
  openContracts: {
    maxHeight: '30%',
    backgroundColor: '#ffedea',
    borderRadius: 16,
    padding: 10,
  },
};

export default memo(OpenContract);
