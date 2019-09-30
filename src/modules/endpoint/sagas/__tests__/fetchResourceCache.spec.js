// @flow

import { expectSaga } from 'redux-saga-test-plan'
import fetchResourceCache, { type FetchMapType } from '../fetchResourceCache'
import DefaultDataContainer from '../../DefaultDataContainer'
import RNFetchBlob from '../../../../__mocks__/rn-fetch-blob'
import CategoriesMapModelBuilder from '../../../../testing/builder/CategoriesMapModelBuilder'
import { transform, forEach } from 'lodash'
import type { FileCacheStateType } from '../../../app/StateType'

jest.mock('../../../fetcher/FetcherModule')
jest.mock('rn-fetch-blob')

const createFetchMap = (resources: { [path: string]: FileCacheStateType }): FetchMapType => {
  return transform(resources, (result, value, path) => {
    forEach(value, (value, url) => {
      result[value.filePath] = [url, path, value.hash]
    })
    return result
  }, {})
}

describe('fetchResourceCache', () => {
  beforeEach(() => {
    RNFetchBlob.fs._reset()
  })

  const city = 'augsburg'
  const language = 'en'

  it('should fetch and create warning message', async () => {
    const spy = jest.spyOn(console, 'warn')

    const dataContainer = new DefaultDataContainer()

    const categoriesBuilder = new CategoriesMapModelBuilder(1, 2)
    const resources = categoriesBuilder.buildResources()
    const fetchMap = createFetchMap(resources)

    await expectSaga(fetchResourceCache, city, language, fetchMap, dataContainer)
      .not.put.like({ action: { type: 'FETCH_RESOURCES_FAILED' } })
      .run()

    const fetchedResources = await dataContainer.getResourceCache(city, language)

    if (fetchedResources.errorMessage !== undefined) {
      throw new Error('getResourceCache threw an error!')
    }

    expect(Object.keys(fetchedResources['/augsburg/de/category_0'])).toHaveLength(
      Object.keys(resources['/augsburg/de/category_0']).length - 1 /* The first url is excluded because the
                                                                      FetcherModule mock produced an error for it */
    )

    expect(Object.keys(fetchedResources['/augsburg/de/category_0/category_0'])).toHaveLength(
      Object.keys(resources['/augsburg/de/category_0/category_0']).length
    )

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to download https://integreat/title_0-0-300x300.png')
    )

    spy.mockRestore()
  })

  it('should put error if fetching fails', () => {
    const dataContainer = new DefaultDataContainer()

    const categoriesBuilder = new CategoriesMapModelBuilder(1, 2)
    const resources = categoriesBuilder.buildResources()
    const fetchMap = createFetchMap(resources)

    return expectSaga(fetchResourceCache, city, language, fetchMap, dataContainer)
      .provide({
        call: (effect, next) => {
          if (effect.fn.name === 'fetchAsync') {
            throw new Error('Jemand hat keine 4 Issues geschafft!')
          }
          return next()
        }
      })
      .put({
        type: 'FETCH_RESOURCES_FAILED',
        params: { message: 'Error in fetchResourceCache: Jemand hat keine 4 Issues geschafft!' }
      })
      .run()
  })
})