// @flow

import type { Dispatch } from 'redux'

import { connect } from 'react-redux'
import Dashboard from '../components/Dashboard'
import type { LanguageResourceCacheStateType, StateType } from '../../../modules/app/StateType'
import withTheme from '../../../modules/theme/hocs/withTheme'
import withRouteCleaner from '../../../modules/endpoint/hocs/withRouteCleaner'
import CategoriesRouteStateView from '../../../modules/app/CategoriesRouteStateView'
import type { StoreActionType } from '../../../modules/app/StoreActionType'
import { type TFunction, withTranslation } from 'react-i18next'
import type { NavigationScreenProp } from 'react-navigation'
import type { StatusPropsType } from '../../../modules/endpoint/hocs/withPayloadProvider'
import withPayloadProvider from '../../../modules/endpoint/hocs/withPayloadProvider'
import { CityModel } from '@integreat-app/integreat-api-client'
import React from 'react'
import createNavigateToCategory from '../../../modules/app/createNavigateToCategory'
import createNavigateToEvent from '../../../modules/app/createNavigateToEvent'
import createNavigateToInternalLink from '../../../modules/app/createNavigateToInternalLink'
import createNavigateToPoi from '../../../modules/app/createNavigateToPoi'
import createNavigateToOffers from '../../../modules/app/createNavigateToOffers'
import { mapProps } from 'recompose'
import createNavigateToNews from '../../../modules/app/createNavigateToNews'

type RefreshPropsType = {|
  cityCode: string,
  language: string,
  path: string,
  navigation: NavigationScreenProp<*>
|}

type ContainerPropsType = {|
  navigation: NavigationScreenProp<*>,
  language: string,
  cityCode: string,
  cities: $ReadOnlyArray<CityModel>,
  stateView: CategoriesRouteStateView,
  resourceCache: LanguageResourceCacheStateType,
  dispatch: Dispatch<StoreActionType>
|}

type OwnPropsType = {| navigation: NavigationScreenProp<*>, t: TFunction |}
type StatePropsType = StatusPropsType<ContainerPropsType, RefreshPropsType>
type DispatchPropsType = {| dispatch: Dispatch<StoreActionType> |}
type PropsType = {| ...OwnPropsType, ...StatePropsType, ...DispatchPropsType |}

const refresh = (refreshProps: RefreshPropsType, dispatch: Dispatch<StoreActionType>) => {
  const { cityCode, language, navigation, path } = refreshProps
  const navigateToDashboard = createNavigateToCategory('Dashboard', dispatch, navigation)
  navigateToDashboard({
    cityCode, language, path, forceRefresh: true, key: navigation.state.key
  })
}

const createChangeUnavailableLanguage = (city: string, t: TFunction) =>
  (dispatch: Dispatch<StoreActionType>, newLanguage: string) => {
    dispatch({
      type: 'SWITCH_CONTENT_LANGUAGE',
      params: { newLanguage, city, t }
    })
  }

const mapStateToProps = (state: StateType, ownProps: OwnPropsType): StatePropsType => {
  const { t, navigation } = ownProps
  if (!state.cityContent) {
    return { status: 'routeNotInitialized' }
  }
  const { resourceCache, categoriesRouteMapping, switchingLanguage, languages } = state.cityContent
  const route = categoriesRouteMapping[navigation.state.key]
  if (!route) {
    return { status: 'routeNotInitialized' }
  }

  if (state.cities.status === 'loading' || switchingLanguage || route.status === 'loading' ||
    languages.status === 'loading') {
    return { status: 'loading' }
  }

  if (route.status === 'languageNotAvailable') {
    if (languages.status === 'error') {
      console.error('languageNotAvailable status impossible if languages not ready')
      return { status: 'error', refreshProps: null, code: languages.code, message: languages.message }
    }
    return {
      status: 'languageNotAvailable',
      availableLanguages: languages.models.filter(lng => route.allAvailableLanguages.has(lng.code)),
      cityCode: route.city,
      changeUnavailableLanguage: createChangeUnavailableLanguage(route.city, t)
    }
  }

  const refreshProps = {
    cityCode: route.city,
    language: route.language,
    path: route.path,
    navigation: ownProps.navigation
  }

  if (state.cities.status === 'error') {
    return { status: 'error', refreshProps, message: state.cities.message, code: state.cities.code }
  } else if (resourceCache.status === 'error') {
    return { status: 'error', refreshProps, message: resourceCache.message, code: resourceCache.code }
  } else if (route.status === 'error') {
    return { status: 'error', refreshProps, message: route.message, code: route.code }
  } else if (languages.status === 'error') {
    return { status: 'error', message: languages.message, code: languages.code, refreshProps }
  }

  const cities = state.cities.models
  const stateView = new CategoriesRouteStateView(route.path, route.models, route.children)
  return {
    status: 'success',
    refreshProps,
    innerProps: {
      navigation,
      cityCode: route.city,
      language: route.language,
      cities,
      stateView,
      resourceCache: resourceCache.value
    }
  }
}

const mapDispatchToProps = (dispatch: Dispatch<StoreActionType>): DispatchPropsType => ({ dispatch })

const ThemedTranslatedDashboard = withTranslation('dashboard')(
  withTheme(Dashboard)
)

const DashboardContainer = (props: ContainerPropsType) => {
  const { dispatch, ...rest } = props
  return <ThemedTranslatedDashboard
    {...rest}
    navigateToPoi={createNavigateToPoi(dispatch, rest.navigation)}
    navigateToCategory={createNavigateToCategory('Categories', dispatch, rest.navigation)}
    navigateToEvent={createNavigateToEvent(dispatch, rest.navigation)}
    navigateToNews={createNavigateToNews(dispatch, rest.navigation)}
    navigateToInternalLink={createNavigateToInternalLink(dispatch, rest.navigation)}
    navigateToDashboard={createNavigateToCategory('Dashboard', dispatch, rest.navigation)}
    navigateToOffers={createNavigateToOffers(dispatch, rest.navigation)} />
}

type RestType = $Diff<PropsType, OwnPropsType>
const removeOwnProps = (props: PropsType): RestType => {
  const { t, navigation, ...rest } = props
  return rest
}

export default withRouteCleaner<{| navigation: NavigationScreenProp<*> |}>(
  withTranslation('error')(
    connect<PropsType, OwnPropsType, _, _, _, _>(mapStateToProps, mapDispatchToProps)(
      mapProps<RestType, PropsType>(removeOwnProps)(
        withPayloadProvider<ContainerPropsType, RefreshPropsType>(refresh)(
          DashboardContainer
        )))))
