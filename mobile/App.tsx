import React from 'react';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useNotificationSetup } from './src/hooks/useNotificationSetup';

enableScreens();

function NotificationWrapper() {
  useNotificationSetup();
  return null;
}

const App = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <NotificationWrapper />
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;
