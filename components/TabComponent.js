import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity, View } from 'react-native';

const TabComponent = ({ tabs = [] }) => {
  const [activeTab, setActiveTab] = useState('stocks');

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {tabs.map((tab, index) => {
          return (
            <Tab
              key={index}
              active={activeTab === tab.id}
              label={tab.label}
              onPress={() => setActiveTab(tab.id)}
            />
          );
        })}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

TabComponent.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      component: PropTypes.element.isRequired,
    })
  ).isRequired,
};

// -------------------- TAB ELEMENT --------------------

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

Tab.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func,
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

export default TabComponent;
