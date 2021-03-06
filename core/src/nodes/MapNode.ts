import { INode, Base } from './Node'
import { ValidationOption } from '../ValidationOption'
import { quoteString } from '../utils'

export type IMap = {
  [name: string]: any
}

type MapNodeConfig = {
  validation?: ValidationOption
}

/**
 * Map nodes similar to list nodes, but a string key is required to add children
 */
export const MapNode = (keys: INode<string>, children: INode, config?: MapNodeConfig): INode<IMap> => {
  return {
    ...Base,
    type: () => 'map',
    default: () => ({}),
    navigate(path, index) {
      const nextIndex = index + 1
      const pathElements = path.getArray()
      if (pathElements.length <= nextIndex) {
        return this
      }
      return children.navigate(path, nextIndex)
    },
    pathPush(path, key) {
      return path.modelPush(key)
    },
    transform(path, value) {
      if (value === undefined) return undefined
      let res: any = {}
      Object.keys(value).forEach(f =>
        res[f] = children.transform(path.push(f), value[f])
      )
      return res;
    },
    render(path, value, mounter) {
      const onAdd = mounter.registerClick(el => {
        const key = keys.getState(el.parentElement!)
        path.model.set(path.push(key), children.default())
      })
      const suffix = `${keys.renderRaw(path, mounter)}<button class="add" data-id="${onAdd}"></button>${mounter.nodeInjector(path, mounter)}`
      let body = ''
      if (typeof value === 'object' && value !== undefined) {
        body = Object.keys(value)
          .map(key => {
            const removeId = mounter.registerClick(el => path.model.set(path.push(key), undefined))
            const childPath = path.modelPush(key)
            const category = children.category(childPath)
            const [cPrefix, cSuffix, cBody] = children.render(childPath, value[key], mounter)
            return `<div class="node-entry"><div class="node ${children.type(childPath)}-node" ${category ? `data-category="${category}"` : ''} ${childPath.error()} ${childPath.help()}>
              <div class="node-header">
                <button class="remove" data-id="${removeId}"></button>
                ${cPrefix}
                <label>${key}</label>
                ${cSuffix}
              </div>
              ${cBody ? `<div class="node-body">${cBody}</div>` : ''}
              </div></div>`
          })
          .join('')
      }
      return ['', suffix, body]
    },
    suggest: (path) => keys
      .suggest(path, '')
      .map(quoteString),
    validate(path, value, errors, options) {
      if (options.loose && typeof value !== 'object') {
        value = this.default()
      }
      if (value === null || typeof value !== 'object') {
        errors.add(path, 'error.expected_object')
        return value
      }
      let res: any = {}
      Object.keys(value).forEach(k => {
        keys.validate(path, k, errors, options)
        res[k] = children.validate(path.push(k), value[k], errors, options)
      })
      return res
    },
    validationOption(path) {
      return config?.validation ?? keys.validationOption(path.push(''))
    }
  }
}
