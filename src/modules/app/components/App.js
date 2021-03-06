// @flow

import * as React from 'react'

import { Provider } from 'react-redux'
import I18nProviderContainer from '../../i18n/containers/I18nProviderContainer'
import createReduxStore from '../createReduxStore'
import IOSSafeAreaView from '../../../modules/platform/components/IOSSafeAreaView'
import StatusBarContainer from '../containers/StatusBarContainer'
import type { Store } from 'redux'
import type { StateType } from '../StateType'
import type { StoreActionType } from '../StoreActionType'
import DefaultDataContainer from '../../endpoint/DefaultDataContainer'
import type { DataContainer } from '../../endpoint/DataContainer'
import NavigatorContainer from '../containers/NavigatorContainer'
import { SafeAreaProvider } from 'react-native-safe-area-context'

class App extends React.Component<{||}> {
  dataContainer: DataContainer = new DefaultDataContainer()
  store: Store<StateType, StoreActionType> = createReduxStore(this.dataContainer)

  render () {
    return (
      <Provider store={this.store}>
        <I18nProviderContainer>
          <SafeAreaProvider>
          <>
            <StatusBarContainer />
            <IOSSafeAreaView>
              <NavigatorContainer />
            </IOSSafeAreaView>
          </>
          </SafeAreaProvider>
        </I18nProviderContainer>
      </Provider>
    )
  }
}

export default App
