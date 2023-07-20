import React from 'react';
import { View, Text } from 'react-native';

const OpenContract = ({ openContract, currency, takeProfitAt = null }) => {
  if (!openContract) return null;

  const getFormatedDate = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
    const dateString = formatter.format(date);
    return dateString;
  };

  return (
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
      {takeProfitAt && (
        <Text style={{ textAlign: 'center' }}>
          Take profit at: {takeProfitAt} {currency}
        </Text>
      )}
      <Text style={{ textAlign: 'center' }}>
        {getFormatedDate(openContract.expiry_date)}
      </Text>
    </View>
  );
};

const styles = {
  openContracts: {
    maxHeight: '30%',
    backgroundColor: '#ffedea',
    borderRadius: 16,
  },
};

export default OpenContract;
