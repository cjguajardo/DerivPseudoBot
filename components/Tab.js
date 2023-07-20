import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity } from 'react-native';

const Tab = ({ active = false, label, onPress = () => {} }) => {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.activeTab]}
      onPress={onPress}
    >
      <Text style={[active && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = {
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#eee',
  },
  activeTab: {
    backgroundColor: '#bada55',
    borderBottomWidth: 2,
    borderBottomColor: '#671B8C',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#671B8C',
  },
};

Tab.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func,
};

export default memo(Tab);
