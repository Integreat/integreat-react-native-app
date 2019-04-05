// @flow

import {
  CategoriesMapModel,
  CategoryModel,
  CityModel,
  EventModel,
  LanguageModel
} from '@integreat-app/integreat-api-client'
import MemoryDatabaseContext from './MemoryDatabaseContext'
import type { ResourceCacheStateType } from '../app/StateType'
import RNFetchblob from 'rn-fetch-blob'
import {
  CONTENT_DIR_PATH, getResourceCacheFilesPath
} from '../platform/constants/webview'
import moment from 'moment'

type ContentCategoryJsonType = {|
  root: string,
  path: string,
  title: string,
  content: string,
  last_update: string,
  thumbnail: string,
  available_languages: { [code: string]: string },
  parent_path: string,
  children: Array<string>,
  order: number,
  hash: string
|}

type ResourceCacheJsonType = ResourceCacheStateType

const mapToObject = (map: Map<string, string>) => {
  const output = {}
  map.forEach((value, key) => { output[key] = value })
  return output
}

// TODO: Define interface for this class which makes sense for databases
class MemoryDatabase {
  context: MemoryDatabaseContext

  _cities: Array<CityModel>
  _categoriesMap: ?CategoriesMapModel
  _languages: Array<LanguageModel> | null
  _resourceCache: ResourceCacheStateType | null
  _events: ?Array<EventModel>

  loadCities (cities: Array<CityModel>) {
    this._cities = cities
  }

  changeContext (
    context: MemoryDatabaseContext
  ) {
    this.context = context
    this._languages = null
    this._categoriesMap = null
    this._resourceCache = {}
    this._events = null
  }

  hasContext (otherContext: MemoryDatabaseContext): boolean {
    return this.context &&
      this.context.languageCode === otherContext.languageCode &&
      this.context.cityCode === otherContext.cityCode
  }

  get cities (): Array<CityModel> {
    return this._cities
  }

  get categoriesMap (): CategoriesMapModel {
    if (this._categoriesMap === null) {
      throw Error('categories are null!')
    }
    return this._categoriesMap
  }

  set categoriesMap (categoriesMap: CategoriesMapModel) {
    if (this._categoriesMap !== null) {
      throw Error('categoriesMap has already been set on this context!')
    }
    this._categoriesMap = categoriesMap
  }

  get languages (): Array<LanguageModel> {
    if (this._languages === null) {
      throw Error('languages are null!')
    }
    return this._languages
  }

  set languages (languages: Array<LanguageModel>) {
    if (this._languages !== null) {
      throw Error('languages have already been set on this context!')
    }
    this._languages = languages
  }

  get events (): Array<EventModel> {
    if (!this._events) {
      throw Error('events are null!')
    }
    return this._events
  }

  set events (events: Array<EventModel>) {
    if (this._events !== null) {
      throw Error('events have already been set on this context!')
    }
    this._events = events
  }

  addCacheEntries (resourceCache: ResourceCacheStateType) {
    this._resourceCache = {...this._resourceCache, ...resourceCache}
  }

  get resourceCache (): ResourceCacheStateType {
    if (this._resourceCache === null) {
      throw Error('resourceCache is null!')
    }
    return this._resourceCache
  }

  getContentPath (key: string): string {
    if (!key) {
      throw Error('Key mustn\'t be empty')
    }

    return `${CONTENT_DIR_PATH}/${this.context.cityCode}/${this.context.languageCode}/${key}.json`
  }

  getResourceCachePath (): string {
    return getResourceCacheFilesPath(this.context.cityCode)
  }

  categoriesLoaded = () => this._categoriesMap !== null
  languagesLoaded = () => this._languages !== null
  eventsLoaded = () => this._events !== null

