import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import TradingScreen from './screens/TradingScreen';
import OverlapElementsContext from './contexts/OverlapElementsContext';
import useToast from './components/Toast/useToast';
import Toast from './components/Toast/Toast';
import useLoader from './components/Loader/useLoader';
import Loader from './components/Loader/Loader';
import Balance from './components/Balance';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <OverlapElementsContext.Provider
        value={{
          loader: useLoader(),
          toast: useToast(),
        }}
      >
        <Toast />
        <Loader />
        <View style={styles.container}>
          <StatusBar barStyle="default" animated="true" />
          <Balance />
          <TradingScreen />
        </View>
      </OverlapElementsContext.Provider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
