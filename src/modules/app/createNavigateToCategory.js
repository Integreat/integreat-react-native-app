// @flow

import type { Dispatch } from 'redux'
import type { FetchLanguagesForCategoryActionType, StoreActionType } from './StoreActionType'
import type { NavigationScreenProp } from 'react-navigation'
import { generateKey } from './generateRouteKey'

export default (
  routeName: 'Categories' | 'Dashboard',
  dispatch: Dispatch<StoreActionType>,
  navigation: NavigationScreenProp<*>
) => (cityCode: string, language: string, path: string, forceUpdate: boolean = false, key: string = generateKey()) => {
  navigation.navigate({
    routeName,
    params: {
      cityCode,
      key,
      onRouteClose: () => dispatch({type: 'CLEAR_CATEGORY', params: {key}})
    },
    key
  })

  const fetchLanguagesForCategory: FetchLanguagesForCategoryActionType = {
    type: 'FETCH_LANGUAGES_FOR_CATEGORY',
    params: {city: cityCode, language, path, depth: 2, forceUpdate, key}
  }

  return dispatch(fetchLanguagesForCategory)
}