  /**
   * @returns {Promise<void>} which resolves to the number of bytes written or rejects
   */
  writeCategories = async () => {
    if (!this.categoriesMap) {
      console.warn('MemoryDatabase does not have data to save!')
      return
    }

    const categoryModels = this.categoriesMap.toArray()

    const jsonModels = categoryModels.map((category: CategoryModel): ContentCategoryJsonType => ({
      root: category.isRoot(),
      path: category.path,
      title: category.title,
      content: category.content,
      last_update: category.lastUpdate.toISOString(),
      thumbnail: category.thumbnail,
      available_languages: mapToObject(category.availableLanguages),
      parent_path: category.parentPath,
      children: this.categoriesMap.getChildren(category).map(category => category.path),
      order: category.order,
      hash: category.hash
    }))

    await this.writeFile(this.getContentPath('categories'), JSON.stringify(jsonModels))
  }

  readCategories = async () => {
    const path = this.getContentPath('categories')
    const fileExists: boolean = await RNFetchblob.fs.exists(path)

    if (!fileExists) {
      this._categoriesMap = null
      return
    }

    const json = JSON.parse(await this.readFile(path))

    this._categoriesMap = new CategoriesMapModel(json.map((jsonObject: ContentCategoryJsonType) => {
      return new CategoryModel({
        root: jsonObject.root,
        path: jsonObject.path,
        title: jsonObject.title,
        content: jsonObject.content,
        thumbnail: jsonObject.thumbnail,
        parentPath: jsonObject.parent_path,
        order: jsonObject.order,
        availableLanguages: new Map(Object.entries(jsonObject.available_languages)),
        lastUpdate: moment(jsonObject.last_update, moment.ISO_8601),
        hash: jsonObject.hash
      })
    }))
  }

  readLanguages = async () => {
    const path = this.getContentPath('languages')
    const fileExists: boolean = await RNFetchblob.fs.exists(path)

    if (!fileExists) {
      this._languages = null
      return
    }

    const languages = JSON.parse(await this.readFile(path))
    this._languages = languages.map(language => new LanguageModel(language._code, language._name))
  }

  writeLanguages = async () => {
    if (!this._languages) {
      console.warn('MemoryDatabase does not have data to save!')
      return
    }
    const path = this.getContentPath('languages')
    await this.writeFile(path, JSON.stringify(this._languages))
  }

  readEvents = async () => {
    const path = this.getContentPath('events')
    const fileExists: boolean = await RNFetchblob.fs.exists(path)

    if (!fileExists) {
      this._events = null
      return
    }

    this._events = JSON.parse(await this.readFile(path))
  }

  writeEvents = async () => {
    if (!this._events) {
      console.warn('MemoryDatabase does not have data to save!')
      return
    }
    const path = this.getContentPath('events')
    await this.writeFile(path, JSON.stringify(this._events))
  }

  readResourceCache = async () => {
    const path = this.getResourceCachePath()
    const fileExists: boolean = await RNFetchblob.fs.exists(path)

    if (!fileExists) {
      this._resourceCache = null
      return
    }

    this._resourceCache = JSON.parse(await this.readFile(path))
  }

  writeResourceCache = async () => {
    if (!this._resourceCache) {
      console.warn('MemoryDatabase does not have data to save!')
      return
    }

    const path = this.getResourceCachePath()
    // todo: use ResourceCacheJsonType

    // $FlowFixMe Resource cache will never be null here. Also this will probably soon be dealt with when mapping.
    const json: ResourceCacheJsonType = this._resourceCache
    await this.writeFile(path, JSON.stringify(json))
  }

  async readFile (path: string): Promise<string> {
    const jsonString: number[] | string = await RNFetchblob.fs.readFile(path, 'utf8')

    if (typeof jsonString !== 'string') {
      throw new Error('readFile did not return a string')
    }

    return jsonString
  }

  async writeFile (path: string, data: string): Promise<number> {
    return RNFetchblob.fs.writeFile(path, data, 'utf8')
  }
}

export default MemoryDatabase
