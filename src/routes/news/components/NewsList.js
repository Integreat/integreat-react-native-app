// @flow

import * as React from 'react'
import { View, ActivityIndicator, ScrollView } from 'react-native'
import { TFunction, withTranslation } from 'react-i18next'
import { CityModel, NewsModel } from '@integreat-app/integreat-api-client'
import ContentNotFoundError from '../../../modules/error/ContentNotFoundError'
import List from './List'
import Failure from '../../../modules/error/components/Failure'
import type { ThemeType } from '../../../modules/theme/constants/theme'
import type { LanguageResourceCacheStateType } from '../../../modules/app/StateType'
import type { NavigationScreenProp } from 'react-navigation'
import type { NavigateToNewsParamsType } from '../../../modules/app/createNavigateToNews'
import withTheme from '../../../modules/theme/hocs/withTheme'
import SpaceBetween from '../../../modules/common/components/SpaceBetween'
import ErrorCodes from '../../../modules/error/ErrorCodes'
import NewsListItem from './NewsListItem'
import headerImage from '../assets/tu-news-header-details-icon.svg'
import styled from 'styled-components/native'
import { INTERNATIONAL } from '../containers/NewsContainer'
import { contentAlignment } from '../../../modules/i18n/contentDirection'

const Container: StyledComponent<{}, {}, *> = styled.View`
  align-items: center;
  margin-horizontal: 3%;
  flex: 1;
`

const HeaderImageWrapper: StyledComponent<{}, {}, *> = styled.View`
  width: 95%;
  align-self: center;
  align-items: flex-start;
  margin-top: 19px;
  border-radius: 5px;
  background-color: rgba(2, 121, 166, 0.4);
`
const HeaderImage: StyledComponent<{}, {}, *> = styled.Image`
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
`

const Row: StyledComponent<{}, ThemeType, *> = styled.View`
  flex-direction: row;
  border-radius: 5px;
  width: 95%;
  align-self: center;
  background-color: ${props => props.theme.colors.tunewsColor};
`

const ExtraInfo: StyledComponent<{}, ThemeType, *> = styled.Text`
  font-family: ${props => props.theme.fonts.decorativeFontBold};
  font-size: 12px;
  color: white;
  padding: 5px;
`

const NoNews: StyledComponent<{}, ThemeType, *> = styled.Text`
  color: ${props => props.theme.colors.textColor};
  font-family: ${props => props.theme.fonts.contentFontRegular};
  align-self: center;
  margin-top: 20px;
`

const NewsDetailsTitle: StyledComponent<{}, ThemeType, *> = styled.Text`
  font-weight: 700;
  font-family: ${props => props.theme.fonts.decorativeFontBold};
  color: ${props => props.theme.colors.textColor};
  font-size: 18px;
  margin-top: 18px;
  margin-bottom: 15px;
`

const NewsDetailsContent: StyledComponent<{}, ThemeType, *> = styled.Text`
  font-family: ${props => props.theme.fonts.decorativeFontRegular};
  font-size: 16px;
  letter-spacing: 0.5px;
  line-height: 24px;
  text-align: ${props => contentAlignment(props.language)};
  color: ${props => props.theme.colors.textColor};
`

export type PropsType = {|
  path: ?string,
  newsList: Array<NewsModel | any>,
  cities: Array<CityModel>,
  cityCode: string,
  language: string,
  resourceCache: LanguageResourceCacheStateType,
  theme: ThemeType,
  t: TFunction,
  navigation: NavigationScreenProp<*>,
  selectedNewsType: string,
  contentLanguage: string,
  status: 'loading' | 'ready' | 'error' | 'success' | 'loadingMore',
  setFlatListRef: () => void,
  fetchMoreNews: () => void,
  navigateToNews: () => void,
  createNavigateToNews: (NavigateToNewsParamsType) => void
|}

/**
 * Displays a list of news or a single event, matching the route /<location>/<language>/events(/<id>)
 */
class NewsList extends React.PureComponent<PropsType> {
  navigateToNews = (cityCode: string, language: string, path: string) => () => {
    const { selectedNewsType } = this.props
    this.props.navigateToNews({
      cityCode,
      language,
      path,
      type: selectedNewsType
    })
  };

  renderNotItemsComponent = () => {
    const { t, theme } = this.props
    return <NoNews theme={theme}>{t('currentlyNoNews')}</NoNews>
  };

  rendersNewsListItem = (cityCode: string, language: string) => ({
    item: newsItem
  }) => {
    const { theme, selectedNewsType } = this.props
    const isTuNews = selectedNewsType === INTERNATIONAL
    return (
      <NewsListItem
        key={newsItem.id}
        newsItem={newsItem}
        language={language}
        theme={theme}
        isTuNews={isTuNews}
        navigateToNews={this.navigateToNews(
          cityCode,
          language,
          `${newsItem.id}`
        )}
      />
    )
  };

  render () {
    const {
      newsList,
      path,
      cityCode,
      language,
      theme,
      t,
      contentLanguage,
      status,
      fetchMoreNews,
      fetchNews,
      type: selectedNewsType
    } = this.props
    const isTuNews = selectedNewsType === INTERNATIONAL

    if (path) {
      const selectedNewsItem = newsList && newsList[0]
      if (selectedNewsItem) {
        const content = selectedNewsItem.content || ''
        const contentFooterIndex = content.indexOf('tünews')
        const contentExtraInfo = content.substring(contentFooterIndex)
        const splittedContent = content.split(contentExtraInfo)[0]

        return (
          <View style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                marginBottom: 10,
                paddingHorizontal: '5%'
              }}>
              {isTuNews && (
                <HeaderImageWrapper>
                  <HeaderImage source={headerImage} />
                </HeaderImageWrapper>
              )}
              <Container>
                <NewsDetailsTitle theme={theme}>
                  {selectedNewsItem.title}
                </NewsDetailsTitle>
                <NewsDetailsContent theme={theme} language={language}>
                  {splittedContent || selectedNewsItem.message}
                </NewsDetailsContent>
              </Container>
              <Row theme={theme}>
                {contentExtraInfo ? (
                  <ExtraInfo theme={theme}>{contentExtraInfo}</ExtraInfo>
                ) : null}
              </Row>
            </ScrollView>
          </View>
        )
      }
      if (status === 'loading') {
        return <ActivityIndicator style={{ marginTop: 20 }} />
      }

      const error = new ContentNotFoundError({
        type: 'news',
        id: path,
        city: cityCode,
        language
      })
      return (
        <Failure
          errorMessage={error.message}
          code={ErrorCodes.PageNotFound}
          t={t}
          theme={theme}
        />
      )
    }

    return (
      <SpaceBetween>
        <View style={{ flex: 1 }}>
          <List
            setRef={this.props.setFlatListRef}
            renderNotItemsComponent={this.renderNotItemsComponent}
            items={newsList}
            isFetchingMore={status === 'loadingMore'}
            isFetching={status === 'loading'}
            getMoreItems={fetchMoreNews}
            fetchItems={fetchNews}
            renderItem={this.rendersNewsListItem(cityCode, contentLanguage)}
            theme={theme}
            status={status}
          />
        </View>
      </SpaceBetween>
    )
  }
}

const TranslatedWithThemeNewsList = withTranslation('news')(
  withTheme(props => props.language)(NewsList)
)
export default TranslatedWithThemeNewsList