// @flow

import * as React from 'react'
import { ToastAndroid, TouchableOpacity } from 'react-native'
import LocationBig from '../assets/LocationBig.png'
import styled, { type StyledComponent } from 'styled-components/native'
import AppSettings from '../../../modules/settings/AppSettings'
import { baseUrl, liveBaseUrl, testBaseUrl } from '../../../modules/endpoint/constants'
import { Button } from 'react-native-elements'
import type { ThemeType } from '../../../modules/theme/constants/theme'
import moment from 'moment'
import type Moment from 'moment'

const API_URL_OVERRIDE_MIN_CLICKS = 10
const CLICK_TIMEOUT = 8

type StateType = {| clickCount: number, clickStart: ?Moment, apiUrlOverride: ?string |}

type PropsType = {|
  clearResourcesAndCache: () => void,
  theme: ThemeType
|}

const ApiUrlText = styled.Text`
padding-top: 10px;
color: red;
`

const LocationImage: StyledComponent<{}, ThemeType, *> = styled.Image`
  height: 70px;
  resize-mode: contain;
`

const Wrapper: StyledComponent<{| children: React.Node |}, {}, *> = styled.View`
  display: flex;
  flex-direction: column;
  align-items: center;
`

class Heading extends React.Component<PropsType, StateType> {
  constructor (props: PropsType) {
    super(props)
    this.state = { clickCount: 0, apiUrlOverride: null, clickStart: null }
  }

  componentDidMount () {
    const appSettings = new AppSettings()
    appSettings.loadApiUrlOverride().catch(() => {}).then(apiUrlOverride => this.setState({ apiUrlOverride }))
  }

  onImagePress = async () => {
    const prevClickCount = this.state.clickCount
    const clickStart = this.state.clickStart
    const clickedInTimeInterval = clickStart && clickStart.isAfter(moment().subtract(CLICK_TIMEOUT, 's'))

    if (prevClickCount + 1 >= API_URL_OVERRIDE_MIN_CLICKS && clickedInTimeInterval) {
      const appSettings = new AppSettings()
      const apiUrlOverride = await appSettings.loadApiUrlOverride()
      const newApiUrl = (apiUrlOverride === testBaseUrl) || (!apiUrlOverride && baseUrl === testBaseUrl) ? liveBaseUrl : testBaseUrl

      await appSettings.setApiUrlOverride(newApiUrl)
      this.setState({ clickCount: 0, clickStart: null })
      this.props.clearResourcesAndCache()

      console.debug(`Switching to new API-Url: ${newApiUrl}`)
      this.showApiUrlToast(newApiUrl)
    } else {
      const newClickStart = clickedInTimeInterval ? clickStart : moment()
      const newClickCount = clickedInTimeInterval ? prevClickCount + 1 : 1
      this.setState({ clickCount: newClickCount, clickStart: newClickStart })
    }
  }

  showApiUrlToast = (apiUrl: string) => ToastAndroid.show(`Switched to new API-Url: ${apiUrl}`, ToastAndroid.LONG)

  switchApi = async () => {
    const appSettings = new AppSettings()
    await appSettings.setApiUrlOverride(baseUrl)
    this.setState({ clickCount: 0 })
    this.props.clearResourcesAndCache()
    this.showApiUrlToast(baseUrl)
  }

  renderApiUrlText = () => {
    const theme = this.props.theme
    const apiUrlOverride = this.state.apiUrlOverride
    if (apiUrlOverride && apiUrlOverride !== baseUrl) {
      return (
        <>
          <ApiUrlText>{`Currently using API: ${apiUrlOverride.toString()}`}</ApiUrlText>
          <Button titleStyle={{ color: theme.colors.textColor }}
                  buttonStyle={{ backgroundColor: theme.colors.themeColor, marginTop: 10 }}
                  onPress={this.switchApi} title={'Switch back to default API'} />
        </>
      )
    }
  }

  render () {
    return (
      <Wrapper>
        <TouchableOpacity activeOpacity={1} onPress={this.onImagePress}>
          <LocationImage source={LocationBig} />
        </TouchableOpacity>
        {this.renderApiUrlText()}
      </Wrapper>
    )
  }
}

export default Heading
