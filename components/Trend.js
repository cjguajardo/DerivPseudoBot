import React, { memo } from 'react';
import { Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const Trend = ({ trend, percentaje = null, size = 'md', price = null }) => {
  const getTrendColor = () => {
    if (trend === 'BAJA') {
      return '#D9513F';
    } else if (trend === 'ALZA') {
      return '#4CAF50';
    } else {
      return '#CCCCCC';
    }
  };

  const getTrendArrow = () => {
    if (trend === 'BAJA') {
      return 'arrow-down';
    } else if (trend === 'ALZA') {
      return 'arrow-up';
    } else {
      return 'md-remove-circle-outline';
    }
  };

  const getFontSize = () => {
    if (size === 'sm') {
      return 14;
    } else if (size === 'md') {
      return 18;
    } else if (size === 'lg') {
      return 24;
    }
  };

  return (
    <Text
      style={{
        textAlign: 'center',
        fontSize: getFontSize(),
        fontWeight: 'bold',
        color: getTrendColor(),
      }}
    >
      <Ionicons
        name={getTrendArrow()}
        size={getFontSize()}
        color={getTrendColor()}
      />
      {trend}
      {percentaje && ` (${percentaje}%)`}
      {price && ` (${price})`}
    </Text>
  );
};

export default memo(Trend);
